"use client";

import { useEffect, useRef, useState } from "react";
import { nav } from "@/content/site";

// Cabeçalho fixo. O menu mobile era Alpine (x-data/x-show/@click.outside); agora
// é estado do React. O drawer fica sempre no DOM, com `hidden`, porque o
// aria-controls="menu-mobile" do botão precisa achar o id.
export default function Header() {
  const [aberto, setAberto] = useState(false);
  const botao = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);

  // Clique fora fecha. O botão conta como "dentro": o clique que abre o menu
  // chega ao document depois do React, e não pode fechá-lo de novo.
  useEffect(() => {
    if (!aberto) return;

    const aoClicar = (e: MouseEvent) => {
      const alvo = e.target as Node;
      if (drawer.current?.contains(alvo) || botao.current?.contains(alvo)) return;
      setAberto(false);
    };

    document.addEventListener("click", aoClicar);
    return () => document.removeEventListener("click", aoClicar);
  }, [aberto]);

  return (
    <header className="site-header">
      <div className="wrap">
        <a className="brand" href="#inicio">
          TVA <span>/ python</span>
        </a>

        <ul className="nav-links">
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href}>{item.rotulo}</a>
            </li>
          ))}
        </ul>

        <button
          ref={botao}
          className="nav-toggle"
          type="button"
          onClick={() => setAberto((a) => !a)}
          aria-expanded={aberto}
          aria-controls="menu-mobile"
        >
          <span>{aberto ? "fechar" : "menu"}</span>
        </button>
      </div>

      <nav
        ref={drawer}
        className="nav-drawer"
        id="menu-mobile"
        hidden={!aberto}
        aria-label="Navegação principal"
      >
        <ul>
          {nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} onClick={() => setAberto(false)}>
                {item.rotulo}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
