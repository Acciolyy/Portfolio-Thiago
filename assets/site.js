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
    var carro = document.getElementById('progress-car');
    if (!barra || !trilha || !carro) return;

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        var p = self.progress;
        trilha.style.width = (p * 100).toFixed(2) + '%';
        // o carro anda dentro da barra, sem sair pelas pontas
        carro.style.transform = 'translateX(' + (p * (barra.clientWidth - 34)).toFixed(1) + 'px)';
      }
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
    }
  });

  /* --- Início ----------------------------------------------------------- */

  // observarVideos() decide internamente: com prefers-reduced-motion ele só carrega
  // o primeiro quadro e liga os controles nativos, sem nunca dar play.
  observarVideos();
  montarCarrossel();

  if (semMovimento || !temGsap) {
    // Sem movimento: valores finais direto, nenhuma das três animações roda.
    carregarTelemetria().then(function (dados) {
      aplicarTelemetria(dados, false);
    });
    return;
  }

  progressoDeScroll();
  marcaDePneu();
  contadores();
}());
