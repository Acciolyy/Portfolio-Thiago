"use client";

import { useSyncExternalStore } from "react";

// Tema atual ("dark" | "light"), lido do <html> e atualizado pelo evento
// "tema" que o BotaoTema dispara.
function assinar(cb: () => void) {
  window.addEventListener("tema", cb);
  return () => window.removeEventListener("tema", cb);
}

const ler = () => (document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");

export function useTema() {
  return useSyncExternalStore(assinar, ler, () => "dark" as const);
}
