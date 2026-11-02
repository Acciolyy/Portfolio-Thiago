// Fundo de ambientação: duas cobras de malha nas margens da tela (prancha
// HomeIA, "A · margens"). Pescoço em "S", cabeça triangular de víbora com
// cenho marcado, pupila em fenda e língua no acento, o único laranja. Facetas
// de 6 lados com luz rasante; de tempos em tempos uma dá um bote curto.
//
// Este módulo (e o three) só é baixado por import dinâmico, depois de a
// página carregar, e só quando há WebGL e movimento permitido (ver
// components/background/Fundo3D.tsx). 30 qps (24 no celular), pausa com a aba
// oculta. As cores vêm dos tokens (--fio, --fio-forca, --lingua, --ink) e são
// relidas quando o tema muda.
import * as THREE from "three";

type Def = { pts: [number, number, number][]; raio: number; cel: boolean; bote: number };

const DEFS: Def[] = [
  {
    pts: [[-1.36, -1.22, -0.5], [-1.05, -0.92, 0.1], [-0.85, -0.58, 0.3], [-1.05, -0.28, 0.0], [-1.0, 0.0, 0.3], [-0.86, 0.12, 0.55], [-0.92, 0.28, 0.7], [-0.8, 0.35, 0.8]],
    raio: 0.3,
    cel: true,
    bote: 0,
  },
  {
    pts: [[1.34, 1.22, -0.5], [1.04, 0.9, 0.1], [0.9, 0.56, 0.3], [1.07, 0.22, 0.0], [1.0, -0.06, 0.3], [0.87, -0.18, 0.55], [0.93, -0.34, 0.7], [0.81, -0.41, 0.8]],
    raio: 0.27,
    cel: false,
    bote: 4.5,
  },
];

type Cobra = {
  def: Def;
  aneis: number;
  lados: number;
  geo: THREE.BufferGeometry;
  pos: Float32Array;
  cor: Float32Array;
  olhos: THREE.Mesh[];
  detalhes: THREE.LineSegments;
  lingua: THREE.LineSegments;
  fase: number;
  // pontos de referência da cabeça, recalculados a cada quadro
  oP: THREE.Vector3; oN: THREE.Vector3; oB: THREE.Vector3; oT: THREE.Vector3; oR: number;
  fP: THREE.Vector3; fT: THREE.Vector3; fB: THREE.Vector3; fN: THREE.Vector3;
};

// cauda longa e fina, corpo cheio, pescoço fino, cabeça triangular de víbora
function raio(u: number, R: number) {
  let r: number;
  if (u < 0.6) r = 0.06 + 0.94 * Math.pow(Math.sin((Math.min(1, u / 0.6) * Math.PI) / 2), 1.3);
  else if (u < 0.84) r = 1 - (0.12 * (u - 0.6)) / 0.24;
  else if (u < 0.9) r = 0.88 - (0.3 * (u - 0.84)) / 0.06; // pescoço fino
  else if (u < 0.935) r = 0.58 + 0.74 * Math.pow((u - 0.9) / 0.035, 0.7); // mandíbula larga
  else r = 1.32 - 1.08 * Math.pow((u - 0.935) / 0.065, 0.9); // focinho em ponta
  return r * R;
}

