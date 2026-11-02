import { contato, site } from "@/content/site";
import Rotulo from "@/components/ui/Rotulo";
import Perfis from "@/components/ui/Perfis";

// 06 — contato. Fecha a Home.
export default function Rodape() {
  return (
    <footer id="contato" className="rodape" aria-labelledby="h-contato">
      <div className="wrap rodape__corpo">
        <div className="painel rodape__painel" data-ativo>
          <div className="rodape__texto">
            <Rotulo n="06">{contato.rotulo}</Rotulo>
            <h2 id="h-contato" className="h-sec rodape__titulo">
              {contato.titulo}
            </h2>
            <a className="rodape__email colchetes" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </div>
          <Perfis />
        </div>
      </div>
      <div className="wrap rodape__fim">
        © {site.ano} {site.nome} · {site.local}
      </div>
    </footer>
  );
}
