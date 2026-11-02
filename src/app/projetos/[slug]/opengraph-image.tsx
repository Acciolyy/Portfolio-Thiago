import { casoPorSlug, casos } from "@/content/casos";
import { imagemOg, tamanho } from "../../_og/imagem";

export const alt = "Estudo de caso de Thiago Accioly";
export const size = tamanho;
export const contentType = "image/png";

export function generateStaticParams() {
  return casos.map((c) => ({ slug: c.slug }));
}

export default async function Imagem({ params }: { params: Promise<{ slug: string }> }) {
  const caso = casoPorSlug((await params).slug);
  return imagemOg({
    rotulo: caso ? `${caso.rotulo[0]} · ${caso.rotulo[1]}` : "estudo de caso",
    titulo: caso?.titulo ?? "Estudo de caso",
    frase: caso ? caso.tags.slice(0, 4).join(" · ") : "",
  });
}
