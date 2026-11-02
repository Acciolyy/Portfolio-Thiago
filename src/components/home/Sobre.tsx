import Image from "next/image";
import { sobre } from "@/content/sobre";
import Rotulo from "@/components/ui/Rotulo";

export default function Sobre() {
  return (
    <section id="sobre" className="wrap secao secao--sobre" aria-labelledby="h-sobre">
      <div className="sobre">
        <figure className="painel sobre__foto">
          <Image
            src={sobre.foto.src}
            alt={sobre.foto.alt}
            width={sobre.foto.largura}
            height={sobre.foto.altura}
            sizes="(max-width: 900px) 70vw, 320px"
          />
        </figure>
        <div className="sobre__texto">
          <Rotulo n="05">{sobre.rotulo}</Rotulo>
          <h2 id="h-sobre" className="h-sec">
            {sobre.titulo}
          </h2>
          <p className="sobre__paragrafo">{sobre.texto}</p>
        </div>
      </div>
    </section>
  );
}
