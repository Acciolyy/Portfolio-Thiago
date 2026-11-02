"use client";

import { useEffect, useRef, useState } from "react";

type Modo = "nada" | "animado" | "estatico";

function temWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

// Fundo de ambientação, decoração pura (fora da árvore de acessibilidade).
// Com movimento permitido e WebGL, o three e as cobras (lib/fundo3d) são
// baixados por import dinâmico depois de a página carregar, fora do bundle
// inicial. Com prefers-reduced-motion, sem WebGL ou se algo falhar, nada de
// Three: fica uma imagem parada das mesmas cobras.
export default function Fundo3D() {
  const tela = useRef<HTMLCanvasElement>(null);
  const [modo, setModo] = useState<Modo>("nada");

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !temWebGL()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- decisão que só o navegador pode tomar
      setModo("estatico");
      return;
    }

    let cancelado = false;
    let limpar: (() => void) | undefined;

    const comecar = () => {
      import("@/lib/fundo3d")
        .then(({ iniciar }) => {
          if (cancelado || !tela.current) return;
          limpar = iniciar(tela.current);
          setModo("animado");
        })
        .catch(() => {
          if (!cancelado) setModo("estatico");
        });
    };

    // Depois do load e com o navegador ocioso: o fundo nunca disputa com o conteúdo.
    // (o Safari não tem requestIdleCallback; lá vai um setTimeout curto)
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

  return (
    <>
      <canvas className="fundo3d" data-ativo={modo === "animado" || undefined} aria-hidden="true" ref={tela} />
      {modo === "estatico" && <div className="fundo3d-estatico" aria-hidden="true" />}
    </>
  );
}
