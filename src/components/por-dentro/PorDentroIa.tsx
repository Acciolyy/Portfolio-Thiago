"use client";

import { useRef, useState } from "react";
import { galeriaIa } from "@/content/por-dentro/galeria-ia";
import { useTema } from "@/components/tema/useTema";
import VideoMudo from "@/components/ui/VideoMudo";

// Galeria com abas, uma por algoritmo com GIF nos READMEs do portfolio-ia
// (convertidos para WebM, versão clara ou escura conforme o tema). Abas no
// padrão WAI-ARIA: setas trocam de aba, Home/End vão às pontas.
export default function PorDentroIa() {
  const [atual, setAtual] = useState(0);
  const abas = useRef<(HTMLButtonElement | null)[]>([]);
  const tema = useTema();
  const item = galeriaIa[atual];
  const sufixo = tema === "light" ? "light" : "dark";

  const aoTeclar = (e: React.KeyboardEvent, i: number) => {
    const n = galeriaIa.length;
    let novo = -1;
    if (e.key === "ArrowRight") novo = (i + 1) % n;
    if (e.key === "ArrowLeft") novo = (i - 1 + n) % n;
    if (e.key === "Home") novo = 0;
    if (e.key === "End") novo = n - 1;
    if (novo < 0) return;
    e.preventDefault();
    setAtual(novo);
    abas.current[novo]?.focus();
  };

  return (
    <div className="galeria">
      <div role="tablist" aria-label="Algoritmos" className="galeria__abas">
        {galeriaIa.map((g, i) => (
          <button
            key={g.id}
            ref={(el) => {
              abas.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`aba-${g.id}`}
            aria-selected={i === atual}
            aria-controls={`painel-${g.id}`}
            tabIndex={i === atual ? 0 : -1}
            className="galeria__aba colchetes"
            onClick={() => setAtual(i)}
            onKeyDown={(e) => aoTeclar(e, i)}
          >
            {g.aba}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`painel-${item.id}`} aria-labelledby={`aba-${item.id}`} className="galeria__painel">
        <figure className="galeria__figura">
          <VideoMudo
            key={`${item.id}-${sufixo}`}
            src={`/projetos/ia/${item.arquivo}-${sufixo}.webm`}
            poster={`/projetos/ia/${item.arquivo}-${sufixo}.jpg`}
            descricao={item.descricao}
          />
          <figcaption className="galeria__legenda">{item.legenda}</figcaption>
        </figure>
        <p className="galeria__metrica">
          <span className="rot">leitura</span>
          <span className="galeria__valor">{item.metrica}</span>
        </p>
      </div>
    </div>
  );
}