export function iniciar(tela: HTMLCanvasElement): () => void {
  const cel = matchMedia("(max-width: 900px)").matches;

  // Sem WebGL, o construtor lança; quem chama mostra o fundo estático.
  const renderer = new THREE.WebGLRenderer({ canvas: tela, alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(cel ? 1 : Math.min(1.5, window.devicePixelRatio || 1));
  renderer.setClearAlpha(0);

  const cena = new THREE.Scene();
  const neblina = new THREE.Fog(0x131619, 8.5, 13.5);
  cena.fog = neblina;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.z = 10;

  const matFio = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.3, depthWrite: false, fog: true });
  const matAro = new THREE.LineBasicMaterial({ color: 0x8ea2b6, transparent: true, opacity: 0.6, fog: true });
  const matLingua = new THREE.LineBasicMaterial({ color: 0xff6b1a, transparent: true, opacity: 0.9, fog: true });
  const matOlho = new THREE.MeshBasicMaterial({ color: 0x131619 });
  const corFio = new THREE.Color(0x8ea2b6);
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let H = 1;
  let meiaH = 1;
  let meiaW = 1;

  const cobras: Cobra[] = DEFS.filter((d) => !cel || d.cel).map((def, idx) => {
    const aneis = cel ? 64 : 100;
    const lados = cel ? 5 : 6;
    const nV = (aneis + 1) * lados;
    const pos = new Float32Array(nV * 3);
    const cor = new Float32Array(nV * 3);
    const ind: number[] = [];
    for (let a = 0; a <= aneis; a++)
      for (let s = 0; s < lados; s++) {
        const k = a * lados + s;
        ind.push(k, a * lados + ((s + 1) % lados));
        if (a < aneis) ind.push(k, k + lados);
      }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(cor, 3));
    geo.setIndex(ind);
    cena.add(new THREE.LineSegments(geo, matFio));
    const olhos = [0, 1].map(() => {
      const m = new THREE.Mesh(new THREE.CircleGeometry(1, 14), matOlho);
      cena.add(m);
      return m;
    });
    // cenho (2 traços por lado) e aro dos olhos, no tom do fio
    const gd = new THREE.BufferGeometry();
    gd.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 2 * 4 + 3 * 2 * 2 * 8), 3));
    const detalhes = new THREE.LineSegments(gd, matAro);
    cena.add(detalhes);
    // acento: língua bífida e a fenda das pupilas
    const gl = new THREE.BufferGeometry();
    gl.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3 * 10), 3));
    const lingua = new THREE.LineSegments(gl, matLingua);
    cena.add(lingua);
    const v = () => new THREE.Vector3();
    return {
      def, aneis, lados, geo, pos, cor, olhos, detalhes, lingua, fase: idx * 2.3,
      oP: v(), oN: v(), oB: v(), oT: v(), oR: 0, fP: v(), fT: v(), fB: v(), fN: v(),
    };
  });

  function lerTema() {
    const cs = getComputedStyle(document.documentElement);
    corFio.set(cs.getPropertyValue("--fio").trim() || "#8EA2B6");
    matFio.opacity = parseFloat(cs.getPropertyValue("--fio-forca")) || 0.3;
    matAro.color.copy(corFio);
    matAro.opacity = Math.min(1, matFio.opacity * 2.2);
    matLingua.color.set(cs.getPropertyValue("--lingua").trim() || "#FF6B1A");
    const fundo = new THREE.Color(cs.getPropertyValue("--ink").trim() || "#131619");
    matOlho.color.copy(fundo);
    neblina.color.copy(fundo);
  }

  function medir() {
    const W = window.innerWidth;
    H = window.innerHeight;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    meiaH = Math.tan((20 * Math.PI) / 180) * camera.position.z;
    meiaW = meiaH * camera.aspect;
    renderer.setSize(W, H, false);
  }

  const luz = new THREE.Vector3(-0.5, 0.7, 0.5).normalize();
  const Zw = new THREE.Vector3(0, 0, 1);
  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const B = new THREE.Vector3();
  const N = new THREE.Vector3();
  const V = new THREE.Vector3();
  const nrm = new THREE.Vector3();

  const seg = (attr: THREE.BufferAttribute, i: number, p: THREE.Vector3, q: THREE.Vector3) => {
    attr.setXYZ(i, p.x, p.y, p.z);
    attr.setXYZ(i + 1, q.x, q.y, q.z);
    return i + 2;
  };

  function quadro(t: number) {
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    const sc = window.scrollY || 0;
    const rgb = [corFio.r, corFio.g, corFio.b];

    cobras.forEach((cb, ci) => {
      const d = cb.def;
      const Rw = d.raio * meiaH * 0.32;
      const dy = (sc / H) * 0.36 * (ci ? -1 : 1);
      const ctrl = d.pts.map((p) => new THREE.Vector3(p[0] * meiaW, (p[1] + dy) * meiaH, p[2]));
      const n = ctrl.length;
      const cab = ctrl[n - 1];
      const ant = ctrl[n - 2];
      // a cabeça encara o cursor, de leve, e a cada ~9 s dá um bote curto
      const olhar = new THREE.Vector3(mouse.sx * meiaW, mouse.sy * meiaH, cab.z).sub(cab).normalize();
      const frente = cab.clone().sub(ant).normalize();
      const fb = ((t + d.bote) % 9) / 0.7;
      const bote = fb < 1 ? Math.sin(fb * Math.PI) * (fb < 0.35 ? 1 : 0.8) : 0;
      cab.addScaledVector(olhar, Rw * 1.1).addScaledVector(frente, Rw * 1.6 * bote);
      ctrl[n - 2] = ant.clone().addScaledVector(olhar, Rw * 0.4).addScaledVector(frente, Rw * 0.6 * bote);
      const curva = new THREE.CatmullRomCurve3(ctrl, false, "centripetal");

      for (let a = 0; a <= cb.aneis; a++) {
        const u = a / cb.aneis;
        curva.getPointAt(u, P);
        curva.getTangentAt(u, T);
        B.crossVectors(T, Zw);
        if (B.lengthSq() < 1e-6) B.set(1, 0, 0);
        B.normalize();
        N.crossVectors(B, T).normalize();
        P.addScaledVector(B, Math.sin(u * 9 - t * 0.6 + cb.fase) * Rw * 0.32 * Math.min(1, u * 3) * (1 - Math.max(0, (u - 0.8) / 0.2)));
        const r = raio(u, Rw) * (1 + 0.04 * Math.sin(t * 0.8 + cb.fase) * (u > 0.2 && u < 0.84 ? 1 : 0));
        const achata = u > 0.9 ? 0.48 : 0.86;
        for (let s = 0; s < cb.lados; s++) {
          const ang = (s / cb.lados) * Math.PI * 2;
          const cs = Math.cos(ang);
          const sn = Math.sin(ang);
          nrm.copy(N).multiplyScalar(cs).addScaledVector(B, sn);
          V.copy(P).addScaledVector(N, cs * r * achata).addScaledVector(B, sn * r);
          const k = (a * cb.lados + s) * 3;
          let brilho = 0.22 + 0.95 * Math.pow(Math.max(0, nrm.dot(luz)), 1.2);
          if (s === 0) brilho = Math.min(1.25, brilho * 1.3); // crista do dorso
          cb.pos[k] = V.x;
          cb.pos[k + 1] = V.y;
          cb.pos[k + 2] = V.z;
          cb.cor[k] = rgb[0] * brilho;
          cb.cor[k + 1] = rgb[1] * brilho;
          cb.cor[k + 2] = rgb[2] * brilho;
        }
        if (Math.abs(u - 0.93) < 0.5 / cb.aneis) {
          cb.oP.copy(P);
          cb.oN.copy(N);
          cb.oB.copy(B);
          cb.oT.copy(T);
          cb.oR = r;
        }
        if (a === cb.aneis) {
          cb.fP.copy(P);
          cb.fT.copy(T);
          cb.fB.copy(B);
          cb.fN.copy(N);
        }
      }
      cb.geo.attributes.position.needsUpdate = true;
      cb.geo.attributes.color.needsUpdate = true;

      // olhos, cenho e pupilas em fenda
      const D = cb.detalhes.geometry.attributes.position as THREE.BufferAttribute;
      const L = cb.lingua.geometry.attributes.position as THREE.BufferAttribute;
      let di = 0;
      let li = 0;
      [-1, 1].forEach((lado, i) => {
        const c = cb.oP.clone().addScaledVector(cb.oB, lado * cb.oR * 0.74).addScaledVector(cb.oN, cb.oR * 0.3);
        const rr = cb.oR * 0.17;
        cb.olhos[i].position.copy(c);
        cb.olhos[i].scale.setScalar(rr);
        cb.olhos[i].lookAt(c.x, c.y, c.z + 1);
        for (let q = 0; q < 8; q++) {
          const a1 = (q / 8) * Math.PI * 2;
          const a2 = ((q + 1) / 8) * Math.PI * 2;
          di = seg(
            D,
            di,
            c.clone().addScaledVector(cb.oT, Math.cos(a1) * rr).addScaledVector(cb.oB, Math.sin(a1) * rr),
            c.clone().addScaledVector(cb.oT, Math.cos(a2) * rr).addScaledVector(cb.oB, Math.sin(a2) * rr),
          );
        }
        // cenho: placa supraocular inclinada sobre o olho
        const b0 = c.clone().addScaledVector(cb.oT, -rr * 1.6).addScaledVector(cb.oB, -lado * rr * 0.2).addScaledVector(cb.oN, rr * 0.9);
        const b1 = c.clone().addScaledVector(cb.oT, rr * 1.8).addScaledVector(cb.oB, -lado * rr * 1.3).addScaledVector(cb.oN, rr * 0.6);
        di = seg(D, di, b0, b1);
        di = seg(D, di, b1, c.clone().addScaledVector(cb.oT, rr * 2.6).addScaledVector(cb.oB, -lado * rr * 2.6));
        li = seg(L, li, c.clone().addScaledVector(cb.oT, -rr * 0.75), c.clone().addScaledVector(cb.oT, rr * 0.75));
      });
      D.needsUpdate = true;

      // língua: lambida dupla a cada ~4,5 s
      const ciclo = (t + cb.fase * 3) % 4.5;
      const fora = ciclo < 0.8 ? Math.abs(Math.sin((ciclo / 0.8) * Math.PI * 2)) : 0;
      const Lr = cb.oR * 2.3 * fora;
      const p0 = cb.fP;
      const p1 = p0.clone().addScaledVector(cb.fT, Lr * 0.7).addScaledVector(cb.fN, -Lr * 0.08);
      const e1 = p1.clone().addScaledVector(cb.fT, Lr * 0.35).addScaledVector(cb.fB, Lr * 0.2);
      const e2 = p1.clone().addScaledVector(cb.fT, Lr * 0.35).addScaledVector(cb.fB, -Lr * 0.2);
      if (fora > 0.02) {
        li = seg(L, li, p0, p1);
        li = seg(L, li, p1, e1);
        seg(L, li, p1, e2);
      } else {
        for (; li < 10; li++) L.setXYZ(li, 0, 0, -99);
      }
      L.needsUpdate = true;
    });

    renderer.render(cena, camera);
  }

  const aoMover = (e: PointerEvent) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener("pointermove", aoMover, { passive: true });
  window.addEventListener("resize", medir);
  window.addEventListener("tema", lerTema);

  lerTema();
  medir();

  const passo = 1000 / (cel ? 24 : 30);
  const t0 = performance.now();
  let ultimo = 0;
  let raf = requestAnimationFrame(function laco(agora) {
    raf = requestAnimationFrame(laco);
    if (document.hidden || agora - ultimo < passo) return;
    ultimo = agora;
    quadro((agora - t0) / 1000);
  });

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", aoMover);
    window.removeEventListener("resize", medir);
    window.removeEventListener("tema", lerTema);
    cena.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) o.geometry.dispose();
    });
    [matFio, matAro, matLingua, matOlho].forEach((m) => m.dispose());
    renderer.dispose();
  };
}
