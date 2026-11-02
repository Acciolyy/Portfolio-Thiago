"use client";

import { useEffect, useRef, useState } from "react";
import { experiencia } from "@/content/home";
import Rotulo from "@/components/ui/Rotulo";

// Experiência como "git log --graph": o mais recente em cima, a UnB como
// tronco. Os ramos se desenham conforme a seção passa pela tela (com
// movimento reduzido, já desenhados). Clicar num commit mostra os detalhes:
// ao lado no desktop, logo abaixo do commit no celular.

const LINHA = 88; // altura de cada commit no grafo
const X = [14, 38, 62, 86]; // trilhas
const LARGURA = 104;
const c = (i: number) => LINHA / 2 + i * LINHA;

// Ordem dos commits (de cima para baixo, o mais recente primeiro) e trilha
// de cada um: monitoria, miniclient, Senado, Orc'estra e a UnB como tronco.
const TRILHA: Record<string, number> = { monitoria: 1, miniclient: 3, senado: 2, orcestra: 1, unb: 0 };

// Cada caminho começa no ponto mais antigo (embaixo), para se desenhar de
// baixo para cima, como a história. Nenhum ramo cruza outro.
const sobe = (de: number, para: number, y: number) =>
  `M${X[de]} ${y + 40} C${X[de]} ${y + 28} ${X[para]} ${y + 32} ${X[para]} ${y + 20} L${X[para]} 0`;
const bolha = (de: number, para: number, y: number) =>
  `M${X[de]} ${y + 34} C${X[de]} ${y + 22} ${X[para]} ${y + 26} ${X[para]} ${y + 14} L${X[para]} ${y - 14} C${X[para]} ${y - 26} ${X[de]} ${y - 22} ${X[de]} ${y - 34}`;

const RAMOS = [
  { id: "unb", d: `M${X[0]} ${c(4)} L${X[0]} 0` },
  { id: "orcestra", d: bolha(0, 1, c(3)) },
  { id: "senado", d: sobe(0, 2, c(2)) },
  { id: "miniclient", d: sobe(2, 3, c(1)) },
  { id: "monitoria", d: sobe(0, 1, c(0)) },
];

export default function Experiencia() {
  const { commits } = experiencia;
  const [atual, setAtual] = useState("senado");
  const grafo = useRef<SVGSVGElement>(null);

  // Desenha os ramos com a rolagem.
  useEffect(() => {
    const svg = grafo.current;
    if (!svg) return;
    const caminhos = [...svg.querySelectorAll<SVGPathElement>("path[data-ramo]")];
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      caminhos.forEach((p) => (p.style.strokeDashoffset = "0"));
      return;
    }
    let raf = 0;
    const atualizar = () => {
      raf = 0;
      const r = svg.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.9 - r.top) / (r.height + innerHeight * 0.3)));
      caminhos.forEach((el) => (el.style.strokeDashoffset = String(1 - p)));
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(atualizar);
    };
    atualizar();
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", pedir);
      window.removeEventListener("resize", pedir);
    };
  }, []);

  const sel = commits.find((x) => x.id === atual)!;

  return (
    <section id="experiencia" className="wrap secao secao--exp" aria-labelledby="h-exp">
      <div className="secao__titulos">
        <Rotulo n="03">{experiencia.rotulo}</Rotulo>
        <h2 id="h-exp" className="h-sec">
          {experiencia.titulo}
        </h2>
      </div>

      <div className="gitlog">
        <div className="gitlog__grafo">
          <svg
            ref={grafo}
            className="gitlog__svg"
            width={LARGURA}
            height={commits.length * LINHA}
            viewBox={`0 0 ${LARGURA} ${commits.length * LINHA}`}
            aria-hidden="true"
          >
            {RAMOS.map((r) => (
              <path key={r.id} d={r.d} data-ramo={r.id} pathLength={1} className="gitlog__ramo" />
            ))}
            {commits.map((cm, i) => {
              const x = X[TRILHA[cm.id]];
              const y = c(i);
              return (
                <g key={cm.id} className="gitlog__no" data-atual={cm.id === atual || undefined}>
                  <rect x={x - 5} y={y - 5} width={10} height={10} />
                  <path d={`M${x - 9} ${y - 5} V${y - 9} H${x - 5} M${x + 5} ${y - 9} H${x + 9} V${y - 5} M${x + 9} ${y + 5} V${y + 9} H${x + 5} M${x - 5} ${y + 9} H${x - 9} V${y + 5}`} />
                </g>
              );
            })}
          </svg>

          <ol className="gitlog__commits">
            {commits.map((cm) => {
              const aberto = cm.id === atual;
              return (
                <li key={cm.id} className="gitlog__item">
                  <button
                    type="button"
                    className="gitlog__commit"
                    aria-expanded={aberto}
                    aria-controls={`det-${cm.id}`}
                    onClick={() => setAtual(cm.id)}
                  >
                    <span className="gitlog__data">{cm.periodo ?? cm.ramo}</span>
                    <span className="gitlog__titulo">
                      {cm.titulo} <span>· {cm.papel}</span>
                    </span>
                  </button>
                  {/* no celular, os detalhes abrem aqui mesmo */}
                  <div id={`det-${cm.id}`} className="gitlog__inline" hidden={!aberto}>
                    <p>{cm.detalhe}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="painel gitlog__detalhe" aria-live="polite" data-ativo>
          <p className="rot">
            {sel.ramo} {sel.periodo ? `· ${sel.periodo}` : ""}
          </p>
          <h3 className="gitlog__det-titulo">
            {sel.titulo} <span>· {sel.papel}</span>
          </h3>
          <p className="gitlog__det-texto">{sel.detalhe}</p>
        </div>
      </div>
    </section>
  );
}
