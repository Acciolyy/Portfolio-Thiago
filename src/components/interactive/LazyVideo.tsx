"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/motion";

type Props = { src: string; ariaLabel: string; id?: string };

/* Vídeo que só carrega e toca perto da viewport. Pausa fora dela e com a aba
   oculta. Com prefers-reduced-motion carrega o primeiro quadro e entrega os
   controles nativos: o play é do usuário. */
export default function LazyVideo({ src, ariaLabel, id }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video || !("IntersectionObserver" in window)) return;

    video.muted = true;
    const semMovimento = prefersReducedMotion();
    let visivel = false;

    const carregar = () => {
      if (video.preload === "none") {
        video.preload = "metadata";
        video.load();
      }
    };

    const tocar = () => {
      // Sem movimento: nada toca sozinho, quem decide é o controle nativo.
      if (semMovimento || !visivel || document.hidden) return;
      video.play()?.catch(() => {
        /* autoplay bloqueado, tudo bem */
      });
    };

    if (semMovimento) {
      video.controls = true;
      video.loop = false;
      video.removeAttribute("loop");
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          visivel = e.isIntersecting;

          if (e.isIntersecting) {
            carregar();
            tocar();
          } else {
            video.pause();
          }
        });
      },
      { rootMargin: "200px 0px" },
    );
    observador.observe(video);

    const aoMudarVisibilidade = () => {
      if (document.hidden) video.pause();
      else tocar();
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      observador.disconnect();
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      video.pause();
    };
  }, []);

  return (
    <video
      ref={ref}
      id={id}
      src={src}
      preload="none"
      muted
      loop
      playsInline
      aria-label={ariaLabel}
    />
  );
}
