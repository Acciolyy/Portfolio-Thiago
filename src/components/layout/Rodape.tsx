import { contato, site } from "@/content/site";
import Rotulo from "@/components/ui/Rotulo";
import Perfis from "@/components/ui/Perfis";

// 05 — contato. Fecha a Home.
export default function Rodape() {
  return (
    <footer id="contato" className="rodape" aria-labelledby="h-contato">
      <div className="wrap rodape__corpo">
        <div className="rodape__texto">
          <Rotulo n="05">{contato.rotulo}</Rotulo>
          <h2 id="h-contato" className="h-sec rodape__titulo">
            {contato.titulo[0]}
            <br />
            {contato.titulo[1]}
          </h2>
          <a className="rodape__email" href={`mailto:${site.email}`}>
            {site.email}
          </a>
        </div>
        <Perfis />
      </div>
      <div className="wrap rodape__fim">
        © {site.ano} {site.nome} · {site.local}
      </div>
    </footer>
  );
}
