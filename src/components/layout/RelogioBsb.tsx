"use client";

import { useSyncExternalStore } from "react";

// "BSB 14:35": hora local de Brasília, atualizada a cada minuto.
const formato = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

function assinar(cb: () => void) {
  let id = 0;
  const agendar = () => {
    id = window.setTimeout(() => {
      cb();
      agendar();
    }, 60_000 - (Date.now() % 60_000) + 50);
  };
  agendar();
  return () => clearTimeout(id);
}

export default function RelogioBsb() {
  const hora = useSyncExternalStore(assinar, () => formato.format(new Date()), () => "--:--");
  return (
    <span className="relogio" aria-label={`Hora em Brasília: ${hora}`}>
      BSB {hora}
    </span>
  );
}
