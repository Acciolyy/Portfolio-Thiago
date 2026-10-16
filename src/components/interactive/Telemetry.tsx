"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { carregarTelemetria, type Telemetria } from "@/lib/telemetria";

type Celula = {
  chave: string;
  rotulo: string;
  valor: string;
  texto: boolean;
};

function formatar(valor: number, decimais: number, sufixo: string) {
  return valor.toFixed(decimais) + sufixo;
}

/* Faixa de telemetria. O HTML traz valores estáticos (o que aparece sem JS, ou
   se a API do GitHub não responder). Quando entra na tela, o efeito troca por
   dado real e anima os contadores. Sem dado nenhum, o estático continua valendo. */
export default function Telemetry({ celulas }: { celulas: readonly Celula[] }) {
  const faixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = faixa.current;
    if (!el) return;

    let cancelado = false;
    const tweens: gsap.core.Tween[] = [];

    const aplicar = (dados: Telemetria | null, animar: boolean) => {
      if (!dados || cancelado) return;

      Object.keys(dados).forEach((chave) => {
        const alvo = el.querySelector<HTMLElement>(`[data-tel="${chave}"]`);
        const item = dados[chave];
        if (!alvo) return;

        if ("texto" in item) {
          alvo.textContent = item.texto;
          return;
        }

        if (!animar) {
          alvo.textContent = formatar(item.valor, item.decimais, item.sufixo);
          return;
        }

        const contador = { n: 0 };
        alvo.textContent = formatar(0, item.decimais, item.sufixo);

        tweens.push(
          gsap.to(contador, {
            n: item.valor,
            duration: 1.1,
            ease: "power2.out",
            onUpdate: () => {
              alvo.textContent = formatar(contador.n, item.decimais, item.sufixo);
            },
          }),
        );
      });
    };

    if (prefersReducedMotion()) {
      carregarTelemetria().then((dados) => aplicar(dados, false));
      return () => {
        cancelado = true;
      };
    }

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 88%",
      once: true,
      onEnter: () => {
        carregarTelemetria().then((dados) => aplicar(dados, true));
      },
    });

    return () => {
      cancelado = true;
      st.kill();
      tweens.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="telemetry" id="telemetry" ref={faixa}>
      {celulas.map((c) => (
        <div className="telemetry__cell" key={c.chave}>
          <span className="telemetry__label">{c.rotulo}</span>
          <span
            className={
              c.texto ? "telemetry__value telemetry__value--txt" : "telemetry__value"
            }
            data-tel={c.chave}
          >
            {c.valor}
          </span>
        </div>
      ))}
    </div>
  );
}
