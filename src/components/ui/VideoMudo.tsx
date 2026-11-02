"use client";

import { useEffect, useRef } from "react";

// Vídeo mudo em loop. Só baixa quando é montado (preload="none" e src
// definido por quem chama) e toca sozinho só na tela e sem
// prefers-reduced-motion; com movimento reduzido fica no poster, e os
// controles nativos deixam tocar ou pausar.
export default function VideoMudo({
  src,
  poster,
  descricao,
  className,
}: {
  src: string;
  poster: string;
  descricao: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduz = matchMedia("(prefers-reduced-motion: reduce)");
    const obs = new IntersectionObserver(([e]) => {
      if (reduz.matches) return;
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    });
    obs.observe(v);
    return () => obs.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      className={["video-mudo", className].filter(Boolean).join(" ")}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      controls
      preload="none"
      aria-label={descricao}
    />
  );
}
