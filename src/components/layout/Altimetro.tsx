"use client";

import { useEffect, useState } from "react";

// Medidor de rolagem fixo na borda direita, como um altímetro de HUD: uma
// escala vertical com as seções, a atual em laranja e a porcentagem. Só no
// desktop largo (a mesma faixa reservada pelas cobras), nunca sobre o
// conteúdo. Clicar numa marca leva à seção.
const SECOES = [
  { id: "projetos", n: "01", nome: "projetos em destaque" },
  { id: "outros", n: "02", nome: "outros projetos" },
  { id: "experiencia", n: "03", nome: "experiência" },
  { id: "competencias", n: "04", nome: "competências" },
  { id: "sobre", n: "05", nome: "sobre" },
  { id: "contato", n: "06", nome: "contato" },
];

export default function Altimetro() {
  const [pct, setPct] = useState(0);
  const [atual, setAtual] = useState<string | null>(null);
  const [marcas, setMarcas] = useState<number[]>([]);

  useEffect(() => {
    let raf = 0;
    const medir = () => {
      raf = 0;
      const doc = document.documentElement.scrollHeight - innerHeight;
      setPct(doc > 0 ? Math.round((scrollY / doc) * 100) : 0);
      const tops = SECOES.map((s) => {
        const el = document.getElementById(s.id);
        return el ? el.getBoundingClientRect().top + scrollY : 0;
      });
      setMarcas(tops.map((t) => Math.min(1, Math.max(0, t / Math.max(1, document.documentElement.scrollHeight)))));
      let a: string | null = null;
      tops.forEach((t, i) => {
        if (scrollY + innerHeight * 0.35 >= t) a = SECOES[i].id;
      });
      setAtual(a);
    };
    const pedir = () => {
      if (!raf) raf = requestAnimationFrame(medir);
    };
    medir();
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", pedir);
      removeEventListener("resize", pedir);
    };
  }, []);

  return (
    <nav className="altimetro" aria-label="Posição na página">
      <span className="altimetro__pct" aria-hidden="true">
        {String(pct).padStart(2, "0")}%
      </span>
      <ol className="altimetro__escala">
        {SECOES.map((s, i) => (
          <li key={s.id} style={{ top: `${(marcas[i] ?? i / SECOES.length) * 100}%` }}>
            <a href={`#${s.id}`} data-atual={atual === s.id || undefined} aria-current={atual === s.id ? "location" : undefined}>
              <span className="sr-only">{s.nome}</span>
              <span aria-hidden="true">{s.n}</span>
            </a>
          </li>
        ))}
      </ol>
      <span className="altimetro__cursor" aria-hidden="true" style={{ top: `${pct}%` }} />
    </nav>
  );
}
