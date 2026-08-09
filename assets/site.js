/* ==========================================================================
   Portfólio Thiago Viriato Accioly
   Três animações, e só três: progresso de scroll, marca de pneu na entrada
   de seção e contadores da faixa de telemetria.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------------
     PONTO DE INTEGRAÇÃO FUTURA: API do GitHub.

     Hoje os valores são estáticos e vivem aqui (e também no HTML, para quem
     abrir a página sem JS). Para plugar a API depois, troque só o corpo de
     carregarTelemetria() por um fetch e devolva um objeto no mesmo formato.

     Rascunho do que dá para puxar:
       ULT. COMMIT -> GET /repos/Acciolyy/<repo>/commits?per_page=1
                      (commit.author.date, converter para "2h", "3d")
       TESTES      -> total de testes do último run
       SUITE       -> duração do último run
       CI          -> GET /repos/Acciolyy/<repo>/actions/runs?per_page=1
                      (conclusion === 'success' ? 'passing' : 'failing')
     ------------------------------------------------------------------------ */
  var TELEMETRIA = {
    ultimoCommit: { valor: 2,    decimais: 0, sufixo: 'h' },
    testes:       { valor: 92,   decimais: 0, sufixo: ''  },
    suite:        { valor: 5.24, decimais: 2, sufixo: 's' },
    ci:           { texto: 'passing' }
  };

  function carregarTelemetria() {
    return Promise.resolve(TELEMETRIA);
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
    if (!video.visivel || document.hidden) return;
    var p = video.play();
    if (p && p.catch) p.catch(function () { /* autoplay bloqueado, tudo bem */ });
  }

  function observarVideos() {
    if (!videos.length || !('IntersectionObserver' in window)) return;

    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var video = e.target;
        video.visivel = e.isIntersecting;

        if (e.isIntersecting) {
          if (video.preload === 'none') {
            video.preload = 'metadata';
            video.load();
          }
          tocarVideo(video);
        } else {
          video.pause();
        }
      });
    }, { rootMargin: '200px 0px' });

    videos.forEach(function (video) { observador.observe(video); });
  }

  /* --- Pausa tudo quando a aba perde o foco ----------------------------- */

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (temGsap) gsap.globalTimeline.pause();
      videos.forEach(function (video) { video.pause(); });
    } else {
      if (temGsap) gsap.globalTimeline.resume();
      videos.forEach(tocarVideo);
    }
  });

  /* --- Início ----------------------------------------------------------- */

  observarVideos();

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
