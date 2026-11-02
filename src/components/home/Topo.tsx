import { topo } from "@/content/home";
import Perfis from "@/components/ui/Perfis";
import DemoLenet from "./DemoLenet";

// Topo da Home: quem sou, à esquerda; a LeNet-5 rodando de verdade, à direita.
export default function Topo() {
  return (
    <section id="topo" className="wrap topo" aria-labelledby="h-nome">
      <div className="topo__texto">
        <p className="rot">
          {topo.posicionamento[0]} <b>·</b> {topo.posicionamento[1]}
        </p>
        <h1 id="h-nome" className="topo__nome">
          {topo.nome[0]}
          <br />
          {topo.nome[1]}
        </h1>
        <p className="topo__frase">
          {topo.frase[0]}
          <span>{topo.frase[1]}</span>
          {topo.frase[2]}
        </p>
        <p className="topo__resumo">{topo.resumo}</p>
        <Perfis destaque />
      </div>
      <DemoLenet />
    </section>
  );
}
