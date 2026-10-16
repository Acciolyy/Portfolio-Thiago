import type { ReactNode } from "react";
import SectionLabel from "@/components/interactive/SectionLabel";

type Props = {
  id: string;
  variante: "hero" | "sobre" | "nota" | "projetos" | "contato";
  rotulo: string;
  children: ReactNode;
};

export default function Section({ id, variante, rotulo, children }: Props) {
  return (
    <section id={id} className={`section section--${variante}`}>
      <div className="wrap">
        <SectionLabel texto={rotulo} />
        {children}
      </div>
    </section>
  );
}
