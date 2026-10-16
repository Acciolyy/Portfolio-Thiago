import { contato } from "@/content/site";
import Section from "@/components/ui/Section";

// ============================== 06 / CONTATO =============================
export default function Contato() {
  return (
    <Section id="contato" variante="contato" rotulo="06 / CONTATO">
      <div className="contact indent">
        <h2>{contato.titulo}</h2>
        <p>{contato.texto}</p>

        <div className="contact__links">
          {contato.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              {...(l.externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              <span className="k">{l.k}</span>
              <span className="v">{l.v}</span>
            </a>
          ))}
        </div>
      </div>
    </Section>
  );
}
