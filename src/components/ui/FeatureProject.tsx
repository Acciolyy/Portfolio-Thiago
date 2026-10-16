import type { ReactNode } from "react";
import type { Destaque } from "@/content/tipos";
import GaugeGroup from "./GaugeGroup";
import OutRow from "./OutRow";
import StackLine from "./StackLine";

type Props = {
  variante?: "main" | "inverso";
  media: ReactNode;
  children: ReactNode;
};

// Destaque (.feature): mídia de um lado, texto do outro. O lado alterna.
export default function FeatureProject({ variante, media, children }: Props) {
  const classe =
    variante === "main"
      ? "feature feature--main"
      : variante === "inverso"
        ? "feature feature--inverso mt-4"
        : "feature mt-4";

  return (
    <article className={classe}>
      <div className="feature__media">{media}</div>
      <div className="feature__body">{children}</div>
    </article>
  );
}

type CorpoProps = {
  projeto: Destaque;
  // Entra entre os parágrafos e os links (a legenda do carrossel).
  aposTexto?: ReactNode;
};

// Corpo do destaque, na ordem do HTML original:
// rank, título, origem, stack, parágrafos, pontos, mostradores, links, nota.
export function FeatureCorpo({ projeto, aposTexto }: CorpoProps) {
  return (
    <>
      <p className="rank">{projeto.rank}</p>
      <h2 className="card__title">{projeto.titulo}</h2>
      <p className="origin">origem: {projeto.origem}</p>

      <StackLine itens={projeto.stack} />

      {projeto.paragrafos.map((p) => (
        <p className="card__text" key={p.slice(0, 40)}>
          {p}
        </p>
      ))}

      {projeto.pontos && (
        <ul className="points">
          {projeto.pontos.map((ponto) => (
            <li key={ponto.slice(0, 40)}>{ponto}</li>
          ))}
        </ul>
      )}

      {projeto.gauges && <GaugeGroup gauges={projeto.gauges} />}

      {aposTexto}

      <OutRow links={projeto.links} />

      {projeto.nota && <p className="private-note">{projeto.nota}</p>}
    </>
  );
}
