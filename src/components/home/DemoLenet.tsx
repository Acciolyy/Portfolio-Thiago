"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { demo } from "@/content/home";
import type { Modelo, Previsao } from "@/lib/lenet/modelo";

const LADO = 280; // 28 × 28, ampliado 10×
const PINCEL = 18; // a mesma espessura do Space, em que o pré-processamento foi validado
const FUNDO = "#0A0C0E";
const TRACO = "#F4F2ED";

// O "7" do botão Exemplo (o traço da prancha), em coordenadas do quadro.
const TRACO_7 = [
  [[64, 70], [212, 70], [196, 104], [168, 160], [142, 218], [128, 236]],
  [[104, 150], [190, 150]],
];

type Estado = "espera" | "carregando" | "pronto" | "erro";

const pct = (p: number) => `${(p * 100).toFixed(1).replace(".", ",")}%`;

export default function DemoLenet() {
  const quadro = useRef<HTMLCanvasElement>(null);
  const modelo = useRef<Modelo | null>(null);
  const ultimo = useRef<{ x: number; y: number } | null>(null);
  const temTraco = useRef(false);

  const [estado, setEstado] = useState<Estado>("espera");
  const [erro, setErro] = useState("");
  const [bytes, setBytes] = useState(0);
  const [previsao, setPrevisao] = useState<Previsao | null>(null);

  const ctx = () => quadro.current?.getContext("2d", { willReadFrequently: true }) ?? null;

  const limparQuadro = useCallback(() => {
    const g = ctx();
    if (!g) return;
    g.fillStyle = FUNDO;
    g.fillRect(0, 0, LADO, LADO);
    temTraco.current = false;
  }, []);

  const pincel = (g: CanvasRenderingContext2D) => {
    g.strokeStyle = TRACO;
    g.lineWidth = PINCEL;
    g.lineCap = "round";
    g.lineJoin = "round";
  };

  const desenharExemplo = useCallback(() => {
    limparQuadro();
    const g = ctx();
    if (!g) return;
    pincel(g);
    for (const t of TRACO_7) {
      g.beginPath();
      t.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
    }
    temTraco.current = true;
  }, [limparQuadro]);

  const classificar = useCallback(async () => {
    const m = modelo.current;
    const g = ctx();
    if (!m || !g || !temTraco.current) return;
    const { data } = g.getImageData(0, 0, LADO, LADO);
    setPrevisao(await m.classificar(data, LADO, LADO));
  }, []);

  const carregar = useCallback(async () => {
    setEstado("carregando");
    setErro("");
    try {
      const { carregarModelo } = await import("@/lib/lenet/modelo");
      const m = await carregarModelo();
      modelo.current = m;
      setBytes(m.bytes);
      setEstado("pronto");
      await classificar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
      setEstado("erro");
    }
  }, [classificar]);

  // O quadro começa com o exemplo desenhado; o modelo só é baixado quando
  // o quadro entra na tela.
  useEffect(() => {
    desenharExemplo();
    const el = quadro.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting)) {
          obs.disconnect();
          carregar();
        }
      },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [desenharExemplo, carregar]);

  const ponto = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * LADO) / r.width, y: ((e.clientY - r.top) * LADO) / r.height };
  };

  const riscar = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const g = ctx();
    if (!g) return;
    pincel(g);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
    temTraco.current = true;
  };

  const aoDescer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    // Os traços se acumulam (um 4 ou um X pedem mais de um); "Limpar" recomeça.
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = ponto(e);
    ultimo.current = p;
    riscar(p, p);
  };

  const aoMover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!ultimo.current) return;
    const p = ponto(e);
    riscar(ultimo.current, p);
    ultimo.current = p;
  };

  const aoSubir = () => {
    if (!ultimo.current) return;
    ultimo.current = null;
    classificar();
  };

  const limpar = () => {
    limparQuadro();
    setPrevisao(null);
  };

  const exemplo = () => {
    desenharExemplo();
    setPrevisao(null);
    classificar();
  };

  const baixa = previsao !== null && previsao.confianca < demo.limiar;
  const maior = previsao?.digito ?? -1;

  let mensagem: string = demo.vazio;
  if (estado === "espera" || estado === "carregando") mensagem = demo.carregando;
  else if (estado === "erro") mensagem = `Não foi possível carregar o modelo: ${erro}.`;

  const resumoBarras = previsao
    ? `Probabilidade por dígito: ${previsao.probs.map((p, k) => `${k}: ${pct(p)}`).join("; ")}.`
    : "Sem previsão ainda.";

  let nota = "o modelo carrega quando o quadro aparece";
  if (estado === "carregando") nota = "baixando o modelo do Hugging Face…";
  if (estado === "pronto") nota = `modelo carregado sob demanda · ${Math.round(bytes / 1024)} KB`;
  if (estado === "erro") nota = "modelo não carregado";

  return (
    <figure className="card demo" aria-labelledby="demo-t">
      <div className="demo__topo">
        <h2 id="demo-t" className="demo__titulo">
          {demo.titulo}
        </h2>
        <span className="rot">{demo.subtitulo}</span>
      </div>

      <div className="demo__corpo">
        <div className="demo__esq">
          <div className="demo__quadro">
            <canvas
              ref={quadro}
              width={LADO}
              height={LADO}
              role="img"
              aria-label="Quadro de desenho de 28 por 28 pixels"
              aria-describedby="demo-instrucoes"
              onPointerDown={aoDescer}
              onPointerMove={aoMover}
              onPointerUp={aoSubir}
              onPointerCancel={aoSubir}
            />
          </div>
          <p id="demo-instrucoes" className="sr-only">
            {demo.instrucoes}
          </p>
          <div className="demo__botoes">
            <button type="button" className="btn" onClick={limpar}>
              Limpar
            </button>
            <button type="button" className="btn" onClick={exemplo} disabled={estado !== "pronto"}>
              Exemplo
            </button>
          </div>
        </div>

        <div className="demo__dir">
          <span className="rot">previsão</span>
          <div aria-live="polite" aria-atomic="true" className="demo__saida">
            {previsao ? (
              <div className="demo__previsao">
                <span className="num demo__digito">{previsao.digito}</span>
                <span className="demo__conf">
                  confiança
                  <br />
                  <strong>{pct(previsao.confianca)}</strong>
                </span>
              </div>
            ) : (
              <p className="demo__msg" data-erro={estado === "erro" || undefined}>
                {mensagem}
              </p>
            )}
            {baixa && <p className="demo__alerta">{demo.baixaConfianca}</p>}
          </div>
          {estado === "erro" && (
            <button type="button" className="btn" onClick={carregar}>
              Tentar de novo
            </button>
          )}
          <div className="demo__barras" role="img" aria-label={resumoBarras}>
            {Array.from({ length: 10 }, (_, k) => (
              <span
                key={k}
                className="demo__barra"
                data-maior={k === maior || undefined}
                style={{ height: `${Math.max(2, (previsao?.probs[k] ?? 0) * 100)}%` }}
              />
            ))}
          </div>
          <div className="demo__eixo" aria-hidden="true">
            {Array.from({ length: 10 }, (_, k) => (
              <span key={k} data-maior={k === maior || undefined}>
                {k}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="demo__legenda">
        <span>{nota}</span>
        <span>
          {demo.acuracia} ·{" "}
          <a href={demo.space} target="_blank" rel="noopener noreferrer">
            ver no Hugging Face ↗<span className="sr-only"> (abre em nova aba)</span>
          </a>
        </span>
      </figcaption>
    </figure>
  );
}
