// Lido uma vez, dentro dos efeitos (nunca no render, para não gerar diferença
// de hidratação). Com a preferência ligada, nenhuma animação roda: ficam os
// valores finais que já vêm no HTML.
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}
