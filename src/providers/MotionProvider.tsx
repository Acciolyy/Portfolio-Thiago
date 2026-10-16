"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

/* Scroll suave (Lenis) ligado ao ticker do GSAP, e pausa geral quando a aba
   perde o foco. Com prefers-reduced-motion o Lenis nem é instanciado e o
   navegador continua rolando nativamente, sem nenhuma interceptação. */
export default function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // A aba escondida pausa a globalTimeline: o ticker do GSAP para junto.
    const aoMudarVisibilidade = () => {
      if (document.hidden) gsap.globalTimeline.pause();
      else gsap.globalTimeline.resume();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    if (prefersReducedMotion()) {
      return () => document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    }

    // anchors: true entrega os cliques de âncora ao Lenis. Sem isso, o
    // scroll-behavior: smooth do CSS e o Lenis animariam o mesmo scroll ao
    // mesmo tempo, um brigando com o outro.
    const lenis = new Lenis({ anchors: true });
    document.documentElement.style.scrollBehavior = "auto";

    const aoRolar = () => ScrollTrigger.update();
    lenis.on("scroll", aoRolar);

    const tick = (tempo: number) => lenis.raf(tempo * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const aoMudarVisibilidadeLenis = () => {
      if (document.hidden) lenis.stop();
      else lenis.start();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidadeLenis);

    // Os ScrollTriggers dos filhos nascem antes deste efeito. Remede tudo agora
    // que o Lenis assumiu o scroll.
    ScrollTrigger.refresh();

    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      document.removeEventListener("visibilitychange", aoMudarVisibilidadeLenis);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33); // valores padrão do GSAP
      lenis.off("scroll", aoRolar);
      lenis.destroy();
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return <>{children}</>;
}
