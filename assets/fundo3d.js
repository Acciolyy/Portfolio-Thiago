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

  // Tinta mais à direita de um bloco. Os retângulos de linha de um Range dão a
  // extensão real dos glifos, não a largura do bloco, que seria a caixa inteira.
  function tintaMaisADireita(raiz) {
    var passo = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
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
    return direita;
  }

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

    var direita = tintaMaisADireita(lead);
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

  /* ------------------------------------------------------------------------
     Nuvem de tecnologias do Contato

     Mesma cena, mesma câmera, mesmo laço, mesma disciplina do novelo: a
     posição sai da medida real do layout, e abaixo de um limiar de espaço o
     objeto não desenha.

     O que muda é a proporção. O vazio da Hero é quase quadrado e pediu um
     objeto compacto; o vazio do Contato mede 799x344 a 1440 e 639x344 a 1280,
     então é uma faixa deitada.

     Os 15 ficam em três anéis horizontais, cinco por anel, e os anéis giram
     em torno do eixo vertical que passa pelo centro da nuvem. Cada ícone
     percorre o ciclo inteiro: passa pela frente, pelo centro e pelo fundo, e
     nenhum fica parado numa ponta.

     Girar em torno do eixo Z da cena, que era a primeira leitura do pedido,
     não cabe aqui: a faixa é 2.4 vezes mais larga que alta, e um giro no
     plano da tela levaria os ícones das pontas para fora do envelope medido,
     ou obrigaria a comprimir tanto o raio que as 15 silhuetas se
     encavalariam. Girar em torno do vertical mantém cada fileira na altura
     dela, então a altura nunca muda e nada sai da janela.

     Cada logo é só a silhueta em contorno, sem preenchimento e sem cor de
     marca: o site tem duas cores e nenhuma delas é o azul do React.
     ------------------------------------------------------------------------ */

  var NUVEM_MAX_L = 700;    // largura desenhada, teto
  var NUVEM_MAX_A = 296;    // altura desenhada, teto
  var NUVEM_FOLGA_E = 32;   // da tinta do texto
  var NUVEM_FOLGA_D = 16;   // da borda direita do conteúdo
  var NUVEM_FOLGA_V = 48;   // do topo da seção e do bloco de links
  // Abaixo disto os 15 ícones ficariam com menos de 30px cada. Medido: 1280 dá
  // vão de 639 e desenha, 1024 dá 415 e não desenha.
  var NUVEM_MIN_L = 560;
  var NUVEM_MIN_A = 260;
  var RAIO_HOVER = 46;      // proximidade em pixels de tela

  // Geometria do carrossel, em unidades locais (1 unidade = NUVEM_MAX_L / 2).
  // RAIO_Z é curto de propósito. A nuvem não está no centro da tela, então
  // profundidade não muda só o tamanho: ela afasta o desenho inteiro do centro
  // da viewport. Medido a 1440, com RAIO_Z 0.45 o ícone da frente ia parar a
  // 369px do centro da nuvem, fora da janela de 380. Com 0.22 ele para em
  // 318px, e a diferença de tamanho entre frente e fundo ainda é visível.
  var RAIO_ANEL = 0.70;
  var RAIO_Z = 0.22;
  var FILEIRAS = [0.24, 0.00, -0.24];

  // Uma volta a cada 50 segundos. Lento o bastante para o hover não escapar
  // do cursor no meio do gesto.
  var GIRO_BASE = 2 * Math.PI / 50;
  var GIRO_MAX = GIRO_BASE * 6;
  // Faixa larga de propósito. Cinco ícones por anel se cruzam na tela cinco
  // vezes por volta, e com 0.22 contra 0.55 os dois desenhos ficavam com peso
  // parecido e o cruzamento virava rabisco. Com 0.13 o de trás recua para
  // pouco acima do fundo (0.10) e a travessia lê como profundidade.
  var OPAC_FUNDO = 0.13;
  var OPAC_FRENTE = 0.58;

  // Um clone do LineBasicMaterial já em produção por ícone. São 15 porque a
  // opacidade agora acompanha a profundidade a cada quadro, e não três faixas
  // fixas. A cor é o mesmo grafite que o MAT_CORPO já usa: nenhuma cor nova
  // entra na paleta.
  function materialDeIcone() {
    var m = MAT_ESPINHA.clone();
    m.color.copy(CORPO);
    m.opacity = OPAC_FRENTE;
    return m;
  }

  // Destaque do hover: o mesmo clone, mantendo o laranja herdado.
  var MAT_NUVEM_ALVO = MAT_ESPINHA.clone();
  MAT_NUVEM_ALVO.opacity = 0.9;

  function quadrado(cx, cy, r) {
    return [[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r], [cx - r, cy - r]];
  }

  function aro(cx, cy, rx, ry, n, giro) {
    var p = [], i, a, x, y;
    var c = Math.cos(giro || 0), s = Math.sin(giro || 0);
    for (i = 0; i <= n; i++) {
      a = (i / n) * Math.PI * 2;
      x = Math.cos(a) * rx;
      y = Math.sin(a) * ry;
      p.push([cx + x * c - y * s, cy + x * s + y * c]);
    }
    return p;
  }

  function espelhar(t) {
    return t.map(function (p) { return [-p[0], -p[1]]; });
  }

  // Metade de cima do logo do Python; a de baixo é ela girada 180°. As duas
  // peças se encaixam sem se sobrepor: a de cima toma a faixa superior inteira
  // mais a meia faixa do meio à esquerda, e a de baixo faz o contrário.
  // Encostadas uma na outra elas fecham num retângulo só com um degrau dentro.
  // O vão entre as duas é 0.14, que a 88px de ícone dá 6px de tela: com 0.06,
  // medido, dava 2.6px e sumia.
  var PY = [[-0.60, 0.84], [-0.42, 1.00], [0.42, 1.00], [0.60, 0.84], [0.60, 0.42],
            [-0.08, 0.42], [-0.08, -0.12], [-0.24, -0.28], [-0.60, -0.28], [-0.60, 0.84]];
  var PY_OLHO = quadrado(-0.34, 0.72, 0.075);

  // Fita seguindo um seno: é a forma da onda do Tailwind. Traçar à mão dava
  // bicos, e dois bicos simétricos leem como pássaro, não como onda.
  function fita(dx, dy, larg, alt, esp) {
    var cima = [], baixo = [], i, u, x, y;
    for (i = 0; i <= 14; i++) {
      u = i / 14;
      x = -larg + u * 2 * larg;
      y = Math.sin(u * Math.PI * 2) * alt;
      cima.push([dx + x, dy + y + esp]);
      baixo.push([dx + x, dy + y - esp]);
    }
    baixo.reverse();
    return cima.concat(baixo, [cima[0]]);
  }

  // Cada logo é uma lista de traços; cada traço é uma polilinha em [x, y] na
  // caixa -1..1. Traço fechado repete o primeiro ponto no fim.
  var LOGOS = [
    { nome: 'Python', tracos: [PY, PY_OLHO, espelhar(PY), espelhar(PY_OLHO)] },

    { nome: 'Django', tracos: [
      [[-0.62, -0.95], [0.62, -0.95], [0.78, -0.79], [0.78, 0.79], [0.62, 0.95],
       [-0.62, 0.95], [-0.78, 0.79], [-0.78, -0.79], [-0.62, -0.95]],
      [[-0.10, 0.02], [-0.10, -0.32], [-0.34, -0.46], [-0.52, -0.32], [-0.52, 0.02],
       [-0.34, 0.16], [-0.10, 0.02]],
      [[-0.10, 0.55], [-0.10, -0.46]],
      [[0.34, 0.16], [0.34, -0.40], [0.20, -0.52], [0.06, -0.44]],
      [[0.34, 0.46], [0.34, 0.56]]
    ] },

    { nome: 'PostgreSQL', tracos: [
      // Cabeça de elefante. A tromba faz parte da silhueta e desce grossa,
      // afinando até a ponta: solta e fina, ela virava um fio pendurado, e o
      // resto lia como cabeça de pássaro.
      [[-0.52, 0.30], [-0.40, 0.66], [0.00, 0.86], [0.40, 0.62], [0.54, 0.20],
       [0.46, -0.20], [0.30, -0.36], [0.32, -0.66], [0.24, -0.88], [0.06, -0.94],
       [-0.04, -0.80], [0.06, -0.66], [0.06, -0.36], [-0.14, -0.30], [-0.34, -0.26],
       [-0.48, -0.06], [-0.52, 0.30]],
      // Orelha curta e encostada. Grande e aberta, ela lia como bico.
      [[-0.36, 0.50], [-0.66, 0.40], [-0.70, 0.02], [-0.46, -0.10], [-0.36, 0.16],
       [-0.36, 0.50]],
      // Presa: é ela que fecha a leitura de elefante.
      [[-0.10, -0.34], [-0.26, -0.52], [-0.24, -0.72]],
      quadrado(0.10, 0.46, 0.06)
    ] },

    { nome: 'HTMX', tracos: [
      [[-0.30, 0.62], [-0.86, 0.00], [-0.30, -0.62]],
      [[0.30, 0.62], [0.86, 0.00], [0.30, -0.62]],
      [[-0.14, -0.72], [0.14, 0.72]]
    ] },

    { nome: 'Alpine.js', tracos: [
      [[-0.92, -0.42], [-0.30, 0.52], [0.32, -0.42], [-0.92, -0.42]],
      [[0.06, -0.42], [0.44, 0.18], [0.82, -0.42], [0.06, -0.42]]
    ] },

    { nome: 'Tailwind CSS', tracos: [
      fita(-0.30, 0.28, 0.58, 0.20, 0.14),
      fita(0.30, -0.28, 0.58, 0.20, 0.14)
    ] },

    { nome: 'JavaScript', tracos: [
      [[-0.92, -0.92], [0.92, -0.92], [0.92, 0.92], [-0.92, 0.92], [-0.92, -0.92]],
      [[-0.12, 0.40], [-0.12, -0.30], [-0.32, -0.48], [-0.54, -0.34]],
      [[0.72, 0.28], [0.50, 0.42], [0.26, 0.30], [0.30, 0.06], [0.66, -0.10],
       [0.70, -0.34], [0.46, -0.48], [0.24, -0.34]]
    ] },

    { nome: 'React', tracos: [
      aro(0, 0, 0.18, 0.18, 10, 0),
      aro(0, 0, 0.95, 0.36, 24, 0),
      aro(0, 0, 0.95, 0.36, 24, Math.PI / 3),
      aro(0, 0, 0.95, 0.36, 24, -Math.PI / 3)
    ] },

    { nome: 'pytest', tracos: [
      [[-0.62, -0.92], [0.62, -0.92], [0.62, 0.72], [0.30, 0.72], [0.30, 0.92],
       [-0.30, 0.92], [-0.30, 0.72], [-0.62, 0.72], [-0.62, -0.92]],
      [[-0.36, -0.06], [-0.10, -0.36], [0.40, 0.36]],
      [[-0.36, -0.62], [0.36, -0.62]]
    ] },

    { nome: 'Playwright', tracos: [
      [[-0.70, 0.50], [0.70, 0.50], [0.62, -0.16], [0.30, -0.72], [0.00, -0.90],
       [-0.30, -0.72], [-0.62, -0.16], [-0.70, 0.50]],
      [[-0.46, 0.18], [-0.20, 0.30], [-0.46, 0.30], [-0.46, 0.18]],
      [[0.46, 0.18], [0.20, 0.30], [0.46, 0.30], [0.46, 0.18]],
      [[-0.24, -0.44], [0.24, -0.44]]
    ] },

    { nome: 'Docker', tracos: [
      [[-0.86, -0.10], [-0.72, -0.52], [0.30, -0.52], [0.62, -0.28], [0.92, -0.34],
       [0.86, -0.02], [0.46, 0.06], [-0.86, -0.10]],
      [[-0.62, -0.10], [-0.62, 0.24], [-0.30, 0.24], [-0.30, -0.10]],
      [[-0.22, -0.10], [-0.22, 0.24], [0.10, 0.24], [0.10, -0.10]],
      [[-0.22, 0.32], [-0.22, 0.62], [0.10, 0.62], [0.10, 0.32], [-0.22, 0.32]]
    ] },

    { nome: 'Git', tracos: [
      [[0, 0.98], [0.98, 0], [0, -0.98], [-0.98, 0], [0, 0.98]],
      [[-0.42, -0.42], [0.30, 0.30]],
      [[0.02, -0.14], [0.34, -0.46]],
      aro(-0.42, -0.42, 0.14, 0.14, 8, 0),
      aro(0.30, 0.30, 0.14, 0.14, 8, 0),
      aro(0.34, -0.46, 0.14, 0.14, 8, 0)
    ] },

    // Tirar os olhos não bastou: o que dava coruja era a silhueta em si. Duas
    // orelhas soltas flutuando sobre um corpo redondo de fundo reto é a forma
    // de uma coruja, com olhos ou sem. Agora é um contorno só, as orelhas
    // saem do crânio, o alto da cabeça abaula entre elas e o pé tem o entalhe
    // das duas pernas. O rabo é o gancho na esquerda.
    { nome: 'GitHub', tracos: [
      [[0.00, 0.86], [-0.16, 0.80], [-0.28, 0.70], [-0.42, 0.98], [-0.54, 0.66],
       [-0.74, 0.36], [-0.82, -0.02], [-0.70, -0.40], [-0.44, -0.60],
       [-0.44, -0.94], [-0.12, -0.94], [-0.12, -0.60], [0.12, -0.60],
       [0.12, -0.94], [0.44, -0.94], [0.44, -0.60], [0.70, -0.40],
       [0.82, -0.02], [0.74, 0.36], [0.54, 0.66], [0.42, 0.98], [0.28, 0.70],
       [0.16, 0.80], [0.00, 0.86]],
      [[-0.70, -0.40], [-0.88, -0.54], [-0.80, -0.78], [-0.60, -0.74]]
    ] },

    // API de LLM não é marca: chip com pinos e uma faísca. Sem logo de
    // provedor, e sem cérebro nem rede neural, que a regra do projeto proíbe.
    { nome: 'API de LLM', tracos: [
      [[-0.62, -0.62], [0.62, -0.62], [0.62, 0.62], [-0.62, 0.62], [-0.62, -0.62]],
      [[-0.30, 0.62], [-0.30, 0.92]], [[0.00, 0.62], [0.00, 0.92]], [[0.30, 0.62], [0.30, 0.92]],
      [[-0.30, -0.62], [-0.30, -0.92]], [[0.00, -0.62], [0.00, -0.92]], [[0.30, -0.62], [0.30, -0.92]],
      [[-0.62, -0.30], [-0.92, -0.30]], [[-0.62, 0.00], [-0.92, 0.00]], [[-0.62, 0.30], [-0.92, 0.30]],
      [[0.62, -0.30], [0.92, -0.30]], [[0.62, 0.00], [0.92, 0.00]], [[0.62, 0.30], [0.92, 0.30]],
      [[0.00, 0.42], [0.10, 0.10], [0.42, 0.00], [0.10, -0.10], [0.00, -0.42],
       [-0.10, -0.10], [-0.42, 0.00], [-0.10, 0.10], [0.00, 0.42]]
    ] },

    { nome: 'Streamlit', tracos: [
      [[-0.95, 0.22], [0.00, 0.62], [0.95, 0.22], [0.00, -0.10], [-0.95, 0.22]],
      [[-0.62, -0.20], [0.00, -0.02], [0.62, -0.20], [0.00, -0.46], [-0.62, -0.20]],
      [[-0.30, -0.56], [0.00, -0.48], [0.30, -0.56], [0.00, -0.86], [-0.30, -0.56]]
    ] }
  ];

  // Em que anel cada um entra, com que ângulo começa e com que tamanho em
  // pixels desenha. Cinco por anel, 72° entre vizinhos, e os três anéis
  // defasados de 18° para os ícones não se empilharem em coluna. Python é o
  // maior e começa na frente; os outros 14 ficam entre 58 e 64px, sem outra
  // hierarquia. Como todos dão a volta, a posição inicial é só o ponto de
  // partida: em 50 segundos cada um passou por todas as posições do anel.
  var LUGARES = [
    [1, 90, 88],   // Python
    [0, 0, 62],    // Django
    [0, 72, 64],   // PostgreSQL
    [0, 144, 58],  // HTMX
    [0, 216, 58],  // Alpine.js
    [0, 288, 62],  // Tailwind CSS
    [1, 162, 58],  // JavaScript
    [1, 234, 64],  // React
    [1, 306, 58],  // pytest
    [1, 18, 58],   // Playwright
    [2, 36, 64],   // Docker
    [2, 108, 58],  // Git
    [2, 180, 60],  // GitHub
    [2, 252, 58],  // API de LLM
    [2, 324, 58]   // Streamlit
  ];

  function geometriaDeTracos(tracos) {
    var v = [];
    tracos.forEach(function (t) {
      for (var i = 0; i < t.length - 1; i++) {
        v.push(new THREE.Vector3(t[i][0], t[i][1], 0));
        v.push(new THREE.Vector3(t[i + 1][0], t[i + 1][1], 0));
      }
    });
    return new THREE.BufferGeometry().setFromPoints(v);
  }

  function criarNuvem() {
    var grupo = new THREE.Group();
    var lista = [];

    LOGOS.forEach(function (logo, i) {
      var lugar = LUGARES[i];
      var mat = materialDeIcone();

      var malha = new THREE.LineSegments(geometriaDeTracos(logo.tracos), mat);
      // Metade do tamanho em unidades locais: a caixa local tem largura 2 e é
      // escalada para NUVEM_MAX_L pixels, então 1 unidade vale NUVEM_MAX_L / 2.
      malha.scale.setScalar((lugar[2] / 2) / (NUVEM_MAX_L / 2));

      var g = new THREE.Group();
      g.add(malha);
      grupo.add(g);

      lista.push({
        nome: logo.nome,
        grupo: g,
        malha: malha,
        mat: mat,
        fila: FILEIRAS[lugar[0]],
        ang: lugar[1] * Math.PI / 180,
        // Fase e período próprios: nada sincronizado.
        fase: i * 1.37,
        vel: 0.5 + (i % 5) * 0.09
      });
    });

    grupo.visible = false;
    return { grupo: grupo, itens: lista };
  }

  var nuvem = criarNuvem();
  cena.add(nuvem.grupo);

  // Ângulo do carrossel e o empurrão que o ponteiro deixa nele.
  var anguloNuvem = 0;
  var impulsoNuvem = 0;

  function limitar(v, teto) {
    return v > teto ? teto : (v < -teto ? -teto : v);
  }

  // Avança o carrossel um quadro. O impulso do ponteiro decai sozinho, então
  // a rotação sempre volta para a velocidade de base.
  function girarNuvem(delta) {
    impulsoNuvem *= Math.exp(-delta * 2.4);
    anguloNuvem += limitar(GIRO_BASE + impulsoNuvem, GIRO_MAX) * delta;
  }

  // Põe cada ícone no anel dele, no ângulo atual, e soma a flutuação local.
  // A flutuação continua sendo o mesmo par seno/cosseno da contorção da cobra:
  // 0.012 unidade local vale ~4px na tela, e 0.006 vale ~2px.
  function posicionarIcones(tempo) {
    nuvem.itens.forEach(function (it, i) {
      var f = it.ang + anguloNuvem;
      var z = Math.sin(f) * RAIO_Z;

      it.grupo.position.x = Math.cos(f) * RAIO_ANEL +
        Math.cos(tempo * it.vel * 0.7 + it.fase) * 0.006;
      it.grupo.position.y = it.fila + Math.sin(tempo * it.vel + it.fase) * 0.012;
      it.grupo.position.z = z;

      // Profundidade também na opacidade: só o tamanho não basta, porque
      // RAIO_Z é curto e a diferença de escala sozinha é sutil demais.
      if (i !== destacado) {
        it.mat.opacity = OPAC_FUNDO +
          (OPAC_FRENTE - OPAC_FUNDO) * (z / RAIO_Z + 1) / 2;
      }
    });
  }

  var nuvemOk = false;
  var nuvemCx = 0;     // centro em x, na viewport
  var nuvemDir = 0;    // borda direita do conteúdo, para virar o rótulo
  var nuvemL = 0;      // largura desenhada
  var nuvemA = 0;      // altura desenhada
  var nuvemDy = 0;     // centro vertical, contado do topo da seção

  var secContato = document.querySelector('#contato');
  var wrapContato = secContato && secContato.querySelector('.wrap');
  var tituloContato = secContato && secContato.querySelector('.contact h2');
  var textoContato = secContato && secContato.querySelector('.contact p');
  var linksContato = secContato && secContato.querySelector('.contact__links');

  function medirNuvem() {
    nuvemOk = false;
    if (!wrapContato || !tituloContato || !textoContato || !linksContato) return;

    var rw = wrapContato.getBoundingClientRect();
    var dir = rw.right - parseFloat(getComputedStyle(wrapContato).paddingRight);

    var tinta = Math.max(tintaMaisADireita(tituloContato), tintaMaisADireita(textoContato));
    if (tinta === -Infinity) return;

    var rs = secContato.getBoundingClientRect();
    var rl = linksContato.getBoundingClientRect();

    var largura = dir - tinta;
    var altura = rl.top - rs.top;
    if (largura < NUVEM_MIN_L || altura < NUVEM_MIN_A) return;

    var esq = tinta + NUVEM_FOLGA_E;
    var fim = dir - NUVEM_FOLGA_D;

    nuvemCx = (esq + fim) / 2;
    nuvemDir = dir;
    nuvemL = Math.min(fim - esq, NUVEM_MAX_L);
    nuvemA = Math.min(altura - NUVEM_FOLGA_V, NUVEM_MAX_A);
    nuvemDy = altura / 2;
    nuvemOk = true;
  }

  // Terceira camada da máscara: a janela elíptica que devolve este pedaço do
  // fundo. Mesmo cuidado da janela do novelo, só escrever quando muda de pixel.
  var nuvemJanelaY = null;
  var nuvemJanelaR = null;

  function moverJanelaNuvem(cy, rx, ry) {
    var y = cy === null ? null : Math.round(cy);
    if (y === nuvemJanelaY && rx === nuvemJanelaR) return;
    nuvemJanelaY = y;
    nuvemJanelaR = rx;
    tela.style.setProperty('--nuvem-x', Math.round(nuvemCx) + 'px');
    tela.style.setProperty('--nuvem-y', (y === null ? 0 : y) + 'px');
    tela.style.setProperty('--nuvem-rx', Math.round(rx) + 'px');
    tela.style.setProperty('--nuvem-ry', Math.round(ry) + 'px');
  }

  function esconderNuvem() {
    nuvem.grupo.visible = false;
    moverJanelaNuvem(null, 0, 0);
    destacar(-1);
    return false;
  }

  function ancorarNuvem() {
    if (!nuvemOk) return esconderNuvem();

    var rs = secContato.getBoundingClientRect();
    var cy = rs.top + nuvemDy;

    if (cy < -nuvemA || cy > window.innerHeight + nuvemA) return esconderNuvem();

    var upx = unidadePorPixel();
    nuvem.grupo.position.x = (nuvemCx - window.innerWidth / 2) * upx;
    nuvem.grupo.position.y = (window.innerHeight / 2 - cy) * upx;
    nuvem.grupo.scale.setScalar((nuvemL * upx) / 2);
    nuvem.grupo.visible = true;

    // A janela hospeda o desenho e nada mais: o ícone mais externo chega a
    // 319px do centro em x e 130px em y, e o núcleo sólido da elipse (88% do
    // raio) cobre os dois com folga. Frouxa demais ela devolveria fundo por
    // cima do bloco de links, que fica logo abaixo.
    moverJanelaNuvem(cy, nuvemL / 2 + 30, nuvemA / 2 + 22);
    return true;
  }

  // Rótulo do hover. Criado pelo JS para não mexer na marcação da seção de
  // Contato; o estilo mora no style.css, em --font-mono.
  var rotulo = document.createElement('span');
  rotulo.className = 'nuvem-rotulo';
  rotulo.setAttribute('aria-hidden', 'true');
  document.body.appendChild(rotulo);

  var destacado = -1;
  var vetTela = new THREE.Vector3();

  function posicionarRotulo(it) {
    it.grupo.getWorldPosition(vetTela);
    vetTela.project(camera);
    var sx = (vetTela.x * 0.5 + 0.5) * window.innerWidth;
    var sy = (-vetTela.y * 0.5 + 0.5) * window.innerHeight;

    var largura = rotulo.offsetWidth;
    var x = sx + 20;
    if (x + largura > nuvemDir) x = sx - 20 - largura;

    rotulo.style.left = Math.round(x) + 'px';
    rotulo.style.top = Math.round(sy - 11) + 'px';
  }

  function destacar(i) {
    if (i === destacado) return false;

    if (destacado >= 0) {
      var antigo = nuvem.itens[destacado];
      antigo.malha.material = antigo.mat;
      antigo.grupo.scale.setScalar(1);
    }

    destacado = i;

    if (i < 0) {
      rotulo.dataset.visivel = '0';
      return true;
    }

    var it = nuvem.itens[i];
    it.malha.material = MAT_NUVEM_ALVO;
    it.grupo.scale.setScalar(1.12);
    rotulo.textContent = it.nome;
    rotulo.dataset.visivel = '1';
    posicionarRotulo(it);
    return true;
  }

  var ultimoPonteiroX = null;
  var ponteiroX = null;
  var ponteiroY = 0;

  // Proximidade em pixels de tela, não Raycaster: projetar 15 pontos é bem mais
  // barato que atravessar a cena, e o pedido era destacar o ícone mais próximo
  // do ponteiro, não o que está exatamente sob ele.
  //
  // A posição vem de getWorldPosition, ou seja, de onde o ícone está DEPOIS da
  // rotação do carrossel e da flutuação, não da posição de partida no anel.
  function atualizarDestaque(px, py) {
    if (!nuvem.grupo.visible) return destacar(-1);

    var melhor = -1;
    var menor = RAIO_HOVER;
    var melhorZ = -Infinity;

    for (var i = 0; i < nuvem.itens.length; i++) {
      nuvem.itens[i].grupo.getWorldPosition(vetTela);
      var z = vetTela.z;
      vetTela.project(camera);
      var sx = (vetTela.x * 0.5 + 0.5) * window.innerWidth;
      var sy = (-vetTela.y * 0.5 + 0.5) * window.innerHeight;
      var d = Math.hypot(px - sx, py - sy);
      if (d >= menor + 12) continue;
      // Empate de menos de 12px acontece quando um passa na frente do outro.
      // Nesse caso vale o da frente, que é o que a pessoa está vendo.
      if (d < menor - 12 || z > melhorZ) { melhor = i; melhorZ = z; }
      if (d < menor) menor = d;
    }

    return destacar(melhor);
  }

  function aoMoverPonteiroNuvem(e) {
    ponteiroX = e.clientX;
    ponteiroY = e.clientY;
    if (!nuvem.grupo.visible) ultimoPonteiroX = null;
    return atualizarDestaque(ponteiroX, ponteiroY);
  }

  // Aceleração pelo gesto: a velocidade instantânea horizontal do cursor entra
  // como impulso na rotação do carrossel, com teto de seis vezes a velocidade
  // de base. O sinal é negativo porque aumentar o ângulo leva o ícone da
  // frente para a esquerda, e o esperado é o conjunto seguir a mão.
  function empurrarNuvem(e) {
    if (!nuvem.grupo.visible) { ultimoPonteiroX = null; return; }

    var perto = Math.abs(e.clientX - nuvemCx) < nuvemL / 2 + 80 &&
                Math.abs(e.clientY - (nuvemJanelaY || 0)) < nuvemA / 2 + 80;
    if (!perto) { ultimoPonteiroX = null; return; }

    if (ultimoPonteiroX !== null) {
      impulsoNuvem = limitar(impulsoNuvem - (e.clientX - ultimoPonteiroX) * 0.0011, GIRO_MAX);
    }
    ultimoPonteiroX = e.clientX;
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
    medirNuvem();
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

    // A nuvem também está presa ao layout, e pelo mesmo motivo não tem
    // parallax: ela desliza junto com a seção de Contato.
    if (ancorarNuvem()) {
      girarNuvem(delta);
      posicionarIcones(tempo);
      // O destaque é recalculado a cada quadro, não só no pointermove. Com o
      // carrossel girando, o ícone sai de baixo do cursor parado sozinho; sem
      // isto o rótulo continuava grudado no ícone que já tinha ido embora.
      if (ponteiroX !== null) atualizarDestaque(ponteiroX, ponteiroY);
      if (destacado >= 0) posicionarRotulo(nuvem.itens[destacado]);
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
    ancorarNuvem();
    // Ângulo zero, tempo zero: a nuvem fica na pose de partida e não gira.
    posicionarIcones(0);
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
        ancorarNuvem();
        if (destacado >= 0) posicionarRotulo(nuvem.itens[destacado]);
        renderizador.render(cena, camera);
      });
    }, { passive: true });

    // O destaque continua: ele é uma resposta a um gesto, não animação
    // contínua. Só redesenha quando o ícone em foco muda, então parado o
    // custo é zero. A rotação do carrossel, essa sim, não acontece: nada
    // chama girarNuvem() neste ramo, e o impulso do ponteiro também não entra.
    window.addEventListener('pointermove', function (e) {
      if (aoMoverPonteiroNuvem(e)) renderizador.render(cena, camera);
    }, { passive: true });
  } else {
    tocar();
    window.addEventListener('pointermove', function (e) {
      aoMoverPonteiro(e);
      empurrarNuvem(e);
      aoMoverPonteiroNuvem(e);
    }, { passive: true });
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
        ancorarNuvem();
        renderizador.render(cena, camera);
      }
    }, 150);
  });
}
