import { nota } from "@/content/nota";
import Section from "@/components/ui/Section";

// ================== 03 / NEM TUDO É O QUE PARECE =========================
export default function NemTudo() {
  return (
    <Section id="nem-tudo" variante="nota" rotulo={nota.rotulo}>
      <div className="note indent">
        <div className="note__grid">
          <div>
            {nota.paragrafos.map((p) => (
              <p key={p.slice(0, 40)}>{p}</p>
            ))}
          </div>

          {/* O raciocínio em três linhas, do jeito que eu anotaria no código. */}
          <aside className="anota">
            {nota.anotacao.map((linha) => (
              <span key={linha}>{linha}</span>
            ))}
          </aside>
        </div>
      </div>
    </Section>
  );
}
