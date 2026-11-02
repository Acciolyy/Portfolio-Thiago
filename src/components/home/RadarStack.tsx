"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ItemStack = {
  nome: string;
  camada: string;
  repos: string[];
  usos: { repo: string; versao: string | null; arquivo: string }[];
  destaque: boolean;
  principal: boolean;
};

type Props = {
  itens: ItemStack[];
  camadas: string[]; // a primeira (Python) fica no centro; as outras são fatias
  projetos: Record<string, { nome: string; href: string }>;
  legenda: string;
  dica: string;
};

// Radar da stack em setores: uma fatia por camada, Python no centro. Cada
// tecnologia é um ponto na fatia da sua camada; quanto mais repositórios a
// usam (dado do stack.json), mais perto do centro e maior o ponto. O feixe
// gira sem parar (uma volta a cada 5 s, com rastro em gradiente) e acende os
// pontos por onde passa. Pausa fora da tela e com a aba oculta; com
// prefers-reduced-motion nada gira e os pontos ficam parados.

const VW = 600; // viewBox largo: folga dos lados para os nomes das camadas
const VH = 440;
const CX = VW / 2;
const C = VH / 2; // centro vertical (e raio de referência)
const R = 172; // raio do radar
const R_CENTRO = 26;
const VOLTA_MS = 5000;
const RASTRO = 14; // fatias do rastro do feixe
const POR_CAMADA = 6; // destaques por camada no manifesto, antes de "ver todas"

const grau = (a: number) => (a * Math.PI) / 180;
const ponto = (ang: number, r: number) => ({ x: CX + Math.cos(grau(ang)) * r, y: C + Math.sin(grau(ang)) * r });
const fatia = (a0: number, a1: number, r: number) => {
  const p0 = ponto(a0, r), p1 = ponto(a1, r);
  return `M${CX} ${C} L${p0.x} ${p0.y} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1.x} ${p1.y} Z`;
};

const versoes = (i: ItemStack) => [...new Set(i.usos.map((u) => u.versao).filter(Boolean))].join(" / ");

