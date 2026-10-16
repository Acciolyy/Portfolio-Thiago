import { projetos } from "@/content/projetos";
import Section from "@/components/ui/Section";
import FeatureProject, { FeatureCorpo } from "@/components/ui/FeatureProject";
import ProjectGrid from "@/components/ui/ProjectGrid";
import ProjectCard from "@/components/ui/ProjectCard";
import LazyVideo from "@/components/interactive/LazyVideo";

// ============================= 04 / PROJETOS =============================
export default function Projetos() {
  const { principal, cards } = projetos;

  return (
    <Section id="projetos" variante="projetos" rotulo={projetos.rotulo}>
      {/* Projeto principal: mídia à esquerda, texto à direita. */}
      <FeatureProject variante="main" media={<LazyVideo {...principal.video} />}>
        <FeatureCorpo projeto={principal} />
      </FeatureProject>

      {/* Demais projetos. O brilho de borda segue o cursor só nesta grade. */}
      <ProjectGrid variante="single" glow>
        {cards.map((c) => (
          <ProjectCard key={c.titulo} projeto={c} />
        ))}
      </ProjectGrid>
    </Section>
  );
}
