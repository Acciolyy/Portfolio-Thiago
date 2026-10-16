import type { Link } from "@/content/tipos";

// Linha de links externos (.out-row), cada um com a seta ↗.
export default function OutRow({ links }: { links: readonly Link[] }) {
  return (
    <div className="out-row">
      {links.map((l) => (
        <a
          key={l.href}
          className="out"
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {l.rotulo}{" "}
          <span className="arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      ))}
    </div>
  );
}
