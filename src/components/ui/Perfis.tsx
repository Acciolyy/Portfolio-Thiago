import { perfis } from "@/content/site";
import Botao from "./Botao";

// GitHub, LinkedIn, Hugging Face e Currículo. `destaque` pinta o primeiro.
export default function Perfis({ destaque = false }: { destaque?: boolean }) {
  return (
    <div className="botoes">
      {perfis.map((p, i) => (
        <Botao key={p.href} href={p.href} externo={p.externo} cheio={destaque && i === 0}>
          {p.rotulo}
        </Botao>
      ))}
    </div>
  );
}
