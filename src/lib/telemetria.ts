/* Telemetria: dado real da API pública do GitHub, sem token.

   Tudo parte de uma única listagem dos repositórios, ordenada por push:

     REPOS         -> quantos repositórios públicos a listagem devolve
     ULT. COMMIT   -> pushed_at mais recente entre os que não são fork
     COMMITS (30D) -> uma chamada por repositório com push na janela
     STACK         -> campo language do repositório com mais commits

   pushed_at chega alguns segundos depois do commit e vem de graça na
   listagem, então evita uma chamada por repositório só para ler a data.

   A contagem de commits usa per_page=1 e lê o número da última página no
   cabeçalho Link. Assim o repositório com 66 commits custa a mesma resposta
   minúscula do que tem 1, e não existe teto de 100.

   Sem token a API libera 60 requisições por hora por IP. Uma carga fria gasta
   1 + o número de repositórios ativos no mês. Por isso o resultado fica em
   localStorage por 1 hora: sessionStorage morreria a cada aba nova e algumas
   aberturas já zerariam a cota do IP.

   Qualquer falha cai para o último valor guardado. Sem valor guardado, os
   números estáticos do HTML ficam onde estão: sumir a faixa inteira abriria
   um buraco na hero, que é pior do que um número velho por uma hora. */

export type ItemTexto = { texto: string };
export type ItemNumero = { valor: number; decimais: number; sufixo: string };
export type ItemTelemetria = ItemTexto | ItemNumero;
export type Telemetria = Record<string, ItemTelemetria>;

type Repo = {
  name: string;
  fork: boolean;
  pushed_at: string;
  language: string | null;
};

const DONO = "Acciolyy";
const CACHE = "telemetria";
const VALIDADE = 3600000;
const GITHUB = "https://api.github.com";
const CABECALHO = { Accept: "application/vnd.github+json" };

async function api<T>(caminho: string): Promise<T> {
  const r = await fetch(GITHUB + caminho, { headers: CABECALHO });
  if (!r.ok) throw new Error("github " + r.status);
  return r.json() as Promise<T>;
}

function idade(iso: string): string {
  const horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (horas < 1) return "agora";
  if (horas < 24) return horas + "h";

  const dias = Math.floor(horas / 24);
  if (dias < 30) return dias + "d";

  const meses = Math.floor(dias / 30);
  return "há " + meses + (meses > 1 ? " meses" : " mês");
}

/* Conta sem baixar a lista: pede 1 por página e lê o rel="last" do Link.
   Repositório vazio devolve 409, e aí a conta dele é zero. */
async function contarCommits(repo: Repo, desde: string): Promise<number> {
  const url =
    GITHUB + "/repos/" + DONO + "/" + repo.name + "/commits?per_page=1&since=" + desde;

  try {
    const r = await fetch(url, { headers: CABECALHO });
    if (!r.ok) return 0;

    const link = r.headers.get("Link");
    const ultima = link && link.match(/[?&]page=(\d+)>;\s*rel="last"/);
    if (ultima) return Number(ultima[1]);

    const lista = (await r.json()) as unknown[];
    return lista.length;
  } catch {
    return 0;
  }
}

async function buscarNoGithub(): Promise<Telemetria> {
  const desde = new Date(Date.now() - 30 * 86400000).toISOString().replace(/\.\d+/, "");

  const todos = await api<Repo[]>("/users/" + DONO + "/repos?per_page=100&type=owner&sort=pushed");

  // fork não é trabalho meu; repositório parado não gasta requisição
  const meus = todos.filter((r) => !r.fork);
  const ativos = meus.filter((r) => r.pushed_at > desde);

  const ultimo = meus.reduce((mais, r) => (r.pushed_at > mais ? r.pushed_at : mais), "");

  const contagens = await Promise.all(ativos.map((r) => contarCommits(r, desde)));

  let total = 0;
  let lider: Repo | null = null;
  let recorde = -1;

  contagens.forEach((n, i) => {
    total += n;
    // o repo de perfil não tem linguagem, então não pode virar a stack
    if (n > recorde && ativos[i].language) {
      recorde = n;
      lider = ativos[i];
    }
  });

  return {
    ultimoCommit: { texto: ultimo ? idade(ultimo) : "--" },
    repos: { valor: todos.length, decimais: 0, sufixo: "" },
    commits30d: { valor: total, decimais: 0, sufixo: "" },
    stack: { texto: (lider as Repo | null)?.language ?? "Python" },
  };
}

type Guardado = { t: number; d: Telemetria };

function lerCache(): Guardado | null {
  try {
    const bruto = localStorage.getItem(CACHE);
    return bruto ? (JSON.parse(bruto) as Guardado) : null;
  } catch {
    return null;
  }
}

function gravarCache(dados: Telemetria) {
  try {
    localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), d: dados }));
  } catch {
    /* aba anônima sem storage, segue o jogo */
  }
}

export async function carregarTelemetria(): Promise<Telemetria | null> {
  const guardado = lerCache();

  if (guardado && Date.now() - guardado.t < VALIDADE) {
    return guardado.d;
  }

  try {
    const dados = await buscarNoGithub();
    gravarCache(dados);
    return dados;
  } catch {
    return guardado ? guardado.d : null;
  }
}
