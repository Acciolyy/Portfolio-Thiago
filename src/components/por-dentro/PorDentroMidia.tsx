"use client";

import VideoMudo from "@/components/ui/VideoMudo";

export type MidiaPorDentro = { src: string; poster: string; descricao: string; legenda: string };

// Por dentro de um projeto de "Outros projetos": o vídeo dele, baixado só
// quando o painel abre.
export default function PorDentroMidia({ src, poster, descricao, legenda }: MidiaPorDentro) {
  return (
    <figure className="por-dentro__midia por-dentro__midia--larga">
      <VideoMudo src={src} poster={poster} descricao={descricao} />
      <figcaption className="rot">{legenda}</figcaption>
    </figure>
  );
}
