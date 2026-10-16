import JoinSep from "./JoinSep";

export default function StackLine({ itens }: { itens: readonly string[] }) {
  return (
    <p className="stack mt-6">
      <JoinSep itens={itens} />
    </p>
  );
}
