// Fundo: "a cobra do Python feita de neurônios". Uma cobra por margem.
//
// Corpo: tubo em malha (anéis de seção transversal ligados por linhas
// longitudinais) em linhas finas no ciano de HUD; o lado de trás do tubo é
// mais apagado que o da frente. Na espinha, os nós laranja ("neurônios") e um
// pulso que corre da cabeça à cauda. Cabeça em cunha, mais larga que o
// pescoço, com dois olhos laranja; de tempos em tempos a língua bifurcada
// aparece por um instante.
//
// Movimento: a cabeça viaja de verdade pela margem, subindo e descendo, com
// uma ondulação lateral que fica gravada no rastro; o corpo é o próprio
// rastro da cabeça, amostrado por comprimento de arco, então segue o caminho
// exato dela e a onda em S viaja da cabeça à cauda. A velocidade acompanha a
// rolagem; parada, ela continua devagar. A cabeça se vira para o cursor
// quando ele passa perto.
//
// Projeção em Canvas 2D: cada anel é uma elipse perpendicular à espinha
// (eixo maior na normal, eixo menor na tangente, como um tubo visto de cima e
// levemente inclinado). Por que Canvas 2D e não Three.js: com essa projeção o
// volume fica legível com algumas centenas de segmentos de linha por quadro,
// e o módulo inteiro tem poucos KB, contra ~150 KB gzip do three.
//
// Regras: só nas margens, fora da coluna de conteúdo, com fade perto do
// container; nada sai da faixa nem passa da borda da tela; nada abaixo de
// 1400 px de largura; pausa com a aba oculta; devicePixelRatio até 2; com
// prefers-reduced-motion, um quadro parado.

const CONTAINER = 1280;
const GUTTER = 32;
const LARGURA_MIN = 1400;
const MEDIDOR = 64; // faixa reservada ao medidor de rolagem na borda direita
const QPS = 30;
const R = 9; // raio máximo do tubo (diâmetro ~18 px)
const PASSO_ANEL = 8; // px de espinha entre anéis
const LADOS = 8; // linhas longitudinais
const INCLINACAO = 0.42; // achatamento da elipse do anel (eixo menor / maior)

type P = { x: number; y: number };

type Cobra = {
  lado: -1 | 1;
  cab: P;
  ang: number;
  rastro: P[]; // posições passadas da cabeça, a mais recente primeiro
  dist: number; // distância percorrida (fase da ondulação)
  rumo: 1 | -1; // descendo (1) ou subindo (-1)
  lingua: number; // instante da próxima língua
  linguaFim: number;
  fase: number;
};

type Cores = { fio: string; no: string; ink: string; forca: number };

function lerCores(): Cores {
  const cs = getComputedStyle(document.documentElement);
  return {
    fio: cs.getPropertyValue("--fio").trim() || "#6F98A6",
    no: cs.getPropertyValue("--no").trim() || "#FF6B1A",
    ink: cs.getPropertyValue("--ink").trim() || "#0E1113",
    forca: parseFloat(cs.getPropertyValue("--fio-forca")) || 0.4,
  };
}

const suave = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const difAng = (a: number, b: number) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

// Perfil do raio ao longo do corpo (u = 0 na cabeça, 1 na cauda): pescoço
// fino logo atrás da cabeça, engrossa até ~1/3 e afina até quase um ponto.
function raio(u: number) {
  if (u < 0.08) return R * 0.55;
  if (u < 0.33) return R * (0.55 + 0.45 * suave(0.08, 0.33, u));
  return R * (0.04 + 0.96 * Math.pow(1 - (u - 0.33) / 0.67, 1.15));
}

