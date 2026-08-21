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

  // Os dois materiais do site inteiro. As cobras de fundo compartilham estas
  // instâncias; o novelo da Hero usa clones delas, mudando só a opacidade.
  var MAT_CORPO = new THREE.MeshBasicMaterial({
    color: CORPO,
    wireframe: true,
    transparent: true,
    opacity: 0.1,
    depthWrite: false
  });

  var MAT_ESPINHA = new THREE.LineBasicMaterial({
    color: DESTAQUE,
    transparent: true,
    opacity: 0.12,
    depthWrite: false
  });

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
    var corpo = new THREE.Mesh(geo, MAT_CORPO);

    // Destaque pontual: só a espinha da curva, em laranja.
    var espinha = new THREE.BufferGeometry().setFromPoints(curva.getPoints(SEGMENTOS));
    var linha = new THREE.Line(espinha, MAT_ESPINHA);

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

  /* ------------------------------------------------------------------------
     Novelo da Hero

     Mesma cena, mesma câmera, mesmo renderizador, mesmo laço, mesmos materiais.
     Muda a pose: em vez de uma curva alongada na margem, as voltas empilhadas
     de uma cobra enrolada, com a cabeça saindo por cima e encarando a tela.

     Três coisas que a primeira versão errou, e por quê:

     1. Espiral no plano da tela é a vista DE CIMA de uma cobra enrolada, não a
        vista de frente. As voltas aqui são horizontais e empilham em Y; o grupo
        inteiro é inclinado 19° para o olho ver o monte por cima do ombro, que é
        o ângulo das fotos de referência.
     2. Tubo de raio 0.055 dá 9px de espessura na tela. Com 9px não cabe malha
        nenhuma: os anéis viram uma corrente de blocos. A treliça da cobra de
        fundo tem célula de ~38x68px. Aqui o tubo subiu para 0.2 (34px de
        espessura) e os anéis para 56, dando célula de ~20x21px: mesma trama,
        mesma leitura, num objeto três vezes menor.
     3. A ponta apontada direto para a câmera some por escorço. A cabeça virou
        um tubo próprio, mais gordo que o corpo, com língua bífida em laranja.

     O objeto é construído com raio externo 1 e escalado para caber em
     NOVELO_PX pixels. A posição sai da medida real do layout a cada quadro:
     o novelo rola junto com a Hero e nunca encosta no texto.
     ------------------------------------------------------------------------ */

  var NOVELO_PX = 170;      // largura desenhada
  var ENVELOPE_PX = 200;    // com a folga da cabeça e da inclinação
  // Raio da janela da máscara. 155 com o núcleo sólido até 80% (124px) cobre o
  // envelope e ainda para bem antes da faixa de telemetria, que começa 56px
  // abaixo do .hero__top.
  var JANELA_PX = 155;
  var VAZIO_MIN_L = 240;    // abaixo disso o vazio da Hero não comporta
  var VAZIO_MIN_A = 210;
  var VOLTAS = 3;
  var ANEIS = 56;           // ~20px por anel na tela
  var TUBO = 0.2;           // raio local; ~34px de espessura na tela
  var TUBO_CABECA = 0.24;    // a cabeça é mais gorda que o pescoço
  var EXTENSAO = 2 * (1 + TUBO);     // largura local total, para a escala
  var INCLINACAO = 19 * Math.PI / 180;
  // Limite do pescoço. Aberto o bastante para a cabeça alcançar o ponteiro em
  // qualquer canto da tela; serve só para ela não dar a volta no próprio corpo.
  var LIMITE = 55 * Math.PI / 180;
  // Profundidade do plano onde o ponteiro vive, em unidades de mundo. Com 2.2 o
  // ângulo é o ângulo real até o cursor: 300px de distância dão 37°, 600px dão
  // o limite. A cabeça aponta para o cursor, não para uma direção fixa.
  var PROFUNDIDADE = 2.2;
  var EIXO_X = new THREE.Vector3(1, 0, 0);

  // Clones dos materiais em produção: mesma cor, mesmo wireframe, mesmas
  // flags. Muda só a opacidade, porque aqui é destaque, não ambiente.
  var MAT_NOVELO = MAT_CORPO.clone();
  MAT_NOVELO.opacity = 0.45;
  var MAT_FILETE = MAT_ESPINHA.clone();
  MAT_FILETE.opacity = 0.6;

  // O único material novo do arquivo, e o único opaco: o preto do olho. Ele
  // existe justamente para ser opaco, porque o que faz o olho aparecer é ele
  // esconder a malha que passa por trás. É o --ink do site, sem terceira cor.
  var MAT_OLHO = new THREE.MeshBasicMaterial({ color: 0x131619 });

  // Aro do olho: o material do corpo, um pouco mais forte, para a borda fechar.
  var MAT_ARO = MAT_CORPO.clone();
  MAT_ARO.opacity = 0.75;

  function criarNovelo() {
    var pontos = [];
    var n = 90;
    var i, t;

    // Corpo: hélice de voltas horizontais que sobem e fecham para dentro.
    for (i = 0; i <= n; i++) {
      t = i / n;
      var ang = t * Math.PI * 2 * VOLTAS;
      var raio = 1 - 0.55 * t;
      pontos.push(new THREE.Vector3(
        Math.cos(ang) * raio,
        -0.58 + t * 1.16,
        Math.sin(ang) * raio
      ));
    }

    var curva = new THREE.CatmullRomCurve3(pontos);
    var geo = new THREE.TubeGeometry(curva, ANEIS, TUBO, 5, false);
    var espinha = new THREE.BufferGeometry().setFromPoints(curva.getPoints(ANEIS));

    var grupo = new THREE.Group();
    grupo.add(new THREE.Mesh(geo, MAT_NOVELO), new THREE.Line(espinha, MAT_FILETE));

    // Pescoço: sobe do alto do monte e deita para frente no fim. Fica no grupo
    // inclinado, junto com o corpo, porque ele é continuação do corpo.
    var fim = pontos[pontos.length - 1];
    var pp = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.03, 0.21, 0.01),
      new THREE.Vector3(0.07, 0.38, 0.08),
      new THREE.Vector3(0.10, 0.46, 0.24)
    ];
    var pescoco = new THREE.Group();
    pescoco.position.set(fim.x, fim.y, fim.z);
    var curvaPescoco = new THREE.CatmullRomCurve3(pp);
    pescoco.add(new THREE.Mesh(
      new THREE.TubeGeometry(curvaPescoco, 14, TUBO, 5, false), MAT_NOVELO));
    pescoco.add(new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curvaPescoco.getPoints(14)), MAT_FILETE));
    grupo.add(pescoco);

    // A cabeça tem grupo próprio, ancorado na ponta do pescoço, e nasce com a
    // inclinação do monte anulada: sem isso ela herda os 19° do pai e mostra o
    // topo do crânio em vez da cara. É este grupo que gira atrás do ponteiro.
    var base = pp[pp.length - 1];
    // Pose de três quartos, não de frente. Um tubo apontado direto para a
    // câmera não tem silhueta em wireframe: só sobra a seção, um aro vazio.
    // Aparecem o comprimento do focinho e a largura da mandíbula ao mesmo
    // tempo, que é como a cobra branca da referência olha para quem fotografa.
    // Apontada direto para a câmera, o escorço come o focinho inteiro e sobra
    // só a base do crânio; apontada para baixo, ela mergulha no próprio
    // pescoço, que era o defeito da versão anterior.
    var cabeca = new THREE.Group();
    cabeca.position.set(fim.x + base.x, fim.y + base.y, fim.z + base.z);
    cabeca.rotation.set(0, 0, 0);
    grupo.add(cabeca);

    // Cunha de 5 lados: larga na mandíbula, estreita no focinho. É um cone
    // truncado, não um tubo, porque TubeGeometry tem raio constante e cabeça de
    // cobra é justamente o contrário. Mesmo material, mesma contagem de lados
    // do resto da malha, então a treliça continua a mesma.
    var geoCabeca = new THREE.CylinderGeometry(0.09, TUBO_CABECA, 0.85, 5, 1, false);
    // Assa a rotação na geometria para o eixo virar +z. Assim a escala do mesh
    // achata a altura da cabeça, e não o comprimento dela.
    geoCabeca.rotateX(Math.PI / 2);
    var malhaCabeca = new THREE.Mesh(geoCabeca, MAT_NOVELO);
    malhaCabeca.scale.set(1, 0.72, 1);
    // Empurrada para frente ao longo do próprio focinho: centrada na origem,
    // metade dela ficava enfiada dentro do pescoço e as duas malhas viravam
    // uma coisa só.
    malhaCabeca.position.z = 0.3;
    cabeca.add(malhaCabeca);

    // Língua bífida saindo do focinho, e dois traços curtos nos olhos. No
    // tamanho de tela nenhum volume de olho seria lido; é o par de marcas
    // simétricas em laranja que faz a forma virar cara.
    var focinho = new THREE.Vector3(0, -0.02, 0.76);
    var haste = new THREE.Vector3(0, -0.12, 0.98);
    var lingua = new THREE.BufferGeometry().setFromPoints([
      focinho, haste,
      haste, new THREE.Vector3(-0.15, -0.22, 1.08),
      haste, new THREE.Vector3(0.15, -0.22, 1.08)
    ]);
    // Olhos pretos. Num objeto vazado, preto sobre preto só existe se tapar o
    // que está atrás: o disco é opaco, escreve profundidade e é desenhado na
    // passada opaca, então a treliça que passa por trás dele some. É o mesmo
    // truque de linha oculta, aplicado só nos dois olhos.
    // O aro fino em grafite, no material do corpo, é o que dá a borda.
    var OLHO_R = 0.062;
    var geoOlho = new THREE.CircleGeometry(OLHO_R, 12);
    geoOlho.scale(1, 0.9, 1);

    var aro = [];
    [-1, 1].forEach(function (lado) {
      var ex = lado * 0.145, ey = 0.03, ez = 0.34;

      var disco = new THREE.Mesh(geoOlho, MAT_OLHO);
      disco.position.set(ex, ey, ez);
      cabeca.add(disco);

      for (var k = 0; k < 12; k++) {
        var a1 = (k / 12) * Math.PI * 2;
        var a2 = ((k + 1) / 12) * Math.PI * 2;
        aro.push(
          new THREE.Vector3(ex + Math.cos(a1) * OLHO_R, ey + Math.sin(a1) * OLHO_R * 0.9, ez + 0.004),
          new THREE.Vector3(ex + Math.cos(a2) * OLHO_R, ey + Math.sin(a2) * OLHO_R * 0.9, ez + 0.004));
      }
    });

    // Narinas: dois riscos mínimos perto do focinho. Custam quatro vértices e
    // são o que dá escala ao resto do desenho.
    var narinas = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.05, 0.02, 0.66), new THREE.Vector3(-0.05, 0.05, 0.68),
      new THREE.Vector3(0.05, 0.02, 0.66), new THREE.Vector3(0.05, 0.05, 0.68)
    ]);

    cabeca.add(new THREE.LineSegments(lingua, MAT_FILETE));
    cabeca.add(new THREE.LineSegments(narinas, MAT_FILETE));
    cabeca.add(new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(aro), MAT_ARO));

    // O monte é visto um pouco de cima, como nas fotos: sem isto as voltas
    // horizontais projetam como riscos retos.
    grupo.rotation.x = INCLINACAO;
    grupo.visible = false;

    return {
      grupo: grupo,
      cabeca: cabeca,
      corpo: geo.attributes.position,
      baseCorpo: Float32Array.from(geo.attributes.position.array),
      espinha: espinha.attributes.position,
      baseEspinha: Float32Array.from(espinha.attributes.position.array),
      porAnel: 5 + 1
    };
  }

  var novelo = criarNovelo();
  cena.add(novelo.grupo);

  // Ângulos de repouso e alvo da cabeça, resolvidos por mirar().
  var alvoGiroX = 0, alvoGiroY = 0;
  var dirCabeca = new THREE.Vector3();
  var euler = new THREE.Euler(0, 0, 0, 'YXZ');

  // Aponta a cabeça para um deslocamento do ponteiro dado em unidades de mundo.
  // Resolve o Euler de fato em vez de somar ângulos soltos: com Euler XYZ,
  // R * (0,0,1) = (sin ry, -cos ry sin rx, cos ry cos rx), então ry sai do x e
  // rx sai do par (y, z). Antes disso desconta a inclinação do grupo pai, senão
  // a cabeça herda os 19° e fica torta.
  function mirar(dx, dy) {
    // O arfagem entra com o sinal trocado de propósito: Rx leva
    // y' = y cos - z sin, então com o focinho em z positivo é o ângulo
    // negativo que levanta a cabeça. Sem isso ela olha para baixo quando o
    // ponteiro está em cima.
    euler.set(
      Math.max(-LIMITE, Math.min(LIMITE, Math.atan2(-dy, PROFUNDIDADE))),
      Math.max(-LIMITE, Math.min(LIMITE, Math.atan2(dx, PROFUNDIDADE))),
      0);

    // Parte do focinho apontado para a frente, sem viés nenhum: com o ponteiro
    // em cima da cabeça ela encara a tela de frente, e daí em diante segue o
    // cursor. Qualquer pose de repouso torta faria a mira errar por esse tanto.
    dirCabeca.set(0, 0, 1).applyEuler(euler).applyAxisAngle(EIXO_X, -INCLINACAO);

    alvoGiroY = Math.asin(Math.max(-1, Math.min(1, dirCabeca.x)));
    alvoGiroX = Math.atan2(-dirCabeca.y, dirCabeca.z);
  }

  mirar(0, 0);

  // Mesma contorção das cobras de fundo: o mesmo par seno/cosseno ao longo do
  // comprimento, deslocando o anel inteiro. Só a amplitude é proporcional ao
  // tamanho deste corpo, que é bem menor.
  function contorcerNovelo(tempo) {
    var i, u, dx, dz;

    var pos = novelo.corpo.array;
    var base = novelo.baseCorpo;
    for (i = 0; i < base.length; i += 3) {
      u = Math.floor((i / 3) / novelo.porAnel) / ANEIS;
      dx = Math.sin(u * 6.2 + tempo * 0.85) * 0.03;
      dz = Math.cos(u * 4.4 + tempo * 0.62) * 0.024;
      pos[i] = base[i] + dx;
      pos[i + 2] = base[i + 2] + dz;
    }
    novelo.corpo.needsUpdate = true;

    var lp = novelo.espinha.array;
    var lb = novelo.baseEspinha;
    for (i = 0; i < lb.length; i += 3) {
      u = (i / 3) / ANEIS;
      dx = Math.sin(u * 6.2 + tempo * 0.85) * 0.03;
      dz = Math.cos(u * 4.4 + tempo * 0.62) * 0.024;
      lp[i] = lb[i] + dx;
      lp[i + 2] = lb[i + 2] + dz;
    }
    novelo.espinha.needsUpdate = true;
  }

  // Onde o vazio da Hero começa e termina em x. Sai da tinta real do texto,
  // não de um número fixo: qualquer mudança de fonte ou de largura entra aqui.
  var vazioX = 0;
  var vazioOk = false;

  function medirVazio() {
    vazioOk = false;

    var topo = document.querySelector('.hero__top');
    var lead = document.querySelector('.hero__lead');
    var ficha = document.querySelector('.spec');
    if (!topo || !lead || !ficha) return;

    var rt = topo.getBoundingClientRect();
    var rf = ficha.getBoundingClientRect();

    // Coluna única (a ficha desceu para baixo do texto): não existe vazio.
    if (rf.left < lead.getBoundingClientRect().right - 1) return;

    // Tinta mais à direita da coluna de texto. Os retângulos de linha de um
    // Range dão a extensão real dos glifos, não a largura do bloco.
    var passo = document.createTreeWalker(lead, NodeFilter.SHOW_TEXT);
    var direita = -Infinity;
    var no, faixa, caixas, j;

    while ((no = passo.nextNode())) {
      if (!no.textContent.trim()) continue;
      faixa = document.createRange();
      faixa.selectNodeContents(no);
      caixas = faixa.getClientRects();
      for (j = 0; j < caixas.length; j++) {
        if (caixas[j].width >= 1 && caixas[j].right > direita) direita = caixas[j].right;
      }
    }
    if (direita === -Infinity) return;

    var largura = rf.left - direita;
    if (largura < VAZIO_MIN_L || rt.height < VAZIO_MIN_A) return;

    vazioX = (direita + rf.left) / 2;
    vazioOk = true;
  }

  // Converte pixels da tela em unidades de mundo no plano z = 0.
  function unidadePorPixel() {
    var alturaMundo = 2 * Math.tan((45 * Math.PI) / 360) * camera.position.z;
    return alturaMundo / window.innerHeight;
  }

  // A janela da máscara. Reescrever mask-position a cada quadro recompõe a
  // camada inteira, então só toca no CSS quando o valor muda de pixel.
  var janelaY = null;
  var janelaR = null;

  function moverJanela(cy, raio) {
    var y = cy === null ? null : Math.round(cy);
    if (y === janelaY && raio === janelaR) return;
    janelaY = y;
    janelaR = raio;
    tela.style.setProperty('--janela-x', Math.round(vazioX) + 'px');
    tela.style.setProperty('--janela-y', (y === null ? 0 : y) + 'px');
    tela.style.setProperty('--janela-r', raio + 'px');
  }

  function esconderNovelo() {
    novelo.grupo.visible = false;
    moverJanela(null, 0);
    return false;
  }

  // Posiciona e dimensiona o novelo a partir do layout deste quadro.
  function ancorarNovelo() {
    if (!vazioOk) return esconderNovelo();

    var topo = document.querySelector('.hero__top');
    var rt = topo.getBoundingClientRect();

    // Fora da tela com folga do envelope: não desenha.
    if (rt.bottom < -ENVELOPE_PX || rt.top > window.innerHeight + ENVELOPE_PX) {
      return esconderNovelo();
    }

    var upx = unidadePorPixel();
    var cy = (rt.top + rt.bottom) / 2;

    novelo.grupo.position.x = (vazioX - window.innerWidth / 2) * upx;
    novelo.grupo.position.y = (window.innerHeight / 2 - cy) * upx;
    novelo.grupo.scale.setScalar((NOVELO_PX * upx) / EXTENSAO);
    novelo.grupo.visible = true;

    moverJanela(cy, JANELA_PX);
    return true;
  }

  function redimensionar() {
    var l = window.innerWidth;
    var a = window.innerHeight;
    var estreito = l < 640;

    camera.aspect = l / a;
    camera.updateProjectionMatrix();

    // Sempre do tamanho da tela, nunca da altura do documento.
    // Subiu para 0.8 por causa do serrilhado do novelo e voltou para 0.55
    // depois de medir: 0.8 derrubava o laço de 57.8 para 31.4 fps a 1440 e de
    // 59.6 para 41.3 a 1280. A malha do novelo é bem mais densa que a do fundo
    // e custa em preenchimento, não em vértices.
    renderizador.setPixelRatio(estreito ? 0.5 : 0.55);
    renderizador.setSize(l, a, false);

    // Empurra cada serpente para fora da borda: só a lateral interna dela
    // entra na tela, e nunca por trás da coluna de conteúdo.
    var meiaLargura = Math.tan((45 * Math.PI) / 360) * camera.position.z * camera.aspect;
    serpentes.forEach(function (s) {
      s.grupo.position.x = s.lado * meiaLargura * (estreito ? 1.16 : 1.1);
    });

    medirVazio();
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

    // O novelo não tem parallax: ele está preso ao layout da Hero e sobe com
    // ela. Se ele também deslizasse, sairia do vazio que mediu.
    if (ancorarNovelo()) {
      // Persegue o alvo devagar em vez de saltar: o giro fica suave mesmo com
      // o ponteiro atravessando a tela de uma vez.
      var k = Math.min(delta * 4, 1);
      novelo.cabeca.rotation.x += (alvoGiroX - novelo.cabeca.rotation.x) * k;
      novelo.cabeca.rotation.y += (alvoGiroY - novelo.cabeca.rotation.y) * k;
      contorcerNovelo(tempo);
    }

    renderizador.render(cena, camera);
  }

  // Rastreio do ponteiro. Mede a distância do cursor até a cabeça, não até o
  // centro do novelo: com o cursor em cima da cabeça o giro é zero e ela fica
  // na pose de repouso, que é o comportamento que se espera de algo que olha.
  function aoMoverPonteiro(e) {
    if (!novelo.grupo.visible) return;

    var upx = unidadePorPixel();

    // Posição da cabeça na tela, tirada da própria matriz do objeto.
    novelo.cabeca.getWorldPosition(dirCabeca);
    var cx = window.innerWidth / 2 + dirCabeca.x / upx;
    var cy = window.innerHeight / 2 - dirCabeca.y / upx;

    mirar((e.clientX - cx) * upx, (cy - e.clientY) * upx);
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
    ancorarNovelo();
    contorcerNovelo(0);
    renderizador.render(cena, camera);

    // Reposicionar não é animação: é o mesmo desenho parado seguindo o
    // elemento a que ele pertence. Sem isto o novelo ficaria preso à tela
    // enquanto a Hero rola e acabaria por cima do texto de outra seção.
    var agendado = false;
    window.addEventListener('scroll', function () {
      if (agendado) return;
      agendado = true;
      requestAnimationFrame(function () {
        agendado = false;
        ancorarNovelo();
        renderizador.render(cena, camera);
      });
    }, { passive: true });
  } else {
    tocar();
    window.addEventListener('pointermove', aoMoverPonteiro, { passive: true });
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
      if (semMovimento) {
        ancorarNovelo();
        renderizador.render(cena, camera);
      }
    }, 150);
  });
}
