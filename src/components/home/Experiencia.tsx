import { experiencia } from "@/content/home";
import Rotulo from "@/components/ui/Rotulo";

export default function Experiencia() {
  return (
    <section id="experiencia" className="wrap secao secao--exp" aria-labelledby="h-exp">
      <div className="secao__titulos">
        <Rotulo n="03">{experiencia.rotulo}</Rotulo>
        <h2 id="h-exp" className="h-sec">
          {experiencia.titulo}
        </h2>
      </div>
      <ol className="linha">
        {experiencia.itens.map((e) => (
          <li key={e.lugar} className="linha__item" data-atual={e.atual || undefined}>
            <span className="linha__periodo">{e.periodo}</span>
            <div className="linha__corpo">
              <h3 className="linha__titulo">
                {e.lugar} <span>· {e.papel}</span>
              </h3>
              <p className="linha__texto">{e.texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
