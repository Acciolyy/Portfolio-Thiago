import { gaugesSobre, sobre, terminal } from "@/content/sobre";
import Section from "@/components/ui/Section";
import GaugeGroup from "@/components/ui/GaugeGroup";
import Terminal from "@/components/interactive/Terminal";

// ============================== 02 / SOBRE ===============================
export default function Sobre() {
  return (
    <Section id="sobre" variante="sobre" rotulo={sobre.rotulo}>
      <div className="about">
        <figure className="about__photo m-0">
          <img
            src={sobre.foto.src}
            alt={sobre.foto.alt}
            width={152}
            height={152}
            loading="lazy"
            decoding="async"
          />
          <figcaption>{sobre.foto.legenda}</figcaption>
        </figure>

        <div className="about__text indent">
          {sobre.paragrafos.map((p) => (
            <p key={p.slice(0, 40)}>{p}</p>
          ))}

          <Terminal trechos={terminal} />

          <GaugeGroup gauges={gaugesSobre} />
        </div>
      </div>
    </Section>
  );
}
