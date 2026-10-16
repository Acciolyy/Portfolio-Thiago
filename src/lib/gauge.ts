// Comprimento do arco de 270 graus do mostrador (raio 44).
export const ARCO = 207.345;

// Valor final do stroke-dashoffset, já no HTML: sem JS o mostrador aparece certo.
export function dashoffsetFinal(valor: number, max: number): string {
  return (ARCO * (1 - valor / max)).toFixed(2);
}
