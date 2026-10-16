"use client";

import { useEffect, useRef } from "react";

// Fundo ambiente. Decoração pura, fora da árvore de acessibilidade. O Three só
// é baixado depois de hidratar (import dinâmico), fora do bundle inicial.
export default function Fundo3D() {
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = tela.current;
    if (!canvas) return;

    let cancelado = false;
    let limpar: (() => void) | undefined;

    // O 3D mede a tinta real do texto da Hero e do Contato para achar os
    // vazios. Com a fonte reserva a quebra de linha é outra, então espera as
    // webfonts antes de medir (no site estático elas já estavam em cache).
    const fontes = document.fonts?.ready ?? Promise.resolve();

    Promise.all([import("@/lib/fundo3d"), fontes])
      .then(([{ iniciar }]) => {
        if (cancelado) return;
        limpar = iniciar(canvas);
      })
      .catch(() => {
        /* Se qualquer coisa aqui falhar, o site continua igual. */
      });

    return () => {
      cancelado = true;
      limpar?.();
    };
  }, []);

  return <canvas className="fundo3d" id="fundo3d" aria-hidden="true" ref={tela} />;
}
