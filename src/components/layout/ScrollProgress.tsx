"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

// ALTURA é a altura em px do SVG, declarada no CSS (.progress__cobra). O viewBox
// usa o mesmo número, então 1 unidade do path é 1 pixel e o eixo da cobra cai em
// ALTURA / 2, que o CSS já ancorou no centro da barra.
const ALTURA = 22;
const EIXO = ALTURA / 2;
const PESCOCO = 16;
// Extremos do desenho da cabeça: 0 na nuca, 21.1 na ponta da língua.
const PONTA = 21.1;
const CENTRO = PONTA / 2;

/* Linha de traçado: progresso de scroll. Quem comunica o trecho percorrido é o
   preto do .progress__fill. A cobra é só a cabeça, parada na fronteira entre o
   preto e o laranja, com um pescoço curto atrás. O SVG cobre a barra inteira e
   o efeito reposiciona a cabeça a cada quadro. */
export default function ScrollProgress() {
  const barra = useRef<HTMLDivElement>(null);
  const trilha = useRef<HTMLDivElement>(null);
  const cobra = useRef<SVGSVGElement>(null);
  const pescoco = useRef<SVGPathElement>(null);
  const cabeca = useRef<SVGGElement>(null);

  useEffect(() => {
    const bar = barra.current;
    const fill = trilha.current;
    const svg = cobra.current;
    const neck = pescoco.current;
    const head = cabeca.current;
    if (!bar || !fill || !svg || !neck || !head) return;

    let largura = 0;
    let progressoAtual = 0;
    let direcaoAtual = 1;

    const medir = () => {
      largura = bar.clientWidth;
      svg.setAttribute("viewBox", "0 0 " + largura + " " + ALTURA);
    };

    // dir = 1 descendo (cabeça olha para a direita), -1 subindo.
    const desenhar = (t: number, p: number, dir: number) => {
      if (!largura) medir();

      const x = Math.min(Math.max(p * largura, 2), largura - 4);

      // Subindo, o desenho inteiro espelha em torno do próprio centro: a ponta
      // passa a ficar na fronteira, olhando para trás, e o pescoço vai parar do
      // outro lado. Só troca de sinal, a forma é a mesma.
      const giro =
        dir < 0
          ? " translate(" + CENTRO + " 0) scale(-1 1) translate(" + -CENTRO + " 0)"
          : "";
      head.setAttribute("transform", "translate(" + x.toFixed(2) + " " + EIXO + ")" + giro);

      // Uma cúbica só. Os dois pontos de controle sobem e descem com o mesmo
      // seno; nenhum ponto intermediário, para não tremer.
      const fase = Math.sin(t * 3);
      // Deslocamento em x do começo do pescoço, medido a partir da nuca.
      const px = (u: number) => (dir < 0 ? x + PONTA + u : x - u);

      neck.setAttribute(
        "d",
        "M" + px(PESCOCO).toFixed(2) + " " + (EIXO + fase * 2.4).toFixed(2) +
          "C" + px(PESCOCO - 6).toFixed(2) + " " + (EIXO + fase * 2.6).toFixed(2) +
          " " + px(7).toFixed(2) + " " + (EIXO - fase * 1.8).toFixed(2) +
          " " + px(0).toFixed(2) + " " + EIXO,
      );
    };

    const posicionar = (p: number) => {
      progressoAtual = p;
      fill.style.width = (p * 100).toFixed(2) + "%";
    };

    const aoRedimensionar = () => {
      medir();
      desenhar(0, progressoAtual, direcaoAtual);
    };
    window.addEventListener("resize", aoRedimensionar);

    if (prefersReducedMotion()) {
      // A barra ainda mede o scroll. O que não acontece aqui é a ondulação,
      // com a fase travada em zero.
      let agendado = false;
      let ultimoY = window.scrollY;

      const aoRolar = () => {
        if (agendado) return;
        agendado = true;
        requestAnimationFrame(() => {
          agendado = false;
          if (window.scrollY !== ultimoY) {
            direcaoAtual = window.scrollY > ultimoY ? 1 : -1;
            ultimoY = window.scrollY;
          }
          const total = document.documentElement.scrollHeight - window.innerHeight;
          posicionar(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
          desenhar(0, progressoAtual, direcaoAtual);
        });
      };

      window.addEventListener("scroll", aoRolar, { passive: true });
      medir();
      aoRolar();

      return () => {
        window.removeEventListener("resize", aoRedimensionar);
        window.removeEventListener("scroll", aoRolar);
      };
    }

    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (self.direction) direcaoAtual = self.direction;
        posicionar(self.progress);
      },
    });

    medir();
    desenhar(0, 0, 1);

    // Pega carona no ticker que o GSAP e o Lenis já rodam: nenhum laço novo.
    const tick = (tempo: number) => {
      if (!document.hidden) desenhar(tempo, progressoAtual, direcaoAtual);
    };
    gsap.ticker.add(tick);

    return () => {
      window.removeEventListener("resize", aoRedimensionar);
      st.kill();
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div className="progress" aria-hidden="true" ref={barra}>
      <div className="progress__fill" id="progress-fill" ref={trilha} />
      <svg
        className="progress__cobra"
        id="progress-cobra"
        preserveAspectRatio="xMinYMid meet"
        fill="none"
        ref={cobra}
      >
        <path className="cobra__pescoco" d="" ref={pescoco} />
        {/* Desenho fixo, escrito à mão: nada aqui sai da função de onda. A
            cabeça não ondula, só é reposicionada na fronteira. */}
        <g className="cobra__cabeca" ref={cabeca}>
          <path className="cobra__lingua" d="M15.4 0L18.4 0M18.4 0L21.1 -2.7M18.4 0L21.1 2.7" />
          <path className="cobra__silhueta" d="M0 -1.7C4.2 -3.5 10 -2.9 15.4 0C10 2.9 4.2 3.5 0 1.7Z" />
          <circle className="cobra__olho" cx="5.2" cy="-0.85" r="0.85" />
        </g>
      </svg>
    </div>
  );
}
