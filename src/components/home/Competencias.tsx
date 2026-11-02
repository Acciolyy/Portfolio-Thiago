import { competencias } from "@/content/home";
import stack from "@/content/stack.json";
import Rotulo from "@/components/ui/Rotulo";
import RadarStack, { type ItemStack } from "./RadarStack";

// Servidor: lê o stack.json e passa os dados ao radar (vão no HTML, não no JS).
export default function Competencias() {
  return (
    <section id="competencias" className="wrap secao secao--comp" aria-labelledby="h-comp">
      <div className="secao__titulos">
        <Rotulo n="04">{competencias.rotulo}</Rotulo>
        <h2 id="h-comp" className="h-sec">
          {competencias.titulo}
        </h2>
      </div>
      <RadarStack
        itens={stack as ItemStack[]}
        camadas={competencias.camadas}
        projetos={competencias.projetos}
        legenda={competencias.legenda}
        dica={competencias.dica}
      />
    </section>
  );
}
