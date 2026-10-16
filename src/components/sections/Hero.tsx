import { hero } from "@/content/hero";
import Section from "@/components/ui/Section";
import SpecList from "@/components/ui/SpecList";
import Telemetry from "@/components/interactive/Telemetry";

// ============================== 01 / INICIO ==============================
export default function Hero() {
  return (
    <Section id="inicio" variante="hero" rotulo={hero.rotulo}>
      <div className="hero__top">
        <div className="hero__lead">
          <p className="hero__name">{hero.nome}</p>

          <h1 className="hero__title">
            {hero.titulo} <span className="py">{hero.tituloDestaque}</span>
          </h1>

          <p className="hero__pitch indent">{hero.pitch}</p>
        </div>

        <SpecList ficha={hero.ficha} />
      </div>

      <Telemetry celulas={hero.telemetria} />
    </Section>
  );
}
