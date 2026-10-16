import { outrosInteresses } from "@/content/outros-interesses";
import Section from "@/components/ui/Section";
import FeatureProject, { FeatureCorpo } from "@/components/ui/FeatureProject";
import ProjectGrid from "@/components/ui/ProjectGrid";
import ProjectCard from "@/components/ui/ProjectCard";
import LazyVideo from "@/components/interactive/LazyVideo";
import {
  CarouselCaption,
  CarouselMedia,
  CarouselProvider,
} from "@/components/interactive/Carousel";

// ======================= 05 / OUTROS INTERESSES ==========================
export default function OutrosInteresses() {
  const { detector, portfolioIA, cards } = outrosInteresses;

  return (
    <Section id="outros-interesses" variante="projetos" rotulo={outrosInteresses.rotulo}>
      {/* Texto à esquerda, mídia à direita. */}
      <FeatureProject variante="inverso" media={<LazyVideo {...detector.video} />}>
        <FeatureCorpo projeto={detector} />
      </FeatureProject>

      {/* Carrossel à esquerda, texto à direita. A legenda mora na coluna de
          texto e troca junto com o slide. */}
      <CarouselProvider>
        <FeatureProject media={<CarouselMedia />}>
          <FeatureCorpo projeto={portfolioIA} aposTexto={<CarouselCaption />} />
        </FeatureProject>
      </CarouselProvider>

      {/* Demais projetos */}
      <ProjectGrid variante="pair">
        {cards.map((c) => (
          <ProjectCard key={c.titulo} projeto={c} />
        ))}
      </ProjectGrid>
    </Section>
  );
}
