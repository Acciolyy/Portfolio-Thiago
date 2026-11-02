"use client";

import { useEffect, useState } from "react";
import { replayAgente as r } from "@/content/por-dentro/replay-agente";
import VideoMudo from "@/components/ui/VideoMudo";

// Replay, em forma de terminal, de um caso real da avaliação (texto copiado
// de eval/vagas_backendbr.csv, eval/criterios_eval.txt e
// eval/resultados_backendbr.csv; ver content/por-dentro/replay-agente.ts).
// Nada chama a API: é a reprodução do que foi gravado. As etapas entram uma
// a uma (cada entrada dura 200 ms); com movimento reduzido, tudo de uma vez.

const chamada = `avaliar_vaga({
  "titulo": ${JSON.stringify(r.vaga.titulo)},
  "descricao_ou_tags": …,   // não gravado nos resultados
  "link": ${JSON.stringify(r.vaga.link)},
  "veredito": ${JSON.stringify(r.resultado.veredito)},
  "motivo": ${JSON.stringify(r.resultado.motivo)}
})`;

const ETAPAS = [
  { rotulo: "vaga", corpo: `${r.vaga.titulo}\n${r.vaga.link}\n\n${r.vaga.descricao}` },
  { rotulo: "critérios", corpo: r.criterios },
  { rotulo: "chamada de função", corpo: chamada },
  { rotulo: "validação pydantic · Avaliacao", corpo: r.validacao.map((v) => `✓ ${v}`).join("\n") },
  {
    rotulo: "veredito",
    corpo: `${r.resultado.veredito.toUpperCase()}: ${r.resultado.motivo}\nesperado: ${r.resultado.esperado} · acerto: ${r.resultado.acerto}`,
    destaque: true,
  },
];

const INTERVALO = 550;

export default function PorDentroAgente() {
  // Este componente só existe no cliente (carregado com ssr: false).
  const [reduz] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [visiveis, setVisiveis] = useState(reduz ? ETAPAS.length : 1);
  const [rodada, setRodada] = useState(0);

  useEffect(() => {
    if (reduz) return;
    const id = window.setInterval(() => {
      setVisiveis((n) => {
        if (n >= ETAPAS.length) {
          clearInterval(id);
          return n;
        }
        return n + 1;
      });
    }, INTERVALO);
    return () => clearInterval(id);
  }, [rodada, reduz]);

  const fim = visiveis >= ETAPAS.length;

  return (
    <div className="por-dentro__grade">
      <section className="terminal" aria-labelledby="replay-t">
        <div className="terminal__barra">
          <h4 id="replay-t" className="hud-rotulo">
            Replay · um caso real da avaliação
          </h4>
          <span className="rot">fonte: {r.fonte}</span>
        </div>
        <ol className="terminal__etapas" aria-live="polite">
          {ETAPAS.slice(0, visiveis).map((e, i) => (
            <li key={`${rodada}-${i}`} className="terminal__etapa" data-destaque={e.destaque || undefined}>
              <span className="terminal__prompt">
                <span aria-hidden="true">&gt; </span>
                {String(i + 1).padStart(2, "0")} · {e.rotulo}
              </span>
              <pre className="terminal__corpo">{e.corpo}</pre>
            </li>
          ))}
        </ol>
        <div className="terminal__pe">
          <button type="button" className="btn colchetes" onClick={() => {
              setVisiveis(reduz ? ETAPAS.length : 1);
              setRodada((n) => n + 1);
            }} disabled={!fim}>
            Repetir replay
          </button>
        </div>
      </section>
      <figure className="por-dentro__midia">
        <VideoMudo
          src="/videos/agente.webm"
          poster="/videos/agente-poster.jpg"
          descricao="Agente de triagem em uso: critérios de vaga escritos em linguagem natural na barra lateral e busca de vagas remotas"
        />
        <figcaption className="rot">o app: critérios na barra lateral, vagas avaliadas à direita</figcaption>
      </figure>
    </div>
  );
}
