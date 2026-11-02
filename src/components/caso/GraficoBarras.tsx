import type { Barra } from "@/content/casos/tipos";

// Barras horizontais em HTML/CSS. Para leitor de tela, uma tabela com os mesmos
// números (as barras em si ficam fora da árvore de acessibilidade).
export default function GraficoBarras({ legenda, barras }: { legenda: string; barras: Barra[] }) {
  return (
    <figure className="card grafico">
      <figcaption className="rot">{legenda}</figcaption>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Métrica</th>
            <th scope="col">Base</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {barras.map((b) => (
            <tr key={b.rotulo}>
              <th scope="row">{b.rotulo}</th>
              <td>{b.base}</td>
              <td>{b.texto}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div aria-hidden="true" className="grafico__linhas">
        {barras.map((b) => (
          <div key={b.rotulo} className="grafico__linha">
            <span className="grafico__rotulo">
              {b.rotulo}
              <br />
              <span>{b.base}</span>
            </span>
            <span className="grafico__trilho">
              <span
                className="grafico__barra"
                data-destaque={b.destaque || undefined}
                style={{ width: `${b.valor}%` }}
              />
            </span>
            <span className="num grafico__valor">{b.texto}</span>
          </div>
        ))}
      </div>
    </figure>
  );
}
