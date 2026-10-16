"use client";

import { useRef, type ReactNode } from "react";
import { useCardGlow } from "@/hooks/useCardGlow";

type Props = {
  variante: "single" | "pair";
  // Brilho de borda seguindo o cursor. No site original só a primeira grade
  // tem (querySelector('.grid-projects')); a de Outros Interesses não. Mantido.
  glow?: boolean;
  children: ReactNode;
};

export default function ProjectGrid({ variante, glow = false, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useCardGlow(ref, glow);

  return (
    <div ref={ref} className={`grid-projects grid-projects--${variante} mt-4`}>
      {children}
    </div>
  );
}