export function iniciar(tela: HTMLCanvasElement): () => void {
  const ctx = tela.getContext("2d");
  if (!ctx) throw new Error("sem Canvas 2D");
  const g: CanvasRenderingContext2D = ctx;

  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, dpr = 1, faixa = 0, comprimento = 380;
  let cores = lerCores();
  const mouse = { x: -1, y: -1, ativo: false };
  let rolagemAnt = window.scrollY;
  let velRolagem = 0;

  const nova = (lado: -1 | 1, fase: number): Cobra => ({
    lado, cab: { x: 0, y: 0 }, ang: 0, rastro: [], dist: 0, rumo: lado < 0 ? 1 : -1,
    lingua: 3 + fase * 2, linguaFim: 0, fase,
  });
  const cobras = [nova(-1, 0), nova(1, 1.7)];

  // Faixa útil de cada margem, já descontado o raio da cabeça.
  const limites = (c: Cobra) => {
    const folga = R * 2.2;
    if (c.lado < 0) return { x0: folga, x1: faixa - folga, y0: 64 + folga, y1: H - folga };
    return { x0: W - faixa + folga, x1: W - MEDIDOR - folga, y0: 64 + folga, y1: H - folga };
  };

  // 1 longe do conteúdo, 0 encostando no container.
  const fade = (c: Cobra, x: number) => {
    const interno = c.lado < 0 ? faixa : W - faixa;
    const dist = c.lado < 0 ? interno - x : x - interno;
    return suave(0, 48, dist);
  };

  function posicionar(c: Cobra) {
    const L = limites(c);
    c.cab = { x: (L.x0 + L.x1) / 2, y: c.lado < 0 ? L.y0 + 40 : L.y1 - 40 };
    c.ang = c.rumo > 0 ? Math.PI / 2 : -Math.PI / 2;
    c.rastro = [{ ...c.cab }];
  }

  function medir() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    tela.width = Math.round(W * dpr);
    tela.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    faixa = Math.max(0, (W - CONTAINER) / 2 + GUTTER - 8);
    comprimento = Math.min(430, Math.max(300, H * 0.42));
    cobras.forEach(posicionar);
  }

  const ativo = () => W >= LARGURA_MIN && faixa - MEDIDOR > R * 6;

  // Um passo de simulação: a cabeça anda, vira e grava o rastro.
  function andar(c: Cobra, dt: number, t: number) {
    const L = limites(c);
    const vel = 42 + Math.min(360, velRolagem * 0.5);
    // rumo: sobe e desce a margem inteira
    if (c.cab.y > L.y1 - 60) c.rumo = -1;
    if (c.cab.y < L.y0 + 60) c.rumo = 1;
    let alvo = c.rumo > 0 ? Math.PI / 2 : -Math.PI / 2;
    // fica perto do meio da faixa
    const meio = (L.x0 + L.x1) / 2;
    alvo -= Math.max(-0.9, Math.min(0.9, ((meio - c.cab.x) / Math.max(20, L.x1 - L.x0)) * 1.6)) * c.rumo;
    // o cursor perto puxa a cabeça
    if (mouse.ativo && Math.hypot(mouse.x - c.cab.x, mouse.y - c.cab.y) < 220) {
      alvo = Math.atan2(mouse.y - c.cab.y, mouse.x - c.cab.x);
    }
    // ondulação lateral: o rumo oscila com a distância percorrida
    const onda = Math.sin(c.dist / 46 + c.fase) * 0.55;
    c.ang += Math.max(-2.4 * dt, Math.min(2.4 * dt, difAng(c.ang, alvo + onda)));
    const passo = vel * dt;
    c.cab.x = Math.min(L.x1, Math.max(L.x0, c.cab.x + Math.cos(c.ang) * passo));
    c.cab.y = Math.min(L.y1, Math.max(L.y0, c.cab.y + Math.sin(c.ang) * passo));
    c.dist += passo;
    const ult = c.rastro[0];
    if (!ult || Math.hypot(c.cab.x - ult.x, c.cab.y - ult.y) >= 2) c.rastro.unshift({ ...c.cab });
    // guarda só o rastro que cabe no corpo
    let soma = 0;
    for (let i = 1; i < c.rastro.length; i++) {
      soma += Math.hypot(c.rastro[i].x - c.rastro[i - 1].x, c.rastro[i].y - c.rastro[i - 1].y);
      if (soma > comprimento + 20) {
        c.rastro.length = i + 1;
        break;
      }
    }
    if (t > c.lingua) {
      c.linguaFim = t + 0.15;
      c.lingua = t + 6 + Math.random() * 4;
    }
  }

  // Amostra a espinha por comprimento de arco: pontos, tangentes e normais.
  function espinha(c: Cobra) {
    const pts: { p: P; t: P; n: P }[] = [];
    const r = c.rastro;
    let alvo = 0, acum = 0;
    for (let i = 1; i < r.length && alvo <= comprimento; i++) {
      const a = r[i - 1], b = r[i];
      const seg = Math.hypot(b.x - a.x, b.y - a.y);
      while (alvo <= acum + seg && alvo <= comprimento) {
        const k = seg ? (alvo - acum) / seg : 0;
        const tx = seg ? (a.x - b.x) / seg : 1, ty = seg ? (a.y - b.y) / seg : 0; // aponta para a cabeça
        pts.push({ p: { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }, t: { x: tx, y: ty }, n: { x: -ty, y: tx } });
        alvo += PASSO_ANEL;
      }
      acum += seg;
    }
    return pts;
  }

  function linha(a: P, b: P, alfa: number) {
    if (alfa <= 0.01) return;
    g.globalAlpha = Math.min(1, alfa);
    g.beginPath();
    g.moveTo(a.x, a.y);
    g.lineTo(b.x, b.y);
    g.stroke();
  }

  function desenhar(c: Cobra, t: number) {
    const sp = espinha(c);
    if (sp.length < 6) return;
    const n = sp.length;
    const base = cores.forca;
    g.strokeStyle = cores.fio;
    g.lineWidth = 1;
    g.lineCap = "round";
    const torcao = c.dist / 60;

    // Ponto na superfície do tubo, no ângulo φ em volta da espinha.
    // Profundidade sin(φ): > 0 frente, < 0 trás.
    const sup = (i: number, phi: number) => {
      const s = sp[i];
      const r = raio(i / (n - 1));
      const co = Math.cos(phi), si = Math.sin(phi);
      return {
        x: s.p.x + s.n.x * r * co + s.t.x * r * INCLINACAO * si,
        y: s.p.y + s.n.y * r * co + s.t.y * r * INCLINACAO * si,
        z: si,
      };
    };
    const alfaZ = (z: number, f: number) => base * f * (z > 0 ? 0.75 + 0.75 * z : 0.16 + 0.1 * (1 + z));

    // anéis (a região da cabeça é desenhada à parte)
    for (let i = 2; i < n; i++) {
      const f = fade(c, sp[i].p.x);
      if (f <= 0.01) continue;
      for (let k = 0; k < 12; k++) {
        const a = sup(i, (k / 12) * Math.PI * 2), b = sup(i, ((k + 1) / 12) * Math.PI * 2);
        linha(a, b, alfaZ((a.z + b.z) / 2, f) * 0.9);
      }
    }
    // linhas longitudinais
    for (let j = 0; j < LADOS; j++) {
      const phi = (j / LADOS) * Math.PI * 2 + torcao;
      for (let i = 2; i < n - 1; i++) {
        const f = Math.min(fade(c, sp[i].p.x), fade(c, sp[i + 1].p.x));
        if (f <= 0.01) continue;
        const a = sup(i, phi), b = sup(i + 1, phi);
        linha(a, b, alfaZ((a.z + b.z) / 2, f));
      }
    }

    // nós da espinha e o pulso
    const pulso = ((t * 0.5 + c.fase) % 1.8) / 1.8;
    g.fillStyle = cores.no;
    for (let i = 3; i < n; i += 2) {
      const u = i / (n - 1);
      const f = fade(c, sp[i].p.x);
      if (f <= 0.01) continue;
      const aceso = Math.max(0, 1 - Math.abs(u - pulso) * 8);
      const r = Math.max(0.8, 2.2 - 1.4 * u) + aceso * 1.2;
      g.globalAlpha = Math.min(1, (0.45 + 0.5 * aceso) * f);
      g.beginPath();
      g.arc(sp[i].p.x, sp[i].p.y, r, 0, Math.PI * 2);
      g.fill();
    }

    // cabeça em cunha, mais larga que o pescoço
    const s0 = sp[0], s2 = sp[2];
    const f = fade(c, s0.p.x);
    if (f > 0.01) {
      const fx = s0.t.x, fy = s0.t.y, nx = s0.n.x, ny = s0.n.y;
      const ponta = { x: s0.p.x + fx * 17, y: s0.p.y + fy * 17 };
      const larg = R * 1.4;
      const ombroE = { x: s0.p.x + nx * larg, y: s0.p.y + ny * larg };
      const ombroD = { x: s0.p.x - nx * larg, y: s0.p.y - ny * larg };
      const nucaE = sup(2, 0), nucaD = sup(2, Math.PI);
      const meioE = { x: (ombroE.x + ponta.x) / 2 + nx * 2, y: (ombroE.y + ponta.y) / 2 + ny * 2 };
      const meioD = { x: (ombroD.x + ponta.x) / 2 - nx * 2, y: (ombroD.y + ponta.y) / 2 - ny * 2 };
      const a1 = base * f * 1.5;
      // a cabeça é opaca: o corpo não aparece através dela
      g.fillStyle = cores.ink;
      g.globalAlpha = f;
      g.beginPath();
      g.moveTo(nucaE.x, nucaE.y);
      g.lineTo(ombroE.x, ombroE.y);
      g.lineTo(meioE.x, meioE.y);
      g.lineTo(ponta.x, ponta.y);
      g.lineTo(meioD.x, meioD.y);
      g.lineTo(ombroD.x, ombroD.y);
      g.lineTo(nucaD.x, nucaD.y);
      g.closePath();
      g.fill();
      // contorno
      linha(nucaE, ombroE, a1);
      linha(ombroE, meioE, a1);
      linha(meioE, ponta, a1);
      linha(nucaD, ombroD, a1);
      linha(ombroD, meioD, a1);
      linha(meioD, ponta, a1);
      // malha da cabeça: crista central e travessas
      linha({ x: s2.p.x, y: s2.p.y }, ponta, a1 * 0.8);
      linha(ombroE, ombroD, a1 * 0.7);
      linha(meioE, meioD, a1 * 0.7);
      const bico = { x: ponta.x - fx * 6, y: ponta.y - fy * 6 };
      linha(ombroE, bico, a1 * 0.45);
      linha(ombroD, bico, a1 * 0.45);
      // olhos
      g.fillStyle = cores.no;
      g.globalAlpha = Math.min(1, 0.95 * f);
      for (const lado of [1, -1]) {
        g.beginPath();
        g.arc(s0.p.x + fx * 4 + nx * lado * larg * 0.55, s0.p.y + fy * 4 + ny * lado * larg * 0.55, 1.7, 0, Math.PI * 2);
        g.fill();
      }
      // língua bifurcada, por ~150 ms
      if (!reduz && t < c.linguaFim) {
        g.strokeStyle = cores.no;
        const raiz = { x: ponta.x + fx * 7, y: ponta.y + fy * 7 };
        linha(ponta, raiz, 0.9 * f);
        linha(raiz, { x: raiz.x + fx * 5 + nx * 3, y: raiz.y + fy * 5 + ny * 3 }, 0.9 * f);
        linha(raiz, { x: raiz.x + fx * 5 - nx * 3, y: raiz.y + fy * 5 - ny * 3 }, 0.9 * f);
      }
    }
    g.globalAlpha = 1;
  }

  function quadro(t: number, dt: number) {
    g.clearRect(0, 0, W, H);
    if (!ativo()) return;
    for (const c of cobras) {
      andar(c, dt, t);
      desenhar(c, t);
    }
  }

  // Simula alguns segundos sem desenhar: o corpo nasce já estendido.
  function assentar(segundos: number) {
    const dt = 1 / QPS;
    for (let k = 0; k < segundos * QPS; k++) for (const c of cobras) andar(c, dt, k * dt);
  }

  function quadroParado() {
    medir();
    assentar(9);
    g.clearRect(0, 0, W, H);
    if (ativo()) for (const c of cobras) desenhar(c, 9);
  }

  const aoMover = (e: PointerEvent) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.ativo = true;
  };
  const aoSair = () => (mouse.ativo = false);
  const aoMudarTema = () => {
    cores = lerCores();
    if (reduz) quadroParado();
  };
  const aoRedimensionar = () => {
    if (reduz) quadroParado();
    else {
      medir();
      assentar(9);
    }
  };

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

  medir();
  assentar(9);
  const inicio = performance.now();
  let ultimo = 0;
  let raf = requestAnimationFrame(function laco(agora) {
    raf = requestAnimationFrame(laco);
    if (document.hidden) {
      ultimo = 0;
      return;
    }
    if (ultimo && agora - ultimo < 1000 / QPS) return;
    const dt = ultimo ? Math.min(0.1, (agora - ultimo) / 1000) : 1 / QPS;
    ultimo = agora;
    // velocidade de rolagem em px/s, suavizada
    const y = window.scrollY;
    velRolagem += (Math.abs(y - rolagemAnt) / dt - velRolagem) * 0.2;
    rolagemAnt = y;
    quadro(9 + (agora - inicio) / 1000, dt);
  });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", aoRedimensionar);
    window.removeEventListener("tema", aoMudarTema);
    window.removeEventListener("pointermove", aoMover);
    document.removeEventListener("pointerleave", aoSair);
  };
}
