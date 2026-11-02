"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, type ReactNode } from "react";
import * as m from "motion/react-m";
import { useReducedMotion } from "motion/react";
import { useGrupo } from "./GrupoExpansivel";

// O que aparece "por dentro" de cada painel. Cada um é um chunk à parte,
// baixado só quando o painel abre (replay, galeria, vídeos, GIFs).
const carregando = () => <p className="rot por-dentro__carregando">carregando…</p>;
const CONTEUDOS = {
  agente: dynamic(() => import("@/components/por-dentro/PorDentroAgente"), { ssr: false, loading: carregando }),
  ia: dynamic(() => import("@/components/por-dentro/PorDentroIa"), { ssr: false, loading: carregando }),
};

export type ConteudoPorDentro = keyof typeof CONTEUDOS;

type Props = {
  id: string;
  tituloId: string;
  titulo: string;
  conteudo: ConteudoPorDentro;
  className?: string;
  children: ReactNode; // o resumo, sempre visível
  pe: ReactNode; // tags e links do rodapé
};

// Painel de projeto que se abre na própria página: animação de layout com
// motion e revelação por linha de varredura (≤ 450 ms; sem animação com
// movimento reduzido). aria-expanded no botão, foco levado para o conteúdo
// ao abrir, Esc fecha e devolve o foco ao botão.
export default function PainelExpansivel({ id, tituloId, titulo, conteudo, className, children, pe }: Props) {
  const { aberto, abrir, fechar } = useGrupo();
  const estaAberto = aberto === id;
  const botao = useRef<HTMLButtonElement>(null);
  const regiao = useRef<HTMLDivElement>(null);
  const abriuPorClique = useRef(false);
  const reduz = useReducedMotion();
  const Conteudo = CONTEUDOS[conteudo];
  const regiaoId = `${id}-por-dentro`;

  useEffect(() => {
    if (estaAberto && abriuPorClique.current) {
      abriuPorClique.current = false;
      regiao.current?.focus({ preventScroll: true });
    }
  }, [estaAberto]);

  const alternar = () => {
    if (estaAberto) fechar();
    else {
      abriuPorClique.current = true;
      abrir(id);
    }
  };

  const aoTeclar = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && estaAberto) {
      e.stopPropagation();
      fechar();
      botao.current?.focus();
    }
  };

  return (
    <m.article
      layout
      transition={{ layout: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] } }}
      id={id}
      className={["card", "expansivel", className].filter(Boolean).join(" ")}
      data-ativo={estaAberto || undefined}
      aria-labelledby={tituloId}
      onKeyDown={aoTeclar}
    >
      <m.div layout="position" className="expansivel__resumo">
        {children}
      </m.div>
      <m.div layout="position" className="expansivel__pe">
        {pe}
        <button
          ref={botao}
          type="button"
          className="btn colchetes expansivel__botao"
          aria-expanded={estaAberto}
          aria-controls={regiaoId}
          onClick={alternar}
          aria-label={`${estaAberto ? "Fechar" : "Ver por dentro"}: ${titulo}`}
        >
          {estaAberto ? "Fechar" : "Ver por dentro"}
        </button>
      </m.div>
      <div id={regiaoId} hidden={!estaAberto}>
        {estaAberto && (
          <m.div
            ref={regiao}
            tabIndex={-1}
            role="region"
            aria-label={`Por dentro: ${titulo}`}
            className="por-dentro"
            initial={reduz ? false : { clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {!reduz && <span className="por-dentro__varredura" aria-hidden="true" />}
            <Conteudo />
          </m.div>
        )}
      </div>
    </m.article>
  );
}
