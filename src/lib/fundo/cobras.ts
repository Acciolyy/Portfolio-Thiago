// Fundo: "a cobra do Python feita de neurônios". Cada cobra é uma cadeia de
// nós ligados por linhas finas no ciano de HUD, com os nós no laranja. A
// cabeça percorre uma curva suave dentro da margem e o corpo a segue pelo
// mesmo caminho; um pulso de sinal percorre a cadeia da cabeça à cauda.
//
// Por que Canvas 2D e não Three.js: o desenho é só ponto e linha, em 2D. O
// three custaria ~150 KB gzip e um pipeline de 3D que nada aqui usa; com
// Canvas 2D o módulo inteiro tem poucos KB e cada quadro desenha algumas
// dezenas de nós.
//
// Regras: só nas margens, fora da coluna de conteúdo, com fade perto do
// container; nenhum nó sai da tela (tudo é limitado à faixa da margem);
// pausa com a aba oculta; devicePixelRatio limitado a 2; com
// prefers-reduced-motion desenha um quadro e para.

const CONTAINER = 1280;
const GUTTER = 32;
const FAIXA_MIN = 96; // abaixo disso não há margem de verdade: nada é desenhado
const NOS = 30;
const QPS = 30;

type Ponto = { x: number; y: number };

type Cobra = {
  lado: -1 | 1; // -1 margem esquerda, 1 direita
  fase: number;
  nos: Ponto[];
  cabecaY: number; // alvo vertical suavizado
};

type Cores = { fio: string; no: string; forca: number };

function lerCores(): Cores {
  const cs = getComputedStyle(document.documentElement);
  return {
    fio: cs.getPropertyValue("--fio").trim() || "#6F98A6",
    no: cs.getPropertyValue("--no").trim() || "#FF6B1A",
    forca: parseFloat(cs.getPropertyValue("--fio-forca")) || 0.4,
  };
}

