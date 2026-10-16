"use client";

import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "@/lib/motion";
import type { TrechoTerminal } from "@/content/sobre";

/* REPL de mentira. O transcrito inteiro já vem no HTML, então funciona sem JS
   e o leitor de tela lê tudo de uma vez. Aqui só se esconde e revela o que já
   está lá: o trecho por vir fica com visibility: hidden, que preserva a caixa,
   então a quebra de linha não muda enquanto "digita" e o bloco não empurra a
   página.

   fase:
     cheio    transcrito completo (SSR, sem JS, prefers-reduced-motion)
     espera   tudo escondido, esperando a caixa entrar na tela
     rodando  digitando; i = trecho atual, n = caracteres já revelados nele
     fim      terminou; o cursor fica parado no fim */

type Estado = { fase: "cheio" | "espera" | "rodando" | "fim"; i: number; n: number };

const CLASSE = { ps: "term__ps", cmd: "term__cmd", out: undefined } as const;

export default function Terminal({ trechos }: { trechos: readonly TrechoTerminal[] }) {
  const caixa = useRef<HTMLDivElement>(null);
  const [estado, setEstado] = useState<Estado>({ fase: "cheio", i: 0, n: 0 });

  useEffect(() => {
    const el = caixa.current;
    if (!el || prefersReducedMotion() || !("IntersectionObserver" in window)) return;

    let timer: number | undefined;
    let pendente: (() => void) | null = null;

    setEstado({ fase: "espera", i: 0, n: 0 });

    // Aba escondida: o passo fica guardado e o visibilitychange retoma.
    const agendar = (passo: () => void, ms: number) => {
      pendente = passo;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (document.hidden) return;
        pendente = null;
        passo();
      }, ms);
    };

    const retomar = () => {
      if (!pendente || timer) return;
      const seguir = pendente;
      pendente = null;
      seguir();
    };

    const digitar = (i: number, n: number) => {
      const total = trechos[i].texto.length;
      if (n >= total) {
        seguinte(i + 1);
        return;
      }

      agendar(() => {
        setEstado({ fase: "rodando", i, n: n + 1 });
        digitar(i, n + 1);
      }, 26 + Math.random() * 34);
    };

    const seguinte = (i: number) => {
      if (i >= trechos.length) {
        const ultimo = trechos.length - 1;
        setEstado({ fase: "fim", i: ultimo, n: trechos[ultimo].texto.length });
        return;
      }

      const trecho = trechos[i];
      setEstado({ fase: "rodando", i, n: 0 });

      // Num REPL de verdade quem digita é a pessoa; a saída aparece inteira.
      if (trecho.t === "cmd") {
        digitar(i, 0);
        return;
      }

      const espera = trecho.t === "ps" ? 90 : /^\s*$/.test(trecho.texto) ? 130 : 240;
      agendar(() => {
        setEstado({ fase: "rodando", i, n: trecho.texto.length });
        seguinte(i + 1);
      }, espera);
    };

    const observador = new IntersectionObserver(
      (entradas, obs) => {
        if (!entradas[0].isIntersecting) return;
        obs.disconnect();
        seguinte(0);
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    observador.observe(el);

    const aoMudarVisibilidade = () => {
      if (!document.hidden) retomar();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      observador.disconnect();
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      if (timer) window.clearTimeout(timer);
      pendente = null;
    };
  }, [trechos]);

  const mostrados = (k: number): number => {
    const { fase, i, n } = estado;
    const total = trechos[k].texto.length;
    if (fase === "cheio") return total;
    if (fase === "espera") return 0;
    if (k < i) return total;
    if (k === i) return n;
    return 0;
  };

  const cursorEm = estado.fase === "rodando" || estado.fase === "fim" ? estado.i : -1;

  return (
    <div className="term" id="term-python" ref={caixa}>
      <div className="term__barra">
        <span className="term__nome">python3</span>
        <span className="term__tag">simulado</span>
      </div>
      <pre className="term__corpo">
        <code>
          {trechos.map((trecho, k) => {
            const n = mostrados(k);

            if (estado.fase === "cheio") {
              return (
                <span className={CLASSE[trecho.t]} key={k}>
                  {trecho.texto}
                </span>
              );
            }

            return (
              <span className={CLASSE[trecho.t]} key={k}>
                <span>{trecho.texto.slice(0, n)}</span>
                {k === cursorEm && (
                  <span
                    className={
                      estado.fase === "rodando"
                        ? "term__cursor term__cursor--piscando"
                        : "term__cursor"
                    }
                  />
                )}
                <span className="term__espera">{trecho.texto.slice(n)}</span>
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
