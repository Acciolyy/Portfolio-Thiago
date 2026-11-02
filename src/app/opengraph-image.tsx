import { topo } from "@/content/home";
import { imagemOg, tamanho } from "./_og/imagem";

export const alt = `Thiago Accioly: ${topo.posicionamento.join(" · ")}`;
export const size = tamanho;
export const contentType = "image/png";

export default function Imagem() {
  return imagemOg({
    rotulo: topo.posicionamento.join(" · "),
    titulo: "Thiago Accioly",
    frase: topo.frase.join(""),
  });
}
