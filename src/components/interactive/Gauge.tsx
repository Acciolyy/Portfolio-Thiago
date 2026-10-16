"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { ARCO, dashoffsetFinal } from "@/lib/gauge";
import { prefersReducedMotion } from "@/lib/motion";
import type { GaugeData } from "@/content/tipos";

const ARCO_D = "M28.89 91.11A44 44 0 1 1 91.11 91.11";

/* Mostrador radial. Arco de 270 graus. O valor final já vem no HTML, tanto no
   número quanto no stroke-dashoffset do arco, então sem JS o mostrador aparece
   certo. O efeito só volta para o zero e anima até lá quando entra na viewport. */
export default function Gauge({ valor, max, sufixo, titulo, detalhe, escala }: GaugeData) {
  const figura = useRef<HTMLElement>(null);
  const arco = useRef<SVGPathElement>(null);
  const numero = useRef<HTMLParagraphElement>(null);

  const final = dashoffsetFinal(valor, max);
  const texto = `${valor}${sufixo ?? ""}`;

  useEffect(() => {
    const fig = figura.current;
    const a = arco.current;
    const n = numero.current;
    if (!fig || !a || !n || !valor || prefersReducedMotion()) return;

    const suf = sufixo ?? "";
    const alvo = ARCO * (1 - valor / max);
    a.style.strokeDashoffset = String(ARCO);
    n.textContent = "0" + suf;

    const tweens: gsap.core.Tween[] = [];

    const st = ScrollTrigger.create({
      trigger: fig,
      start: "top 85%",
      once: true,
      onEnter: () => {
        const conta = { n: 0 };

        tweens.push(
          gsap.to(a, { strokeDashoffset: alvo, duration: 1.4, ease: "power2.out" }),
          gsap.to(conta, {
            n: valor,
            duration: 1.4,
            ease: "power2.out",
            onUpdate: () => {
              n.textContent = Math.round(conta.n) + suf;
            },
            onComplete: () => {
              n.textContent = valor + suf;
            },
          }),
        );
      },
    });

    return () => {
      st.kill();
      tweens.forEach((t) => t.kill());
      // Deixa o estado final do HTML: o StrictMode monta duas vezes em dev.
      a.style.strokeDashoffset = final;
      n.textContent = texto;
    };
  }, [valor, max, sufixo, final, texto]);

  return (
    <figure
      className="gauge"
      data-valor={valor}
      data-max={max}
      data-sufixo={sufixo}
      ref={figura}
    >
      <div className="gauge__disco">
        <svg className="gauge__svg" viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
          <path className="gauge__trilha" d={ARCO_D} />
          <path
            className="gauge__arco"
            d={ARCO_D}
            style={{ strokeDashoffset: final }}
            ref={arco}
          />
          <g className="gauge__ticks">
            <line className="gauge__tick" x1="33.13" y1="86.87" x2="35.96" y2="84.04" />
            <line className="gauge__tick" x1="24.89" y1="45.46" x2="28.59" y2="46.99" />
            <line className="gauge__tick" x1="60" y1="22" x2="60" y2="26" />
            <line className="gauge__tick" x1="95.11" y1="45.46" x2="91.41" y2="46.99" />
            <line className="gauge__tick" x1="86.87" y1="86.87" x2="84.04" y2="84.04" />
          </g>
        </svg>
        <p className="gauge__num" ref={numero}>
          {texto}
        </p>
      </div>
      <figcaption className="gauge__leg">
        <b>{titulo}</b>
        {detalhe}
        <span className="gauge__escala">{escala}</span>
      </figcaption>
    </figure>
  );
}
