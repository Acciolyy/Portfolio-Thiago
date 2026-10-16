"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

// Rótulo de seção ("01 / INICIO") com a marca de pneu que risca a entrada.
export default function SectionLabel({ texto }: { texto: string }) {
  const rotulo = useRef<HTMLParagraphElement>(null);
  const marca = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const p = rotulo.current;
    const tire = marca.current;
    if (!p || !tire || prefersReducedMotion()) return;

    let tl: gsap.core.Timeline | undefined;

    const st = ScrollTrigger.create({
      trigger: p,
      start: "top 85%",
      once: true,
      onEnter: () => {
        tl = gsap
          .timeline()
          .fromTo(
            tire,
            { width: 0, opacity: 0 },
            { width: p.offsetWidth + 24, opacity: 1, duration: 0.18, ease: "power2.out" },
          )
          .to(tire, { opacity: 0, duration: 0.32, ease: "power1.in" });
      },
    });

    return () => {
      st.kill();
      tl?.kill();
    };
  }, []);

  return (
    <p className="sec-label" ref={rotulo}>
      <span className="tire" aria-hidden="true" ref={marca}></span>
      {texto}
    </p>
  );
}
