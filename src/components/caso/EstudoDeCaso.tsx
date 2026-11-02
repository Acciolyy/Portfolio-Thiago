import type { EstudoDeCaso as Caso } from "@/content/casos/tipos";
import Botao from "@/components/ui/Botao";
import Rotulo from "@/components/ui/Rotulo";
import Tag from "@/components/ui/Tag";
import DemoLenet from "@/components/home/DemoLenet";
import GraficoBarras from "./GraficoBarras";
import VideoCaso from "./VideoCaso";

function Titulo({ n, id, children }: { n: string; id: string; children: React.ReactNode }) {
  return (
    <div className="secao__titulos">
      <Rotulo n={n} />
      <h2 id={id} className="h-sec">
        {children}
      </h2>
    </div>
  );
}

// Template único dos estudos de caso (prancha Projeto). As seções numeradas
// seguem a ordem do conteúdo; uma seção sem conteúdo não é desenhada.
export default function EstudoDeCaso({ caso }: { caso: Caso }) {
  const secoes = [
    "porque",
    "como",
    "decisoes",
    "resultado",
    "erros",
    ...(caso.proximos.length ? ["proximos"] : []),
  ];
  const n = (s: string) => String(secoes.indexOf(s) + 1).padStart(2, "0");
  const repo = caso.repositorio.replace("https://", "");

  return (
    <main id="conteudo" className="wrap caso">
      <section className="caso-hero" aria-labelledby="c-titulo">
        <div className="caso-hero__texto">
          <p className="rot">
            <b>{caso.rotulo[0]}</b> · {caso.rotulo[1]}
          </p>
          <h1 id="c-titulo" className="caso-hero__titulo">
            {caso.titulo}
          </h1>
          <p className="caso-hero__resumo">{caso.resumo}</p>
          <div className="tags">
            {caso.tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </div>
          <div className="botoes">
            {caso.links.map((l) => (
              <Botao key={l.href} href={l.href} externo cheio={l.cheio}>
                {l.rotulo}
              </Botao>
            ))}
          </div>
        </div>
        {caso.midia.tipo === "video" ? (
          <figure className="card caso-midia">
            <VideoCaso src={caso.midia.src} poster={caso.midia.poster} descricao={caso.midia.descricao} />
            <figcaption className="caso-midia__legenda">{caso.midia.legenda}</figcaption>
          </figure>
        ) : (
          <DemoLenet />
        )}
      </section>

      <section className="caso-secao" aria-labelledby="c-resumo">
        <h2 id="c-resumo" className="rot">
          <b>resumo em números</b>
        </h2>
        <dl className="resumo">
          {caso.numeros.map((x) => (
            <div key={x.rotulo}>
              <dt className="rot">{x.rotulo}</dt>
              <dd className="num resumo__valor" data-destaque={x.destaque || undefined}>
                {x.valor}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="duas" aria-labelledby="c-porque">
        <Titulo n={n("porque")} id="c-porque">
          Por que fiz
        </Titulo>
        <div className="prosa">
          {caso.porQue.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </section>

      <section className="caso-secao" aria-labelledby="c-como">
        <Titulo n={n("como")} id="c-como">
          Como funciona
        </Titulo>
        <ol className="passos" aria-label={caso.fluxo.rotulo}>
          {caso.fluxo.passos.map((p, i) => (
            <li key={p.titulo} className="passos__item">
              <div className="card passo" data-destaque={p.destaque || undefined}>
                <span className="passo__n">{String(i + 1).padStart(2, "0")}</span>
                <strong className="passo__titulo">{p.titulo}</strong>
                <span className="passo__texto">{p.texto}</span>
              </div>
              {i < caso.fluxo.passos.length - 1 && (
                <span className="passos__seta" aria-hidden="true">
                  →
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="caso-secao" aria-labelledby="c-dec">
        <Titulo n={n("decisoes")} id="c-dec">
          Decisões técnicas
        </Titulo>
        <div className="decisoes">
          {caso.decisoes.map((d) => (
            <article key={d.escolha} className="card decisao">
              <h3 className="decisao__escolha">{d.escolha}</h3>
              <dl className="decisao__dl">
                <dt className="decisao__motivo">motivo</dt>
                <dd>{d.motivo}</dd>
                <dt className="decisao__alt">alternativa</dt>
                <dd className="decisao__alt-texto">{d.alternativa}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="duas" aria-labelledby="c-res">
        <div className="secao__titulos">
          <Rotulo n={n("resultado")} />
          <h2 id="c-res" className="h-sec">
            Resultado
          </h2>
          <p className="duas__texto">{caso.resultado.texto}</p>
          {caso.resultado.nota && <p className="duas__nota">{caso.resultado.nota}</p>}
        </div>
        <GraficoBarras legenda={caso.resultado.legenda} barras={caso.resultado.barras} />
      </section>

      <section className="duas" aria-labelledby="c-erro">
        <Titulo n={n("erros")} id="c-erro">
          O que deu errado e o que aprendi
        </Titulo>
        <ul className="licoes">
          {caso.erros.map((e) => (
            <li key={e.titulo} className="card licao" data-principal={e.principal || undefined}>
              <strong className="licao__titulo">{e.titulo}</strong>
              <span className="licao__texto">{e.texto}</span>
            </li>
          ))}
        </ul>
      </section>

      {caso.proximos.length > 0 && (
        <section className="duas" aria-labelledby="c-prox">
          <Titulo n={n("proximos")} id="c-prox">
            Próximos passos
          </Titulo>
          <ul className="proximos">
            {caso.proximos.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="card caso-links" aria-label="Links do projeto">
        <div>
          <p className="rot">código</p>
          <p className="caso-links__repo">{repo}</p>
        </div>
        <div className="botoes">
          {caso.links.map((l) => (
            <Botao key={l.href} href={l.href} externo cheio={l.cheio}>
              {l.rotulo}
            </Botao>
          ))}
          <Botao href="/#projetos">
            <span aria-hidden="true">←</span> Outros projetos
          </Botao>
        </div>
      </section>
    </main>
  );
}
