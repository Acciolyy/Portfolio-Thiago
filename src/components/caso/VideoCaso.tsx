"use client";

import { useEffect, useRef } from "react";

// Vídeo mudo em loop. Toca sozinho só quando está na tela e sem
// prefers-reduced-motion; com movimento reduzido fica parado no poster, e os
// controles nativos deixam tocar ou pausar quando quiser.
export default function VideoCaso({ src, poster, descricao }: { src: string; poster: string; descricao: string }) {
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
  }, []);

  return (
    <video
      ref={ref}
      className="caso-midia__video"
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
