"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Liga a camada de movimento (lib/aparelho.ts) depois do load, com o
// navegador ocioso. Reinicia a cada página (navegação no cliente).
export default function Aparelho() {
  const rota = usePathname();

  useEffect(() => {
    let cancelado = false;
    let limpar: (() => void) | undefined;
    const comecar = () =>
      import("@/lib/aparelho").then(({ iniciar }) => {
        if (!cancelado) limpar = iniciar();
      });
    const temOcioso = typeof window.requestIdleCallback === "function";
    const id = temOcioso ? requestIdleCallback(comecar, { timeout: 1200 }) : window.setTimeout(comecar, 200);
    return () => {
      cancelado = true;
      if (temOcioso) cancelIdleCallback(id);
      else clearTimeout(id);
      limpar?.();
    };
  }, [rota]);

  return null;
}
