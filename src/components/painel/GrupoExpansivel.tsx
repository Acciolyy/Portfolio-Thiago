"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

// Um grupo de painéis que se abrem na própria página: um aberto por vez, com
// o id dele no hash da URL (#projeto-agente). Abrir pelo hash também funciona
// (link direto ou voltar no histórico).
type Grupo = { aberto: string | null; abrir: (id: string) => void; fechar: () => void };

const Contexto = createContext<Grupo | null>(null);

export function useGrupo() {
  const g = useContext(Contexto);
  if (!g) throw new Error("PainelExpansivel fora de um GrupoExpansivel");
  return g;
}

const recursos = () => import("@/lib/motion-recursos").then((m) => m.default);

export default function GrupoExpansivel({ ids, children }: { ids: string[]; children: ReactNode }) {
  const [aberto, setAberto] = useState<string | null>(null);

  useEffect(() => {
    const doHash = () => {
      const h = decodeURIComponent(location.hash.slice(1));
      if (ids.includes(h)) {
        setAberto(h);
        requestAnimationFrame(() => document.getElementById(h)?.scrollIntoView({ block: "start" }));
      } else setAberto((a) => (a && ids.includes(a) && h === "" ? null : a));
    };
    doHash();
    window.addEventListener("hashchange", doHash);
    return () => window.removeEventListener("hashchange", doHash);
  }, [ids]);

  const abrir = useCallback((id: string) => {
    setAberto(id);
    history.replaceState(null, "", `#${id}`);
  }, []);

  const fechar = useCallback(() => {
    setAberto(null);
    history.replaceState(null, "", location.pathname + location.search);
  }, []);

  return (
    <Contexto.Provider value={{ aberto, abrir, fechar }}>
      <LazyMotion features={recursos} strict>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </LazyMotion>
    </Contexto.Provider>
  );
}
