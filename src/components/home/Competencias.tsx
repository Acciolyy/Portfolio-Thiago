import { competencias } from "@/content/home";
import Rotulo from "@/components/ui/Rotulo";
import Tag from "@/components/ui/Tag";

export default function Competencias() {
  return (
    <section id="competencias" className="wrap secao secao--comp" aria-labelledby="h-comp">
      <div className="secao__titulos">
        <Rotulo n="04">{competencias.rotulo}</Rotulo>
        <h2 id="h-comp" className="h-sec">
          {competencias.titulo}
        </h2>
      </div>
      <div className="comp">
        {competencias.grupos.map((g) => (
          <div key={g.titulo} className="card comp__grupo" data-nivel={g.nivel}>
            <h3 className="comp__titulo">{g.titulo}</h3>
            <div className="tags">
              {g.itens.map((i) => (
                <Tag key={i}>{i}</Tag>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
