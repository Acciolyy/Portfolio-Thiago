import type { CardProjeto } from "@/content/tipos";
import LazyVideo from "@/components/interactive/LazyVideo";
import OutRow from "./OutRow";
import StackLine from "./StackLine";

// Card da grade (.card). Aqui o texto vem ANTES da stack, ao contrário do
// destaque.
export default function ProjectCard({ projeto }: { projeto: CardProjeto }) {
  return (
    <article className="card">
      {projeto.video && (
        <div className="card__media">
          <LazyVideo {...projeto.video} />
        </div>
      )}
      <div className="card__body">
        <h3 className="card__title">{projeto.titulo}</h3>
        <p className="origin">origem: {projeto.origem}</p>
        <p className="card__text">{projeto.texto}</p>
        <StackLine itens={projeto.stack} />
        <OutRow links={projeto.links} />
      </div>
    </article>
  );
}
