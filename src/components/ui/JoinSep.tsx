import { Fragment } from "react";

// "A · B · C", com o separador em <span class="sep"> e um espaço de cada lado,
// como no HTML original.
export default function JoinSep({ itens }: { itens: readonly string[] }) {
  return (
    <>
      {itens.map((item, i) => (
        <Fragment key={item}>
          {i > 0 && (
            <>
              {" "}
              <span className="sep">·</span>{" "}
            </>
          )}
          {item}
        </Fragment>
      ))}
    </>
  );
}
