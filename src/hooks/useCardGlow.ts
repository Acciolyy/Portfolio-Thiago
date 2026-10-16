import { useEffect, type RefObject } from "react";
import { prefersReducedMotion } from "@/lib/motion";

/* Brilho de borda seguindo o cursor. O desenho é todo do CSS (.card::before);
   aqui só entram as coordenadas do mouse. Um listener na grade inteira, com o
   trabalho jogado para o próximo quadro. Sem movimento: o CSS acende a borda
   inteira, parada, sem rastrear nada. */
export function useCardGlow(ref: RefObject<HTMLElement | null>, ativo: boolean) {
  useEffect(() => {
    const grade = ref.current;
    if (!grade || !ativo || prefersReducedMotion()) return;

    let agendado = false;
    let ultimo: MouseEvent | null = null;

    const aoMover = (e: MouseEvent) => {
      ultimo = e;
      if (agendado) return;
      agendado = true;

      requestAnimationFrame(() => {
        agendado = false;
        const alvo = ultimo?.target as Element | null;
        const card = alvo?.closest?.<HTMLElement>(".card");
        if (!card || !ultimo) return;

        const caixa = card.getBoundingClientRect();
        card.style.setProperty("--mx", (ultimo.clientX - caixa.left).toFixed(1) + "px");
        card.style.setProperty("--my", (ultimo.clientY - caixa.top).toFixed(1) + "px");
      });
    };

    grade.addEventListener("mousemove", aoMover);
    return () => grade.removeEventListener("mousemove", aoMover);
  }, [ref, ativo]);
}
