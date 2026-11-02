import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { casoPorSlug, casos } from "@/content/casos";
import Cabecalho from "@/components/layout/Cabecalho";
import EstudoDeCaso from "@/components/caso/EstudoDeCaso";

// Só os estudos de caso listados existem; qualquer outro slug é 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return casos.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const caso = casoPorSlug((await params).slug);
  if (!caso) return {};
  return {
    title: caso.titulo,
    description: caso.descricao,
    openGraph: { type: "article", title: caso.titulo, description: caso.descricao, url: `/projetos/${caso.slug}` },
  };
}

export default async function Pagina({ params }: { params: Promise<{ slug: string }> }) {
  const caso = casoPorSlug((await params).slug);
  if (!caso) notFound();
  return (
    <div className="camada">
      <Cabecalho variante="caso" />
      <EstudoDeCaso caso={caso} />
    </div>
  );
}
