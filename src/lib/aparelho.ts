// Camada de movimento "aparelho tático". Carregada por import dinâmico depois
// do load (components/Aparelho.tsx), fora do JS inicial. Com
// prefers-reduced-motion nada aqui roda: o conteúdo final já está no HTML.
//
// Cada efeito roda uma vez por elemento, na primeira vez que ele entra na
// tela, e dura no máximo ~800 ms. Nenhum efeito mexe no texto que o React
// renderizou: o embaralhado e a contagem são uma camada por cima
// (aria-hidden), com o texto original transparente por baixo, então o leitor
// de tela e quem não roda JS sempre recebem o texto final.

const DURACAO_LIGAR = 700;
const DURACAO_TEXTO = 600;
const SIMBOLOS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/";

const reduzido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

function umaVezNaTela(alvos: Element[], fazer: (el: HTMLElement) => void) {
  const obs = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        obs.unobserve(e.target);
        fazer(e.target as HTMLElement);
      }
    },
    { threshold: 0.2 },
  );
  alvos.forEach((a) => obs.observe(a));
  return () => obs.disconnect();
}

// Camada aria-hidden por cima do elemento; o texto real fica transparente.
function camada(el: HTMLElement) {
  const sobre = document.createElement("span");
  sobre.className = "aparelho-camada";
  sobre.style.color = getComputedStyle(el).color;
  sobre.setAttribute("aria-hidden", "true");
  el.classList.add("aparelho-alvo");
  el.appendChild(sobre);
  return {
    escrever: (t: string) => (sobre.textContent = t),
    remover: () => {
      sobre.remove();
      el.classList.remove("aparelho-alvo");
    },
  };
}

// 2. Decodificação: os caracteres embaralham e resolvem no texto final.
function decodificar(el: HTMLElement) {
  const final = el.textContent ?? "";
  if (!final.trim()) return;
  const c = camada(el);
  const inicio = performance.now();
  const passo = (agora: number) => {
    const p = Math.min(1, (agora - inicio) / DURACAO_TEXTO);
    const fixos = Math.floor(final.length * p);
    let s = "";
    for (let i = 0; i < final.length; i++) {
      const ch = final[i];
      s += i < fixos || ch === " " ? ch : SIMBOLOS[(Math.random() * SIMBOLOS.length) | 0];
    }
    c.escrever(s);
    if (p < 1) requestAnimationFrame(passo);
    else c.remover();
  };
  requestAnimationFrame(passo);
}

// 3. Contagem: cada número do texto conta de 0 até o valor final, com as
// mesmas casas decimais e a vírgula.
function contar(el: HTMLElement) {
  const final = el.textContent ?? "";
  const numeros = [...final.matchAll(/\d+(?:,\d+)?/g)];
  if (!numeros.length) return;
  const c = camada(el);
  const inicio = performance.now();
  const passo = (agora: number) => {
    const p = Math.min(1, (agora - inicio) / DURACAO_TEXTO);
    const k = 1 - Math.pow(1 - p, 3);
    let s = "", ult = 0;
    for (const m of numeros) {
      const txt = m[0];
      const casas = txt.includes(",") ? txt.split(",")[1].length : 0;
      const v = parseFloat(txt.replace(",", ".")) * k;
      s += final.slice(ult, m.index) + v.toFixed(casas).replace(".", ",");
      ult = (m.index ?? 0) + txt.length;
    }
    c.escrever(s + final.slice(ult));
    if (p < 1) requestAnimationFrame(passo);
    else c.remover();
  };
  requestAnimationFrame(passo);
}

// 1. Painel ligando: linha horizontal, abertura vertical, cantoneiras se
// encaixando e uma cintilação curta do conteúdo (CSS em styles/aparelho.css).
function ligar(el: HTMLElement) {
  el.setAttribute("data-ligando", "");
  el.removeAttribute("data-desligado");
  window.setTimeout(() => el.removeAttribute("data-ligando"), DURACAO_LIGAR + 50);
}

// 4. Inclinação 3D no hover (ponteiro fino), até 4°, com reflexo de luz.
function inclinar(cards: HTMLElement[]) {
  const limpar: (() => void)[] = [];
  for (const el of cards) {
    const mover = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || el.hasAttribute("data-ativo")) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 4}deg) rotateY(${(x - 0.5) * 4}deg)`;
      el.style.setProperty("--luz-x", `${x * 100}%`);
      el.style.setProperty("--luz-y", `${y * 100}%`);
      el.setAttribute("data-inclinado", "");
    };
    const sair = () => {
      el.style.transform = "";
      el.removeAttribute("data-inclinado");
    };
    el.addEventListener("pointermove", mover);
    el.addEventListener("pointerleave", sair);
    limpar.push(() => {
      el.removeEventListener("pointermove", mover);
      el.removeEventListener("pointerleave", sair);
      sair();
    });
  }
  return () => limpar.forEach((f) => f());
}

export function iniciar(): () => void {
  if (reduzido()) return () => {};
  const limpar: (() => void)[] = [];

  // Painéis: os que ainda não estão na tela esperam "desligados".
  const paineis = [...document.querySelectorAll<HTMLElement>("main .card, main .painel, .rodape__painel")];
  const alturaTela = innerHeight;
  for (const p of paineis) if (p.getBoundingClientRect().top > alturaTela) p.setAttribute("data-desligado", "");
  limpar.push(umaVezNaTela(paineis, ligar));

  // Títulos de seção e rótulos de telemetria das seções.
  const textos = [
    ...document.querySelectorAll<HTMLElement>(
      ".secao__titulos .h-sec, .secao__titulos .rot, .sobre__texto .rot, .sobre__texto .h-sec, .rodape__texto .rot, .rodape__titulo, .caso .h-sec",
    ),
  ];
  limpar.push(umaVezNaTela(textos, decodificar));

  // Métricas.
  limpar.push(umaVezNaTela([...document.querySelectorAll<HTMLElement>(".metr__valor, .resumo__valor")], contar));

  // Inclinação: só com ponteiro fino, e nunca na demo (desenho precisa de mira).
  if (matchMedia("(pointer: fine)").matches) {
    const cards = [...document.querySelectorAll<HTMLElement>("main .card:not(.demo)")];
    limpar.push(inclinar(cards));
  }

  return () => {
    limpar.forEach((f) => f());
    document.querySelectorAll("[data-desligado]").forEach((el) => el.removeAttribute("data-desligado"));
  };
}
