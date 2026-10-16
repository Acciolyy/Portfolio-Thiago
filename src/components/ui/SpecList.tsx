import JoinSep from "./JoinSep";

type Linha = { rotulo: string; itens: readonly string[] };

// Ficha técnica (.spec): só as linhas entre os pares, sem moldura.
export default function SpecList({ ficha }: { ficha: readonly Linha[] }) {
  return (
    <dl className="spec">
      {ficha.map((linha) => (
        <div className="spec__row" key={linha.rotulo}>
          <dt>{linha.rotulo}</dt>
          <dd>
            <JoinSep itens={linha.itens} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
