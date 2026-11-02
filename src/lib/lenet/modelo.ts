// Carrega o onnxruntime-web e a LeNet-5 sob demanda. Este módulo inteiro só
// é importado (import dinâmico) quando o quadro da demo entra na tela, então
// nem o runtime nem o modelo entram no carregamento inicial da página.
import * as ort from "onnxruntime-web/wasm";
import { preprocess } from "./preprocess.js";

export const URL_MODELO =
  "https://huggingface.co/Acciolyyy/lenet5-mnist-unb/resolve/main/model.onnx";

// Os .wasm vêm do jsDelivr, na mesma versão do pacote (como no Space).
const URL_WASM = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";

// visao: a entrada já pré-processada (28 × 28, valores de 0 a 1) que vai
// para a rede; ms: o tempo da inferência (só o session.run), medido aqui.
export type Previsao = { digito: number; confianca: number; probs: number[]; visao: Float32Array; ms: number };

export type Modelo = {
  bytes: number;
  classificar: (rgba: Uint8ClampedArray, h: number, w: number) => Promise<Previsao | null>;
};

export async function carregarModelo(): Promise<Modelo> {
  ort.env.wasm.wasmPaths = URL_WASM;
  ort.env.wasm.numThreads = 1;

  let resp: Response;
  try {
    resp = await fetch(URL_MODELO);
  } catch {
    throw new Error("sem conexão com o Hugging Face");
  }
  if (!resp.ok) throw new Error(`o Hugging Face respondeu HTTP ${resp.status}`);
  const buf = new Uint8Array(await resp.arrayBuffer());
  const sessao = await ort.InferenceSession.create(buf, { executionProviders: ["wasm"] });

  async function classificar(rgba: Uint8ClampedArray, h: number, w: number) {
    // Mesma conversão para cinza do Pillow (modo "L"), como no app do Space.
    const gray = new Float32Array(h * w);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = (rgba[i * 4] * 19595 + rgba[i * 4 + 1] * 38470 + rgba[i * 4 + 2] * 7471 + 0x8000) >> 16;
    }
    const out = preprocess(gray, h, w);
    if (!out) return null;
    const t0 = performance.now();
    const res = await sessao.run({ input: new ort.Tensor("float32", out.tensor, [1, 1, 28, 28]) });
    const ms = performance.now() - t0;
    const logits = Array.from(res.logits.data as Float32Array);
    const m = Math.max(...logits);
    const exps = logits.map((v) => Math.exp(v - m));
    const soma = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map((v) => v / soma);
    const confianca = Math.max(...probs);
    return { digito: probs.indexOf(confianca), confianca, probs, visao: out.canvas, ms };
  }

  return { bytes: buf.byteLength, classificar };
}
