// Camada de fundo: duas curvas em wireframe que se contorcem devagar nas
// laterais da tela. Não mede nada, não indica progresso, não recebe clique.
// É ambiente. Se qualquer coisa aqui falhar, o site continua igual.
//
// A URL é a mesma do <script type="module"> no <head>, então o navegador
// reaproveita o módulo já baixado e já validado pelo SRI: zero rede extra.
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js';

var tela = document.getElementById('fundo3d');
if (tela) iniciar(tela);

function iniciar(tela) {
  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderizador;
  try {
    renderizador = new THREE.WebGLRenderer({
      canvas: tela,
      alpha: true,
      antialias: true,
      powerPreference: 'low-power'
    });
  } catch (e) {
    // Sem WebGL: some com o canvas e pronto. Nada mais depende dele.
    tela.style.display = 'none';
    return;
  }

  renderizador.setClearAlpha(0);

  var cena = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 6;

  // Grafite um pouco mais claro que --line: em opacidade baixa ele compõe
  // exatamente na cor dos fios de 1px do site. --accent para o destaque.
  var CORPO = new THREE.Color(0x6E7681);
  var DESTAQUE = new THREE.Color(0xFF6B1A);

  var SEGMENTOS = 36;

  var serpentes = [criarSerpente(-1, 0.0), criarSerpente(1, 2.1)];
  serpentes.forEach(function (s) { cena.add(s.grupo); });

  function criarSerpente(lado, semente) {
    var pontos = [];
    for (var i = 0; i <= 7; i++) {
      var t = i / 7;
      pontos.push(new THREE.Vector3(
        Math.sin(t * Math.PI * 1.8 + semente) * 0.55,
        (t - 0.5) * 7.6,
        Math.cos(t * Math.PI * 1.4 + semente) * 0.55
      ));
    }

    var curva = new THREE.CatmullRomCurve3(pontos);

    // Baixo poli de propósito: seção pentagonal, 36 anéis. Malha rala é o
    // ponto: densa demais vira andaime e disputa atenção com o texto.
    var geo = new THREE.TubeGeometry(curva, SEGMENTOS, 0.3, 5, false);
    var corpo = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      color: CORPO,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
      depthWrite: false
    }));

    // Destaque pontual: só a espinha da curva, em laranja.
    var espinha = new THREE.BufferGeometry().setFromPoints(curva.getPoints(SEGMENTOS));
    var linha = new THREE.Line(espinha, new THREE.LineBasicMaterial({
      color: DESTAQUE,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    }));

    var grupo = new THREE.Group();
    grupo.add(corpo, linha);
    grupo.rotation.z = lado * 0.22;

    return {
      grupo: grupo,
      lado: lado,
      semente: semente,
      corpo: geo.attributes.position,
      baseCorpo: Float32Array.from(geo.attributes.position.array),
      espinha: espinha.attributes.position,
      baseEspinha: Float32Array.from(espinha.attributes.position.array),
      porAnel: 5 + 1 // radialSegments + 1: quantos vértices tem cada anel
    };
  }

  // Contorção: um seno ao longo do comprimento da curva, deslocando o anel
  // inteiro de uma vez, então o tubo continua coerente.
  function contorcer(s, tempo) {
    var i, u, dx, dz;

    var pos = s.corpo.array;
    var base = s.baseCorpo;
    for (i = 0; i < base.length; i += 3) {
      u = Math.floor((i / 3) / s.porAnel) / SEGMENTOS;
      dx = Math.sin(u * 6.2 + tempo * 0.85 + s.semente) * 0.42;
      dz = Math.cos(u * 4.4 + tempo * 0.62 + s.semente) * 0.34;
      pos[i] = base[i] + dx;
      pos[i + 2] = base[i + 2] + dz;
    }
    s.corpo.needsUpdate = true;

    var lp = s.espinha.array;
    var lb = s.baseEspinha;
    for (i = 0; i < lb.length; i += 3) {
      u = (i / 3) / SEGMENTOS;
      dx = Math.sin(u * 6.2 + tempo * 0.85 + s.semente) * 0.42;
      dz = Math.cos(u * 4.4 + tempo * 0.62 + s.semente) * 0.34;
      lp[i] = lb[i] + dx;
      lp[i + 2] = lb[i + 2] + dz;
    }
    s.espinha.needsUpdate = true;
  }

  function redimensionar() {
    var l = window.innerWidth;
    var a = window.innerHeight;
    var estreito = l < 640;

    camera.aspect = l / a;
    camera.updateProjectionMatrix();

    // Sempre do tamanho da tela, nunca da altura do documento.
    // Renderiza abaixo da resolução da tela de propósito: a camada está
    // desfocada e em 10% de opacidade, então o CSS esticar o buffer de volta
    // não muda nada visível e corta a maior parte do custo de preenchimento.
    renderizador.setPixelRatio(estreito ? 0.5 : 0.55);
    renderizador.setSize(l, a, false);

    // Empurra cada serpente para fora da borda: só a lateral interna dela
    // entra na tela, e nunca por trás da coluna de conteúdo.
    var meiaLargura = Math.tan((45 * Math.PI) / 360) * camera.position.z * camera.aspect;
    serpentes.forEach(function (s) {
      s.grupo.position.x = s.lado * meiaLargura * (estreito ? 1.16 : 1.1);
    });
  }

  var alvoY = 0;
  var atualY = 0;

  function lerParallax() {
    var rolagem = document.documentElement.scrollHeight - window.innerHeight;
    var progresso = rolagem > 0 ? window.scrollY / rolagem : 0;
    // Acompanhamento lento: 2.4 unidades no documento inteiro, contra as
    // ~5 unidades de altura visível. Bem mais devagar que o conteúdo.
    alvoY = progresso * 2.4;
  }

  redimensionar();
  lerParallax();
  atualY = alvoY;

  var tempo = 0;
  var ultimo = 0;
  var pedido = 0;
  var proximo = 0;

  // 30 quadros por segundo. A contorção é lenta o bastante para ninguém ver
  // a diferença, e é metade do trabalho de rasterização de um fundo inteiro.
  var PASSO = 1000 / 30;

  function quadro(agora) {
    pedido = requestAnimationFrame(quadro);
    if (agora < proximo) return;
    proximo = agora + PASSO;

    // Corta o salto de quem volta para a aba depois de minutos parada.
    var delta = Math.min((agora - ultimo) / 1000, 0.05);
    ultimo = agora;
    tempo += delta;

    lerParallax();
    atualY += (alvoY - atualY) * Math.min(delta * 2.2, 1);

    serpentes.forEach(function (s) {
      s.grupo.position.y = atualY;
      contorcer(s, tempo);
    });

    renderizador.render(cena, camera);
  }

  function tocar() {
    if (pedido || semMovimento) return;
    ultimo = performance.now();
    proximo = 0;
    pedido = requestAnimationFrame(quadro);
  }

  function parar() {
    if (!pedido) return;
    cancelAnimationFrame(pedido);
    pedido = 0;
  }

  if (semMovimento) {
    // Pose fixa, um quadro só. Fica no DOM, sem laço e sem parallax.
    serpentes.forEach(function (s) { contorcer(s, 0); });
    renderizador.render(cena, camera);
  } else {
    tocar();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) parar();
    else tocar();
  });

  var esperando;
  window.addEventListener('resize', function () {
    clearTimeout(esperando);
    esperando = setTimeout(function () {
      redimensionar();
      if (semMovimento) renderizador.render(cena, camera);
    }, 150);
  });
}
