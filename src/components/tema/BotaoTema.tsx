"use client";

import { useLayoutEffect, useState } from "react";
import { CHAVE_TEMA } from "./ScriptTema";

type Tema = "light" | "dark";

function temaAtual(): Tema {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function salvo(): Tema | null {
  try {
    const t = localStorage.getItem(CHAVE_TEMA);
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

function aplicar(tema: Tema) {
  document.documentElement.setAttribute("data-theme", tema);
  // Avisa quem desenha com as cores do tema fora do CSS (o fundo 3D).
  window.dispatchEvent(new CustomEvent("tema", { detail: tema }));
}

export default function BotaoTema() {
  // null até montar: o servidor não sabe o tema, então o ícone só aparece
  // depois de ler o DOM (o botão em si já ocupa o lugar desde o HTML).
  const [tema, setTema] = useState<Tema | null>(null);

  useLayoutEffect(() => {
    // Em desenvolvimento o StrictMode remonta e o React limpa os atributos do
    // <html>; reaplica a partir da mesma fonte do script do <head>.
    if (!document.documentElement.hasAttribute("data-theme")) {
      document.documentElement.setAttribute("data-theme", salvo() ?? "dark");
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o DOM que o script do <head> preparou
    setTema(temaAtual());
  }, []);

  const alternar = () => {
    const novo: Tema = temaAtual() === "light" ? "dark" : "light";
    aplicar(novo);
    try {
      localStorage.setItem(CHAVE_TEMA, novo);
    } catch {
      /* sem localStorage: troca só nesta visita */
    }
    setTema(novo);
  };

  const rotulo =
    tema === "light" ? "Alternar para o modo noite" : "Alternar para o modo dia";

  return (
    <button type="button" className="botao-tema" onClick={alternar} aria-label={rotulo} title={rotulo}>
      {tema === "light" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        </svg>
      ) : tema === "dark" ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
        </svg>
      ) : null}
    </button>
  );
}
