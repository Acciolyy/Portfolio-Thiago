import type { ReactNode } from "react";

// Rótulo mono de seção: "<b>01</b> — projetos em destaque".
export default function Rotulo({
  n,
  children,
  as: Tag = "p",
  id,
}: {
  n?: string;
  children?: ReactNode;
  as?: "p" | "h2" | "span";
  id?: string;
}) {
  return (
    <Tag className="rot" id={id}>
      {n && <b>{n}</b>}
      {n && children ? " — " : null}
      {children}
    </Tag>
  );
}