export default function RadarStack({ itens, camadas, projetos, legenda, dica }: Props) {
  const [sel, setSel] = useState<string | null>(null);
  const [todas, setTodas] = useState(false);
  const [foco, setFoco] = useState(0);
  const [ligado, setLigado] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const feixe = useRef<SVGGElement>(null);
  const pontos = useRef<(HTMLButtonElement | null)[]>([]);

  const fatias = camadas.slice(1);
  const passo = 360 / fatias.length;
  const inicio = -90; // a primeira fatia começa no topo

  // posição de cada ponto: ângulo dentro da fatia, raio pelo número de repos
  // a escala ignora o Python, que fica no centro
  const maxRepos = Math.max(...itens.filter((i) => i.camada !== camadas[0]).map((i) => i.repos.length));
  const posicoes = useMemo(() => {
    const porCamada: Record<string, ItemStack[]> = {};
    itens.forEach((i) => (porCamada[i.camada] ??= []).push(i));
    return itens.map((i) => {
      const k = fatias.indexOf(i.camada);
      if (k < 0) return { x: CX, y: C, ang: 0, tam: 7 };
      const grupo = porCamada[i.camada];
      const j = grupo.indexOf(i);
      const a0 = inicio + k * passo + 7;
      const ang = a0 + ((j + 0.5) / grupo.length) * (passo - 14);
      const n = i.repos.length;
      const perto = maxRepos > 1 ? (n - 1) / (maxRepos - 1) : 0;
      const r = R_CENTRO + 22 + (1 - perto) * (R - R_CENTRO - 40) + (j % 3) * 7 - 7;
      return { ...ponto(ang, r), ang: (ang + 360) % 360, tam: 3.5 + n * 1.4 };
    });
  }, [itens, fatias, passo, maxRepos, inicio]);

  // o manifesto "instala" uma vez, quando o painel aparece
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLigado(true);
          obs.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // feixe contínuo; acende os pontos por onde passa
  useEffect(() => {
    const el = raiz.current;
    const g = feixe.current;
    if (!el || !g || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let visivel = false;
    let raf = 0;
    let ultimoAng = -1;
    let t0 = performance.now();
    let pausadoEm = 0;
    const laco = (agora: number) => {
      raf = requestAnimationFrame(laco);
      const ang = ((((agora - t0) % VOLTA_MS) / VOLTA_MS) * 360 + inicio + 360) % 360;
      g.setAttribute("transform", `rotate(${ang} ${CX} ${C})`);
      if (ultimoAng >= 0) {
        posicoes.forEach((p, k) => {
          if (k === 0 && itens[0]?.camada === camadas[0]) return; // Python, no centro
          const passou = ultimoAng <= ang ? p.ang > ultimoAng && p.ang <= ang : p.ang > ultimoAng || p.ang <= ang;
          if (!passou) return;
          const b = pontos.current[k];
          if (!b) return;
          b.removeAttribute("data-aceso");
          void b.offsetWidth; // reinicia a animação
          b.setAttribute("data-aceso", "");
        });
      }
      ultimoAng = ang;
    };
    const atualizar = () => {
      const rodar = visivel && !document.hidden;
      if (rodar && !raf) {
        if (pausadoEm) t0 += performance.now() - pausadoEm; // retoma de onde parou
        pausadoEm = 0;
        ultimoAng = -1;
        raf = requestAnimationFrame(laco);
      } else if (!rodar && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
        pausadoEm = performance.now();
      }
    };
    const obs = new IntersectionObserver(([e]) => {
      visivel = e.isIntersecting;
      atualizar();
    });
    obs.observe(el);
    document.addEventListener("visibilitychange", atualizar);
    return () => {
      obs.disconnect();
      document.removeEventListener("visibilitychange", atualizar);
      cancelAnimationFrame(raf);
    };
  }, [posicoes, itens, camadas, inicio]);

  const filtrados = sel ? itens.filter((i) => i.nome === sel) : itens;
  const visiveis = (camada: string) => {
    const g = filtrados.filter((i) => i.camada === camada);
    if (todas || sel) return g;
    return g.filter((i) => i.destaque).slice(0, POR_CAMADA);
  };
  const escondidos = itens.length - camadas.reduce((n, c) => n + visiveis(c).length, 0);
  const atual = sel ? itens.find((i) => i.nome === sel) : null;

  const escolher = (nome: string) => setSel((s) => (s === nome ? null : nome));

  const aoTeclar = (e: React.KeyboardEvent, i: number) => {
    let n = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (i + 1) % itens.length;
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = (i - 1 + itens.length) % itens.length;
    if (n < 0) return;
    e.preventDefault();
    setFoco(n);
    pontos.current[n]?.focus();
  };

  let linha = 0;

  return (
    <div className="radar" ref={raiz} data-ligado={ligado || undefined}>
      <div className="painel radar__painel">
        <p className="rot radar__cabeca">
          radar · {itens.length} tecnologias · {fatias.length} camadas
        </p>
        <div className="radar__tela">
          <svg viewBox={`0 0 ${VW} ${VH}`} className="radar__svg" aria-hidden="true">
            <circle cx={CX} cy={C} r={R} className="radar__borda" />
            <circle cx={CX} cy={C} r={R * 0.66} className="radar__guia" />
            <circle cx={CX} cy={C} r={R * 0.33} className="radar__guia" />
            {fatias.map((c, k) => {
              const a = inicio + k * passo;
              const p = ponto(a, R);
              return <line key={c} x1={CX} y1={C} x2={p.x} y2={p.y} className="radar__divisoria" />;
            })}
            {/* feixe com rastro: fatias finas de opacidade decrescente */}
            <g ref={feixe} className="radar__feixe" transform={`rotate(${inicio} ${CX} ${C})`}>
              {Array.from({ length: RASTRO }, (_, k) => (
                <path key={k} d={fatia(-(k + 1) * 4, -k * 4, R)} style={{ opacity: 0.22 * (1 - k / RASTRO) }} />
              ))}
              <line x1={CX} y1={C} x2={CX + R} y2={C} className="radar__linha-feixe" />
            </g>
            <circle cx={CX} cy={C} r={R_CENTRO} className="radar__centro" />
            {fatias.map((c, k) => {
              const meio = inicio + (k + 0.5) * passo;
              const p = ponto(meio, R + 16);
              const cosA = Math.cos(grau(meio));
              const ancora = Math.abs(cosA) < 0.2 ? "middle" : cosA > 0 ? "start" : "end";
              const sinA = Math.sin(grau(meio));
              return (
                <text
                  key={c}
                  x={p.x}
                  y={p.y + (sinA > 0.5 ? 10 : sinA < -0.5 ? -14 : -4)}
                  textAnchor={ancora}
                  className="radar__nome-camada"
                >
                  {/* em duas linhas no " e ", para caber legível no celular */}
                  {c.split(/ (?=e )/).length > 1
                    ? [c.slice(0, c.indexOf(" e ") + 2), c.slice(c.indexOf(" e ") + 3)].map((t, i) => (
                        <tspan key={t} x={p.x} dy={i ? "1.15em" : 0}>
                          {t}
                        </tspan>
                      ))
                    : c}
                </text>
              );
            })}
          </svg>
          {itens.map((i, k) => {
            const p = posicoes[k];
            const centro = i.camada === camadas[0];
            return (
              <button
                key={i.nome}
                ref={(el) => {
                  pontos.current[k] = el;
                }}
                type="button"
                className="radar__ponto"
                data-centro={centro || undefined}
                style={
                  {
                    left: `${(p.x / VW) * 100}%`,
                    top: `${(p.y / VH) * 100}%`,
                    "--tam": `${p.tam}px`,
                  } as React.CSSProperties
                }
                aria-pressed={sel === i.nome}
                aria-label={`${i.nome}, ${i.camada}, ${i.repos.length} ${i.repos.length === 1 ? "repositório" : "repositórios"}`}
                tabIndex={k === foco ? 0 : -1}
                onClick={() => escolher(i.nome)}
                onFocus={() => setFoco(k)}
                onKeyDown={(e) => aoTeclar(e, k)}
              >
                <span className="radar__rotulo" aria-hidden="true">
                  {i.nome}
                </span>
              </button>
            );
          })}
        </div>
        <p className="radar__legenda">{legenda}</p>
        <p className="rot radar__dica">{dica}</p>
      </div>

      <div className="painel manifesto">
        <div className="manifesto__barra">
          <h3 className="hud-rotulo">Manifesto de dependências</h3>
          {sel && (
            <button type="button" className="btn colchetes manifesto__limpar" onClick={() => setSel(null)}>
              Mostrar tudo
            </button>
          )}
        </div>
        {atual && (
          <div className="manifesto__projetos" aria-live="polite">
            <p className="rot">onde {atual.nome} aparece</p>
            <ul>
              {atual.repos.map((r) => (
                <li key={r}>
                  <a href={projetos[r]?.href ?? "#"} className="colchetes">
                    {projetos[r]?.nome ?? r}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="manifesto__terminal" role="list" aria-label="Dependências por camada">
          {camadas.map((c) => {
            const g = visiveis(c);
            if (!g.length) return null;
            return (
              <div key={c} role="listitem" className="manifesto__grupo">
                <p className="manifesto__camada"># {c}</p>
                <ul>
                  {g.map((i) => (
                    <li key={i.nome} className="manifesto__linha" style={{ animationDelay: `${linha++ * 0.025}s` }}>
                      <span className="manifesto__nome">{i.nome.toLowerCase()}</span>
                      {versoes(i) && <span className="manifesto__versao"> {versoes(i)}</span>}
                      <span className="manifesto__ok"> ✓</span>
                      <span className="manifesto__repos"> · {i.repos.join(", ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        {!sel && (
          <button type="button" className="btn colchetes" onClick={() => setTodas((t) => !t)} aria-expanded={todas}>
            {todas ? "ver as principais" : `ver todas (${itens.length})`}
          </button>
        )}
        {!sel && !todas && escondidos > 0 && <p className="rot">{escondidos} ocultas</p>}
        <p className="manifesto__fonte">
          Lido de requirements*.txt, pyproject.toml e package.json dos repositórios públicos; Senado Federal e ImóvelDF
          são privados e entram à mão. Só dependências diretas.
        </p>
      </div>
    </div>
  );
}
