import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  cheio?: boolean;
  // Abre em outra aba e ganha o "↗" no fim do rótulo.
  externo?: boolean;
  className?: string;
};

export default function Botao({ href, children, cheio, externo, className }: Props) {
  const classes = ["btn", "colchetes", cheio && "btn--cheio", className].filter(Boolean).join(" ");
  return (
    <a
      className={classes}
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {externo && (
        <span aria-hidden="true" className="btn__seta">
          ↗
        </span>
      )}
      {externo && <span className="sr-only"> (abre em nova aba)</span>}
    </a>
  );
}