// Brilho do nó pré-desenhado uma vez por cor (mais barato que shadowBlur).
function spriteBrilho(cor: string, r: number, dpr: number) {
  const c = document.createElement("canvas");
  const t = Math.ceil(r * 2 * dpr);
  c.width = c.height = t;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2);
  // Some para a própria cor com alfa 0 ("transparent" é preto transparente e
  // deixaria um halo sujo no modo dia).
  const h = cor.replace("#", "");
  const [r8, g8, b8] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  grad.addColorStop(0, cor);
  grad.addColorStop(0.25, `rgba(${r8}, ${g8}, ${b8}, 0.55)`);
  grad.addColorStop(1, `rgba(${r8}, ${g8}, ${b8}, 0)`);
  g.globalAlpha = 0.9;
  g.fillStyle = grad;
  g.fillRect(0, 0, t, t);
  return c;
}

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function iniciar(tela: HTMLCanvasElement): () => void {
  const ctx = tela.getContext("2d");
  if (!ctx) throw new Error("sem Canvas 2D");
  const g: CanvasRenderingContext2D = ctx;

  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, dpr = 1, faixa = 0;
  let cores = lerCores();
  let brilho = spriteBrilho(cores.no, 9, 1);
  const mouse = { x: -1, y: -1, ativo: false };
  let rolagem = 0;

  const cobras: Cobra[] = [
    { lado: -1, fase: 0, nos: [], cabecaY: 0 },
    { lado: 1, fase: 2.4, nos: [], cabecaY: 0 },
  ];

  // Limites da faixa de uma cobra, já com folga para o raio do maior nó.
  const limites = (c: Cobra) => {
    const folga = 14;
    const x0 = c.lado < 0 ? folga : W - faixa + folga;
    const x1 = c.lado < 0 ? faixa - folga : W - folga;
    return { x0, x1, y0: folga + 64, y1: H - folga }; // 64: não passa por baixo do cabeçalho
  };

  // 1 na borda da tela, 0 perto do container.
  const fade = (c: Cobra, x: number) => {
    const interno = c.lado < 0 ? faixa : W - faixa;
    const dist = c.lado < 0 ? interno - x : x - interno;
    return suave(0, Math.min(56, faixa * 0.45), dist);
  };

  function medir() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    tela.width = Math.round(W * dpr);
    tela.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    faixa = Math.max(0, (W - CONTAINER) / 2 + GUTTER - 8);
    brilho = spriteBrilho(cores.no, 9, dpr);
    // (Re)posiciona as cadeias dentro da faixa.
    for (const c of cobras) {
      const L = limites(c);
      c.cabecaY = (L.y0 + L.y1) / 2;
      c.nos = Array.from({ length: NOS }, () => ({ x: (L.x0 + L.x1) / 2, y: c.cabecaY }));
    }
  }

  // A cabeça percorre uma curva de Lissajous dentro da faixa, e cada nó do
  // corpo é a mesma curva amostrada um pouco atrás: o corpo segue a cabeça
  // exatamente pelo caminho dela. A rolagem desloca o centro da curva; o
  // cursor curva a cabeça de leve.
  function mover(c: Cobra, t: number) {
    const L = limites(c);
    const cx = (L.x0 + L.x1) / 2;
    const ax = (L.x1 - L.x0) / 2;
    const ay = Math.min(260, (L.y1 - L.y0) * 0.3);
    const doc = Math.max(1, document.documentElement.scrollHeight - H);
    const p = Math.min(1, rolagem / doc);
    const frac = c.lado < 0 ? 0.25 + 0.5 * p : 0.75 - 0.5 * p;
    const alvo = L.y0 + ay + (L.y1 - L.y0 - 2 * ay) * frac;
    c.cabecaY += (alvo - c.cabecaY) * 0.05;
    const sCab = t * 0.16 + c.fase;
    const perto =
      mouse.ativo && (c.lado < 0 ? mouse.x < faixa + 160 : mouse.x > W - faixa - 160);
    for (let i = 0; i < c.nos.length; i++) {
      const s = sCab - i * 0.05;
      let x = cx + ax * 0.82 * Math.sin(3 * s + c.fase);
      let y = c.cabecaY + ay * Math.sin(2 * s);
      if (perto) {
        const peso = Math.max(0, 1 - i / 8) * 0.18;
        y += (mouse.y - y) * peso;
        x += (Math.min(L.x1, Math.max(L.x0, mouse.x)) - x) * peso * 0.5;
      }
      const no = c.nos[i];
      // suaviza a transição quando o alvo muda (rolagem, cursor)
      no.x += (Math.min(L.x1, Math.max(L.x0, x)) - no.x) * 0.35;
      no.y += (Math.min(L.y1, Math.max(L.y0, y)) - no.y) * 0.35;
    }
  }

  function desenhar(c: Cobra, t: number) {
    const n = c.nos;
    const pulso = ((t * 0.45 + c.fase) % 1.6) / 1.6; // posição do sinal ao longo do corpo, 0..1
    g.lineCap = "round";
    // Sinapses: liga cada nó ao seguinte e, mais fraco, ao que vem dois depois.
    for (let i = 1; i < n.length; i++) {
      const a = n[i - 1], b = n[i];
      const f = Math.min(fade(c, a.x), fade(c, b.x));
      if (f <= 0.01) continue;
      g.strokeStyle = cores.fio;
      g.globalAlpha = cores.forca * f * (1 - (i / n.length) * 0.55);
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.stroke();
      if (i >= 2 && i % 2 === 0) {
        const z = n[i - 2];
        g.globalAlpha *= 0.4;
        g.beginPath();
        g.moveTo(z.x, z.y);
        g.lineTo(b.x, b.y);
        g.stroke();
      }
    }
    // Nós: maiores na cabeça, finos na cauda; o pulso acende os que passa.
    for (let i = n.length - 1; i >= 0; i--) {
      const p = n[i];
      const f = fade(c, p.x);
      if (f <= 0.01) continue;
      const u = i / (n.length - 1);
      const r = i === 0 ? 4.2 : 2.6 - 1.6 * u;
      const aceso = Math.max(0, 1 - Math.abs(u - pulso) * 7);
      g.globalAlpha = Math.min(1, (0.32 + 0.55 * aceso) * f * (cores.forca / 0.4));
      const s = r * 3.4 + aceso * 4;
      g.drawImage(brilho, p.x - s, p.y - s, s * 2, s * 2);
      g.fillStyle = cores.no;
      g.globalAlpha = Math.min(1, (0.55 + 0.4 * aceso) * f);
      g.beginPath();
      g.arc(p.x, p.y, r, 0, Math.PI * 2);
      g.fill();
    }
    // Cabeça: dois nós à frente formam a cabeça triangular.
    const h = n[0], nx = n[1];
    const dx = h.x - nx.x, dy = h.y - nx.y, d = Math.hypot(dx, dy) || 1;
    const fx = dx / d, fy = dy / d;
    const f = fade(c, h.x);
    if (f > 0.01) {
      const pontos = [
        { x: h.x + fx * 9 - fy * 5, y: h.y + fy * 9 + fx * 5 },
        { x: h.x + fx * 9 + fy * 5, y: h.y + fy * 9 - fx * 5 },
      ];
      g.strokeStyle = cores.fio;
      g.globalAlpha = cores.forca * f;
      g.beginPath();
      g.moveTo(pontos[0].x, pontos[0].y);
      g.lineTo(h.x, h.y);
      g.lineTo(pontos[1].x, pontos[1].y);
      g.lineTo(pontos[0].x, pontos[0].y);
      g.stroke();
      g.fillStyle = cores.no;
      g.globalAlpha = 0.8 * f;
      for (const q of pontos) {
        g.beginPath();
        g.arc(q.x, q.y, 1.8, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }

  function quadro(t: number) {
    g.clearRect(0, 0, W, H);
    if (faixa < FAIXA_MIN) return;
    for (const c of cobras) {
      mover(c, t);
      desenhar(c, t);
    }
  }

  // Assenta as cadeias antes do primeiro desenho (sem isso o corpo nasce reto).
  function assentar(t0: number) {
    for (let k = 0; k < 90; k++) for (const c of cobras) mover(c, t0 + k / QPS);
  }

  const aoMover = (e: PointerEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.ativo = true;
  };
  const aoSair = () => (mouse.ativo = false);
  const aoRolar = () => (rolagem = window.scrollY);
  const aoMudarTema = () => {
    cores = lerCores();
    brilho = spriteBrilho(cores.no, 9, dpr);
    if (reduz) quadroParado();
  };
  const aoRedimensionar = () => {
    medir();
    if (reduz) quadroParado();
  };

  const T_PARADO = 7.3;
  function quadroParado() {
    assentar(T_PARADO);
    g.clearRect(0, 0, W, H);
    if (faixa < FAIXA_MIN) return;
    for (const c of cobras) desenhar(c, T_PARADO);
  }

  medir();
  rolagem = window.scrollY;
  window.addEventListener("resize", aoRedimensionar);
  window.addEventListener("tema", aoMudarTema);

  if (reduz) {
    quadroParado();
    return () => {
      window.removeEventListener("resize", aoRedimensionar);
      window.removeEventListener("tema", aoMudarTema);
    };
  }

  window.addEventListener("pointermove", aoMover, { passive: true });
  document.addEventListener("pointerleave", aoSair);
  window.addEventListener("scroll", aoRolar, { passive: true });

  const inicio = performance.now();
  assentar(0);
  let ultimo = 0;
  let raf = requestAnimationFrame(function laco(agora) {
    raf = requestAnimationFrame(laco);
    if (document.hidden || agora - ultimo < 1000 / QPS) return;
    ultimo = agora;
    quadro(3 + (agora - inicio) / 1000);
  });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", aoRedimensionar);
    window.removeEventListener("tema", aoMudarTema);
    window.removeEventListener("pointermove", aoMover);
    document.removeEventListener("pointerleave", aoSair);
    window.removeEventListener("scroll", aoRolar);
  };
}
