import Cabecalho from "@/components/layout/Cabecalho";
import Rodape from "@/components/layout/Rodape";
import Topo from "@/components/home/Topo";
import Projetos from "@/components/home/Projetos";
import Experiencia from "@/components/home/Experiencia";
import Competencias from "@/components/home/Competencias";

export default function Home() {
  return (
    <div className="camada">
      <Cabecalho />
      <main id="conteudo">
        <Topo />
        <Projetos />
        <Experiencia />
        <Competencias />
      </main>
      <Rodape />
    </div>
  );
}
