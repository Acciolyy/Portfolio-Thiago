import Hero from "@/components/sections/Hero";
import Sobre from "@/components/sections/Sobre";
import NemTudo from "@/components/sections/NemTudo";
import Projetos from "@/components/sections/Projetos";
import OutrosInteresses from "@/components/sections/OutrosInteresses";
import Contato from "@/components/sections/Contato";

export default function Home() {
  return (
    <main id="conteudo">
      <Hero />
      <Sobre />
      <NemTudo />
      <Projetos />
      <OutrosInteresses />
      <Contato />
    </main>
  );
}
