/* ==========================================================================
   Portfólio Thiago Viriato Accioly
   Progresso de scroll, marca de pneu na entrada de seção, contadores da faixa
   de telemetria e o carrossel do portfólio de IA. Vídeos e carrossel só rodam
   dentro da viewport e com a aba em foco.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     Telemetria: dado real da API pública do GitHub, sem token.

     Tudo parte de uma única listagem dos repositórios, ordenada por push:

       REPOS         -> quantos repositórios públicos a listagem devolve
       ULT. COMMIT   -> pushed_at mais recente entre os que não são fork
       COMMITS (30D) -> uma chamada por repositório com push na janela
       STACK         -> campo language do repositório com mais commits

     pushed_at chega alguns segundos depois do commit e vem de graça na
     listagem, então evita uma chamada por repositório só para ler a data.

     A contagem de commits usa per_page=1 e lê o número da última página no
     cabeçalho Link. Assim o repositório com 66 commits custa a mesma
     resposta minúscula do que tem 1, e não existe teto de 100.

     Sem token a API libera 60 requisições por hora por IP. Uma carga fria
     gasta 1 + o número de repositórios ativos no mês. Por isso o resultado
     fica em localStorage por 1 hora: sessionStorage morreria a cada aba nova
     e algumas aberturas já zerariam a cota do IP.

     Qualquer falha cai para o último valor guardado. Sem valor guardado, os
     números estáticos do HTML ficam onde estão: some a faixa inteira abriria
     um buraco na hero, que é pior do que um número velho por uma hora.
     ------------------------------------------------------------------------ */

  var DONO = 'Acciolyy';
  var CACHE = 'telemetria';
  var VALIDADE = 3600000;
  var GITHUB = 'https://api.github.com';
  var CABECALHO = { Accept: 'application/vnd.github+json' };

  function api(caminho) {
    return fetch(GITHUB + caminho, { headers: CABECALHO }).then(function (r) {
      if (!r.ok) throw new Error('github ' + r.status);
      return r.json();
    });
  }

  function idade(iso) {
    var horas = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (horas < 1) return 'agora';
    if (horas < 24) return horas + 'h';

    var dias = Math.floor(horas / 24);
    if (dias < 30) return dias + 'd';

    var meses = Math.floor(dias / 30);
    return 'há ' + meses + (meses > 1 ? ' meses' : ' mês');
  }

  /* Conta sem baixar a lista: pede 1 por página e lê o rel="last" do Link.
     Repositório vazio devolve 409, e aí a conta dele é zero. */
  function contarCommits(repo, desde) {
    var url = GITHUB + '/repos/' + DONO + '/' + repo.name +
              '/commits?per_page=1&since=' + desde;

    return fetch(url, { headers: CABECALHO }).then(function (r) {
      if (!r.ok) return 0;

      var link = r.headers.get('Link');
      var ultima = link && link.match(/[?&]page=(\d+)>;\s*rel="last"/);
      if (ultima) return Number(ultima[1]);

      return r.json().then(function (lista) { return lista.length; });
    }).catch(function () { return 0; });
  }

  function buscarNoGithub() {
    var desde = new Date(Date.now() - 30 * 86400000).toISOString().replace(/\.\d+/, '');

    return api('/users/' + DONO + '/repos?per_page=100&type=owner&sort=pushed')
      .then(function (todos) {
        // fork não é trabalho meu; repositório parado não gasta requisição
        var meus = todos.filter(function (r) { return !r.fork; });
        var ativos = meus.filter(function (r) { return r.pushed_at > desde; });

        var ultimo = meus.reduce(function (mais, r) {
          return r.pushed_at > mais ? r.pushed_at : mais;
        }, '');

        return Promise.all(ativos.map(function (r) {
          return contarCommits(r, desde);
        })).then(function (contagens) {
          var total = 0;
          var lider = null;
          var recorde = -1;

          contagens.forEach(function (n, i) {
            total += n;
            // o repo de perfil não tem linguagem, então não pode virar a stack
            if (n > recorde && ativos[i].language) {
              recorde = n;
              lider = ativos[i];
            }
          });

          return {
            ultimoCommit: { texto: ultimo ? idade(ultimo) : '--' },
            repos:        { valor: todos.length, decimais: 0, sufixo: '' },
            commits30d:   { valor: total, decimais: 0, sufixo: '' },
            stack:        { texto: lider ? lider.language : 'Python' }
          };
        });
      });
  }

  function lerCache() {
    try {
      var bruto = localStorage.getItem(CACHE);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) {
      return null;
    }
  }

  function gravarCache(dados) {
    try {
      localStorage.setItem(CACHE, JSON.stringify({ t: Date.now(), d: dados }));
    } catch (e) { /* aba anônima sem storage, segue o jogo */ }
  }

  function carregarTelemetria() {
    var guardado = lerCache();

    if (guardado && Date.now() - guardado.t < VALIDADE) {
      return Promise.resolve(guardado.d);
    }

    return buscarNoGithub().then(function (dados) {
      gravarCache(dados);
      return dados;
    }).catch(function () {
      return guardado ? guardado.d : null;
    });
  }

  /* ---------------------------------------------------------------------- */

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var temGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  if (temGsap) {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* --- 1) Linha de traçado: progresso de scroll ------------------------- */

  function progressoDeScroll() {
    var barra = document.querySelector('.progress');
    var trilha = document.getElementById('progress-fill');
    var cobra = document.getElementById('progress-cobra');
    if (!barra || !trilha || !cobra) return;

    var pescoco = cobra.querySelector('.cobra__pescoco');
    var cabeca = cobra.querySelector('.cobra__cabeca');

    // ALTURA é a altura em px do SVG, declarada no CSS. O viewBox usa o mesmo
    // número, então 1 unidade do path é 1 pixel e o eixo da cobra cai em
    // ALTURA / 2, que o CSS já ancorou no centro da barra.
    var ALTURA = 22;
    var EIXO = ALTURA / 2;
    var PESCOCO = 16;
    // Extremos do desenho da cabeça: 0 na nuca, 21.1 na ponta da língua.
    var PONTA = 21.1;
    var CENTRO = PONTA / 2;
    var largura = 0;

    function medir() {
      largura = barra.clientWidth;
      cobra.setAttribute('viewBox', '0 0 ' + largura + ' ' + ALTURA);
    }

    // dir = 1 descendo (cabeça olha para a direita), -1 subindo.
    function desenhar(t, p, dir) {
      if (!largura) medir();

      var x = Math.min(Math.max(p * largura, 2), largura - 4);

      // Subindo, o desenho inteiro espelha em torno do próprio centro: a ponta
      // passa a ficar na fronteira, olhando para trás, e o pescoço vai parar
      // do outro lado. Só troca de sinal, a forma é a mesma.
      var giro = dir < 0
        ? ' translate(' + CENTRO + ' 0) scale(-1 1) translate(' + (-CENTRO) + ' 0)'
        : '';
      cabeca.setAttribute('transform',
        'translate(' + x.toFixed(2) + ' ' + EIXO + ')' + giro);

      // Uma cúbica só. Os dois pontos de controle sobem e descem com o mesmo
      // seno; nenhum ponto intermediário, para não tremer.
      var fase = Math.sin(t * 3);
      // Deslocamento em x do começo do pescoço, medido a partir da nuca.
      function px(u) { return dir < 0 ? x + PONTA + u : x - u; }

      pescoco.setAttribute('d',
        'M' + px(PESCOCO).toFixed(2) + ' ' + (EIXO + fase * 2.4).toFixed(2) +
        'C' + px(PESCOCO - 6).toFixed(2) + ' ' + (EIXO + fase * 2.6).toFixed(2) +
        ' ' + px(7).toFixed(2) + ' ' + (EIXO - fase * 1.8).toFixed(2) +
        ' ' + px(0).toFixed(2) + ' ' + EIXO);
    }

    var progressoAtual = 0;
    var direcaoAtual = 1;

    function posicionar(p) {
      progressoAtual = p;
      trilha.style.width = (p * 100).toFixed(2) + '%';
    }

    window.addEventListener('resize', function () {
      medir();
      desenhar(0, progressoAtual, direcaoAtual);
    });

    if (semMovimento || !temGsap) {
      // Sem GSAP a barra ainda mede o scroll: ela some por completo se ficar
      // dependurada no ScrollTrigger. O que não acontece aqui é a ondulação,
      // com a fase travada em zero.
      var agendado = false;
      var ultimoY = window.scrollY;

      var aoRolar = function () {
        if (agendado) return;
        agendado = true;
        requestAnimationFrame(function () {
          agendado = false;
          if (window.scrollY !== ultimoY) {
            direcaoAtual = window.scrollY > ultimoY ? 1 : -1;
            ultimoY = window.scrollY;
          }
          var total = document.documentElement.scrollHeight - window.innerHeight;
          posicionar(total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0);
          desenhar(0, progressoAtual, direcaoAtual);
        });
      };

      window.addEventListener('scroll', aoRolar, { passive: true });
      medir();
      aoRolar();
      return;
    }

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        if (self.direction) direcaoAtual = self.direction;
        posicionar(self.progress);
      }
    });

    medir();
    desenhar(0, 0, 1);

    // Pega carona no ticker que o GSAP e o Lenis já rodam: nenhum laço novo.
    gsap.ticker.add(function (tempo) {
      if (!document.hidden) desenhar(tempo, progressoAtual, direcaoAtual);
    });
  }

  /* --- 2) Marca de pneu na transição de seção --------------------------- */

  function marcaDePneu() {
    document.querySelectorAll('.sec-label').forEach(function (rotulo) {
      var marca = rotulo.querySelector('.tire');
      if (!marca) return;

      ScrollTrigger.create({
        trigger: rotulo,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          gsap.timeline()
            .fromTo(marca,
              { width: 0, opacity: 0 },
              { width: rotulo.offsetWidth + 24, opacity: 1, duration: 0.18, ease: 'power2.out' })
            .to(marca, { opacity: 0, duration: 0.32, ease: 'power1.in' });
        }
      });
    });
  }

  /* --- 3) Contadores da faixa de telemetria ----------------------------- */

  function formatar(valor, decimais, sufixo) {
    return valor.toFixed(decimais) + sufixo;
  }

  function aplicarTelemetria(dados, animar) {
    var faixa = document.getElementById('telemetry');
    if (!faixa) return;

    // Sem dado nenhum: o HTML estático continua valendo. Para esconder a faixa
    // nesse caso, troque esta linha por: faixa.hidden = true;
    if (!dados) return;

    Object.keys(dados).forEach(function (chave) {
      var alvo = faixa.querySelector('[data-tel="' + chave + '"]');
      var item = dados[chave];
      if (!alvo) return;

      if (typeof item.texto === 'string') {
        alvo.textContent = item.texto;
        return;
      }

      if (!animar) {
        alvo.textContent = formatar(item.valor, item.decimais, item.sufixo);
        return;
      }

      var contador = { n: 0 };
      alvo.textContent = formatar(0, item.decimais, item.sufixo);

      gsap.to(contador, {
        n: item.valor,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: function () {
          alvo.textContent = formatar(contador.n, item.decimais, item.sufixo);
        }
      });
    });
  }

  function contadores() {
    var faixa = document.getElementById('telemetry');
    if (!faixa) return;

    ScrollTrigger.create({
      trigger: faixa,
      start: 'top 88%',
      once: true,
      onEnter: function () {
        carregarTelemetria().then(function (dados) {
          aplicarTelemetria(dados, true);
        });
      }
    });
  }

  /* --- Vídeos: só carregam quando entram na viewport -------------------- */

  var videos = Array.prototype.slice.call(document.querySelectorAll('video[preload="none"]'));

  function tocarVideo(video) {
    // Sem movimento: nada toca sozinho, quem decide é o controle nativo.
    if (semMovimento || !video.visivel || document.hidden) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado, tudo bem */ });
  }

  function carregarVideo(video) {
    if (video.preload === 'none') {
      video.preload = 'metadata';
      video.load();
    }
  }

  function observarVideos() {
    if (!videos.length || !('IntersectionObserver' in window)) return;

    if (semMovimento) {
      // Carrega o primeiro quadro e entrega os controles: o play é do usuário.
      videos.forEach(function (video) {
        video.controls = true;
        video.removeAttribute('loop');
      });

      var observadorParado = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          if (e.isIntersecting) carregarVideo(e.target);
        });
      }, { rootMargin: '200px 0px' });

      videos.forEach(function (video) { observadorParado.observe(video); });
      return;
    }

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var video = e.target;
        video.visivel = e.isIntersecting;

        if (e.isIntersecting) {
          carregarVideo(video);
          tocarVideo(video);
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '200px 0px' });

    videos.forEach(function (video) { observador.observe(video); });
  }

  /* --- Carrossel do portfólio de IA ------------------------------------- */

  var carro = document.getElementById('carro-ia');
  var carroTimer = null;
  var carroVisivel = false;
  var carroParado = false;
  var carroIr = null;

  function pararCarro() {
    if (carroTimer) { carroTimer = clearInterval(carroTimer); }
  }

  function tocarCarro() {
    pararCarro();
    if (!carroIr || semMovimento || carroParado || !carroVisivel || document.hidden) return;
    carroTimer = setInterval(function () { carroIr(1, true); }, 4500);
  }

  function montarCarrossel() {
    if (!carro) return;

    var slides = carro.querySelectorAll('.carro__slide');
    var pontos = carro.querySelectorAll('.carro__ponto');
    var legenda = document.getElementById('carro-legenda');
    var atual = 0;

    // Só a navegação manual anuncia. No avanço automático a legenda muda calada.
    function escreverLegenda(texto, manual) {
      if (!legenda) return;

      if (!manual) {
        legenda.removeAttribute('aria-live');
        legenda.textContent = texto;
        return;
      }

      legenda.setAttribute('aria-live', 'polite');
      requestAnimationFrame(function () { legenda.textContent = texto; });
    }

    carroIr = function (n, relativo, manual) {
      atual = ((relativo ? atual + n : n) + slides.length) % slides.length;

      slides.forEach(function (slide, i) {
        if (i === atual) slide.setAttribute('data-ativo', '');
        else slide.removeAttribute('data-ativo');
        pontos[i].setAttribute('aria-current', i === atual ? 'true' : 'false');
      });

      var img = slides[atual].querySelector('img');
      img.loading = 'eager';
      escreverLegenda(img.getAttribute('data-legenda'), manual);
    };

    carro.addEventListener('click', function (e) {
      var botao = e.target.closest('button');
      if (!botao) return;

      if (botao.dataset.passo) carroIr(Number(botao.dataset.passo), true, true);
      else carroIr(Number(botao.dataset.ponto), false, true);
      tocarCarro();
    });

    carro.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      carroIr(e.key === 'ArrowLeft' ? -1 : 1, true, true);
      tocarCarro();
    });

    carro.addEventListener('mouseenter', function () { carroParado = true; pararCarro(); });
    carro.addEventListener('mouseleave', function () {
      if (carro.contains(document.activeElement)) return;
      carroParado = false;
      tocarCarro();
    });

    // Teclado navegando dentro do carrossel: o avanço automático sai da frente.
    carro.addEventListener('focusin', function () { carroParado = true; pararCarro(); });
    carro.addEventListener('focusout', function (e) {
      if (carro.contains(e.relatedTarget)) return;
      carroParado = false;
      tocarCarro();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entradas) {
        carroVisivel = entradas[0].isIntersecting;
        tocarCarro();
      }, { rootMargin: '100px 0px' }).observe(carro);
    } else {
      carroVisivel = true;
      tocarCarro();
    }
  }

  /* --- Terminal simulado da seção Sobre ---------------------------------
     Não é Python rodando: o transcrito inteiro já está no HTML, e aqui só
     escondemos e revelamos o que está lá. O trecho por vir fica com
     visibility: hidden, que preserva a caixa, então a quebra de linha não
     muda enquanto "digita" e o bloco não empurra a página.
     --------------------------------------------------------------------- */

  var termTimer = null;
  var termPendente = null;

  function retomarTerminal() {
    if (!termPendente || termTimer) return;
    var seguir = termPendente;
    termPendente = null;
    seguir();
  }

  function montarTerminal() {
    var caixa = document.getElementById('term-python');
    // Sem movimento: o transcrito completo do HTML fica como está.
    if (!caixa || semMovimento) return;

    var codigo = caixa.querySelector('.term__corpo code');
    if (!codigo || !('IntersectionObserver' in window)) return;

    var cursor = document.createElement('span');
    cursor.className = 'term__cursor term__cursor--piscando';

    var nos = [];
    (function coletar(no) {
      for (var i = 0; i < no.childNodes.length; i++) {
        var filho = no.childNodes[i];
        if (filho.nodeType === 3) { if (filho.nodeValue) nos.push(filho); }
        else coletar(filho);
      }
    }(codigo));

    var passos = nos.map(function (no) {
      var pai = no.parentNode;
      var classe = pai.className || '';
      var feito = document.createElement('span');
      var espera = document.createElement('span');

      espera.className = 'term__espera';
      espera.textContent = no.nodeValue;
      pai.replaceChild(espera, no);
      pai.insertBefore(feito, espera);

      return {
        feito: feito,
        espera: espera,
        // Num REPL de verdade quem digita é a pessoa; a saída aparece inteira.
        digitar: classe.indexOf('term__cmd') !== -1,
        espera_ms: classe.indexOf('term__ps') !== -1 ? 90
                 : /^\s*$/.test(no.nodeValue) ? 130
                 : 240
      };
    });

    var atual = 0;

    function agendar(passo, ms) {
      termPendente = passo;
      termTimer = setTimeout(function () {
        termTimer = null;
        // Aba escondida: o passo fica guardado e o visibilitychange retoma.
        if (document.hidden) return;
        termPendente = null;
        passo();
      }, ms);
    }

    function digitar(p) {
      if (!p.espera.textContent) { atual++; seguinte(); return; }

      agendar(function () {
        p.feito.textContent += p.espera.textContent.charAt(0);
        p.espera.textContent = p.espera.textContent.slice(1);
        digitar(p);
      }, 26 + Math.random() * 34);
    }

    function seguinte() {
      if (atual >= passos.length) {
        cursor.classList.remove('term__cursor--piscando');
        return;
      }

      var p = passos[atual];
      p.espera.parentNode.insertBefore(cursor, p.espera);

      if (p.digitar) { digitar(p); return; }

      agendar(function () {
        p.feito.textContent += p.espera.textContent;
        p.espera.textContent = '';
        atual++;
        seguinte();
      }, p.espera_ms);
    }

    new IntersectionObserver(function (entradas, observador) {
      if (!entradas[0].isIntersecting) return;
      observador.disconnect();
      seguinte();
    }, { rootMargin: '0px 0px -15% 0px' }).observe(caixa);
  }

  /* --- Brilho de borda seguindo o cursor --------------------------------
     O desenho é todo do CSS; aqui só entram as coordenadas do mouse. Um
     listener na grade inteira, com o trabalho jogado para o próximo quadro.
     --------------------------------------------------------------------- */

  function brilhoNaBorda() {
    var grade = document.querySelector('.grid-projects');
    // Sem movimento: o CSS acende a borda inteira, parada, sem rastrear nada.
    if (!grade || semMovimento) return;

    var agendado = false;
    var ultimo = null;

    grade.addEventListener('mousemove', function (e) {
      ultimo = e;
      if (agendado) return;
      agendado = true;

      requestAnimationFrame(function () {
        agendado = false;
        var card = ultimo.target.closest && ultimo.target.closest('.card');
        if (!card) return;

        var caixa = card.getBoundingClientRect();
        card.style.setProperty('--mx', (ultimo.clientX - caixa.left).toFixed(1) + 'px');
        card.style.setProperty('--my', (ultimo.clientY - caixa.top).toFixed(1) + 'px');
      });
    });
  }

  /* --- Mostradores radiais ----------------------------------------------
     O HTML já traz o valor final, no número e no dashoffset do arco. Aqui
     só voltamos para o zero e animamos até lá quando entra na viewport.
     --------------------------------------------------------------------- */

  var ARCO = 207.345;

  function montarGauges() {
    var gauges = Array.prototype.slice.call(document.querySelectorAll('.gauge'));
    if (!gauges.length) return;

    // Sem movimento ou sem GSAP: fica o estado final que já veio no HTML.
    if (semMovimento || !temGsap || !('IntersectionObserver' in window)) return;

    gauges.forEach(function (gauge) {
      var arco = gauge.querySelector('.gauge__arco');
      var numero = gauge.querySelector('.gauge__num');
      var valor = Number(gauge.getAttribute('data-valor'));
      var maximo = Number(gauge.getAttribute('data-max')) || 400;
      var sufixo = gauge.getAttribute('data-sufixo') || '';
      if (!arco || !numero || !valor) return;

      var alvo = ARCO * (1 - valor / maximo);
      arco.style.strokeDashoffset = ARCO;
      numero.textContent = '0' + sufixo;

      ScrollTrigger.create({
        trigger: gauge,
        start: 'top 85%',
        once: true,
        onEnter: function () {
          var conta = { n: 0 };

          gsap.to(arco, {
            strokeDashoffset: alvo,
            duration: 1.4,
            ease: 'power2.out'
          });

          gsap.to(conta, {
            n: valor,
            duration: 1.4,
            ease: 'power2.out',
            onUpdate: function () { numero.textContent = Math.round(conta.n) + sufixo; },
            onComplete: function () { numero.textContent = valor + sufixo; }
          });
        }
      });
    });
  }

  /* --- Pausa tudo quando a aba perde o foco ----------------------------- */

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (temGsap) gsap.globalTimeline.pause();
      videos.forEach(function (video) { video.pause(); });
      pararCarro();
    } else {
      if (temGsap) gsap.globalTimeline.resume();
      videos.forEach(tocarVideo);
      tocarCarro();
      retomarTerminal();
    }
  });

  /* --- Início ----------------------------------------------------------- */

  // observarVideos() decide internamente: com prefers-reduced-motion ele só carrega
  // o primeiro quadro e liga os controles nativos, sem nunca dar play.
  observarVideos();
  montarCarrossel();
  // Fica antes do return: o terminal não depende do GSAP, só de movimento.
  montarTerminal();
  // Também fica antes do return: a barra mede o scroll nos dois modos, e ela
  // mesma decide se o pescoço ondula ou fica parado.
  progressoDeScroll();

  if (semMovimento || !temGsap) {
    // Sem movimento: valores finais direto, nenhuma das três animações roda.
    carregarTelemetria().then(function (dados) {
      aplicarTelemetria(dados, false);
    });
    return;
  }

  /* --- Scroll suave (Lenis) --------------------------------------------- */

  // Só chega aqui com movimento liberado: acima existe o return de
  // prefers-reduced-motion. Com ele ativo o Lenis nem é instanciado e o
  // navegador continua rolando nativamente, sem nenhuma interceptação.
  if (typeof window.Lenis === 'function') {
    // anchors: true entrega os cliques de âncora ao Lenis. Sem isso, o
    // scroll-behavior: smooth do CSS e o Lenis animariam o mesmo scroll
    // ao mesmo tempo, um brigando com o outro.
    var lenis = new Lenis({ anchors: true });
    document.documentElement.style.scrollBehavior = 'auto';

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (tempo) { lenis.raf(tempo * 1000); });
    gsap.ticker.lagSmoothing(0);

    // A aba escondida já pausa a globalTimeline; o ticker do GSAP para junto.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) lenis.stop();
      else lenis.start();
    });
  }

  marcaDePneu();
  contadores();
  brilhoNaBorda();
  montarGauges();
}());
