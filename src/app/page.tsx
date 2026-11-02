import Sobre from "@/components/sections/Sobre";
import NemTudo from "@/components/sections/NemTudo";
import Projetos from "@/components/sections/Projetos";
import OutrosInteresses from "@/components/sections/OutrosInteresses";
import Topo from "@/components/home/Topo";
import Cabecalho from "@/components/layout/Cabecalho";
import Rodape from "@/components/layout/Rodape";

export default function Home() {
  return (
    <div className="camada">
      <Cabecalho />
      <main id="conteudo">
        <Topo />
        <Sobre />
        <NemTudo />
        <Projetos />
        <OutrosInteresses />
      </main>
      <Rodape />
    </div>
  );
}
