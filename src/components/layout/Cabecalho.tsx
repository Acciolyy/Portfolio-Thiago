import Link from "next/link";
import { nav, site } from "@/content/site";
import BotaoTema from "@/components/tema/BotaoTema";

// Cabeçalho fixo. Na Home: marca, navegação por seção e tema. No estudo de
// caso: volta para os projetos e tema.
export default function Cabecalho({ variante = "home" }: { variante?: "home" | "caso" }) {
  return (
    <header className="cabecalho">
      <div className="wrap cabecalho__barra">
        {variante === "home" ? (
          <>
            <a className="marca" href="#topo">
              <span aria-hidden="true" className="marca__prompt">
                &gt;&gt;&gt;
              </span>
              <span className="marca__nome">{site.nome}</span>
            </a>
            <nav className="cabecalho__nav" aria-label="Seções">
              {nav.map((item) => (
                <a key={item.href} href={item.href}>
                  {item.rotulo}
                </a>
              ))}
            </nav>
          </>
        ) : (
          <Link className="cabecalho__volta" href="/#projetos">
            <span aria-hidden="true">←</span> {site.nome} · projetos
          </Link>
        )}
        <BotaoTema />
      </div>
    </header>
  );
}
