// Tipos de preprocess.js (UMD: no bundler entra como CommonJS).
export const MEAN: number;
export const STD: number;
export function preprocess(
  gray: ArrayLike<number>,
  h: number,
  w: number,
): { tensor: Float32Array; canvas: Float32Array } | null;
