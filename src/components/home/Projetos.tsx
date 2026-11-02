import Link from "next/link";
import { destaques, outros } from "@/content/home";
import Rotulo from "@/components/ui/Rotulo";
import Tag from "@/components/ui/Tag";

// 01 — projetos em destaque e 02 — outros projetos (a mesma seção, como na prancha).
export default function Projetos() {
  return (
    <section id="projetos" className="wrap secao secao--projetos" aria-labelledby="h-proj">
      <div className="secao__cabeca secao__cabeca--lado">
        <div className="secao__titulos">
          <Rotulo n="01">{destaques.rotulo}</Rotulo>
          <h2 id="h-proj" className="h-sec">
            {destaques.titulo}
          </h2>
        </div>
        <p className="secao__intro">{destaques.texto}</p>
      </div>

      <div className="dest">
        {destaques.itens.map((p) => (
          <article key={p.id} className="card dest__card" aria-labelledby={`p-${p.id}`}>
            <div className="dest__corpo">
              <p className="rot">
                <b>{p.rotulo[0]}</b> · {p.rotulo[1]}
              </p>
              <h3 id={`p-${p.id}`} className="dest__titulo">
                {p.titulo}
              </h3>
              <p className="dest__texto">{p.texto}</p>
            </div>
            <dl className="metr">
              {p.metricas.map((m) => (
                <div key={m.rotulo}>
                  <dt className="rot">{m.rotulo}</dt>
                  <dd className="num metr__valor" data-destaque={m.destaque || undefined}>
                    {m.valor}
                    {m.extra && <span> {m.extra}</span>}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="dest__pe">
              <div className="tags">
                {p.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </div>
              <Link className="mais" href={p.href} aria-label={`Estudo de caso: ${p.titulo}`}>
                Estudo de caso <span aria-hidden="true">→</span>
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="outros-bloco">
        <Rotulo n="02">{outros.rotulo}</Rotulo>
        <div className="outros">
          {outros.itens.map((o) => (
            <article key={o.titulo} className="card outro">
              <p className="rot">{o.tipo}</p>
              <h3 className="outro__titulo">{o.titulo}</h3>
              <p className="outro__texto">{o.texto}</p>
              <div className="outro__pe">
                <span className="outro__numero">{o.numero}</span>
                <span className="outro__links">
                  {o.links.map((l) => (
                    <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                      {l.rotulo} <span aria-hidden="true">↗</span>
                      <span className="sr-only"> de {o.titulo} (abre em nova aba)</span>
                    </a>
                  ))}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
