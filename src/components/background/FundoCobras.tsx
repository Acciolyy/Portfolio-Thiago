"use client";

import { useEffect, useRef } from "react";

// Fundo de ambientação, decoração pura (fora da árvore de acessibilidade).
// O módulo das cobras (lib/fundo/cobras.ts, Canvas 2D) é baixado por import
// dinâmico depois do load, com o navegador ocioso, fora do bundle inicial.
// Com prefers-reduced-motion ele desenha um quadro parado e para.
export default function FundoCobras() {
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelado = false;
    let limpar: (() => void) | undefined;

    const comecar = () => {
      import("@/lib/fundo/cobras")
        .then(({ iniciar }) => {
          if (cancelado || !tela.current) return;
          limpar = iniciar(tela.current);
        })
        .catch(() => {
          /* sem Canvas 2D: o site segue sem fundo */
        });
    };

    // O Safari não tem requestIdleCallback; lá vai um setTimeout curto.
    const temOcioso = typeof window.requestIdleCallback === "function";
    let ocioso = 0;
    const agendar = () => {
      ocioso = temOcioso ? requestIdleCallback(comecar, { timeout: 2000 }) : window.setTimeout(comecar, 300);
    };
    if (document.readyState === "complete") agendar();
    else window.addEventListener("load", agendar, { once: true });

    return () => {
      cancelado = true;
      window.removeEventListener("load", agendar);
      if (temOcioso) cancelIdleCallback(ocioso);
      else clearTimeout(ocioso);
      limpar?.();
    };
  }, []);

  return <canvas className="fundo-cobras" aria-hidden="true" ref={tela} />;
}
