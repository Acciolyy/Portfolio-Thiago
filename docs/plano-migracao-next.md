# Plano de migração: site estático → Next.js (deploy na Vercel)

> **Regra número 1 desta migração: paridade total.**
> Nada muda no que o visitante vê ou sente: mesmo layout, mesmas cores, fontes,
> espaçamentos, textos, animações, tempos, breakpoints e comportamento com
> `prefers-reduced-motion`. Até as esquisitices atuais são preservadas (ver
> "Peculiaridades que serão mantidas"). Redesign, refatoração visual e
> "melhorias" ficam para **depois** que o Next estiver no ar idêntico ao site
> atual. Qualquer diferença visual encontrada na comparação é bug da migração.

---

## 0. Estado da migração (branch `migracao-next`)

| Fase | Situação |
|---|---|
| 0. Linha de base | **Feita.** Tag `v1-estatico`, branch `migracao-next`, screenshots em `docs/paridade/antes/` (reduced motion, 5 larguras) |
| 1. Esqueleto do Next | **Feita.** Next 16.4.2, React 19.3.0, Tailwind v4 via PostCSS, `gsap@3.12.5`, `lenis@1.3.26`, `three@0.160.0` travados |
| 2. Tokens e CSS | **Feita.** `style.css` fatiado sem editar regra; tokens em `src/styles/tokens.css` |
| 3. Markup estático | **Feita.** DOM gerado confere com o `index.html` (diferenças só as esperadas, ver 5.1) |
| 4. Interatividade | **Feita.** Todos os componentes portados, testados em produção e em `next dev` (StrictMode) |
| 5. Paridade | **Feita no local.** Falta repetir no Preview da Vercel |
| 6. Deploy na Vercel | **Pendente** (precisa da sua conta e do domínio) |
| 7. Limpeza | **Pendente** (`index.html`, `style.css`, `assets/` ficam como referência até a Fase 6) |

### 0.1 Decisões tomadas na execução

- **Rodapé:** o texto "HTML, Tailwind, Alpine.js e GSAP." saiu, como pedido. Agora é só `© 2026 Thiago Viriato Accioly.` (`src/content/site.ts`). É a única diferença visual em relação ao site antigo.
- **Inter 450:** carregado só em 400 e 500, igual ao `<link>` do Google Fonts. O 450 do `.note p` continua resolvendo como antes.
- **Hooks:** em vez de `useReducedMotion`/`useInView`/`usePageVisibility`, ficou `lib/motion.ts` (`prefersReducedMotion()`, lido dentro dos efeitos, como o `site.js`) e `hooks/useCardGlow.ts`. Cada componente trata a própria visibilidade da aba.
- **`fundo3d`:** ficou em `.js` (`src/lib/fundo3d/index.js`), porta quase literal do original. Tipar 1200 linhas é tarefa do redesign. Espera `document.fonts.ready` antes de medir o texto da Hero e do Contato.
- **Carrossel:** a imagem e a legenda ficam em colunas diferentes, então o estado mora em `CarouselProvider`, com `CarouselMedia` e `CarouselCaption` lendo dele.
- **`ProjectGrid`** é client component porque hospeda o brilho de borda (`glow`), só na grade de Projetos, como no original.
- **`next.config.ts` mínimo.** O scaffold do Next 16 vem com `cacheComponents`/`partialPrefetching`; ficaram de fora porque a página é estática.
- **`package-lock.json` agora é versionado** (antes estava no `.gitignore`), para a Vercel instalar exatamente as mesmas versões.
- **`AGENTS.md`** é gerado pelo `next dev` (aviso de que esta versão do Next muda APIs; ler `node_modules/next/dist/docs/`). Mantido.
- **Domínio:** `metadataBase` usa `VERCEL_PROJECT_PRODUCTION_URL` (a Vercel injeta). Quando escolher o domínio final, o `og:image` e o `og:url` acompanham sozinhos.

---

## 1. Ponto de partida (o que existe hoje)

| Peça | Hoje | Vira no Next |
|---|---|---|
| `index.html` (696 linhas, 6 seções) | HTML único | `app/layout.tsx` + `app/page.tsx` + componentes |
| `style.css` (1323 linhas, BEM, tokens em `:root`) | CSS global | `styles/tokens.css` + parciais por componente, **mesmas classes** |
| `assets/tailwind.css` (Tailwind v4 compilado via CLI) | build manual `npm run css` | Tailwind v4 via `@tailwindcss/postcss`, build automático |
| `assets/site.js` (IIFE: progresso/cobra, pneu, telemetria, gauges, terminal, carrossel, vídeos, brilho, Lenis) | script global | client components + hooks |
| `assets/fundo3d.js` (Three.js, 1224 linhas) | módulo ES via CDN | módulo em `lib/fundo3d/` chamado por um client component |
| Alpine.js (só o menu mobile) | CDN | `useState` no `Header` (Alpine sai) |
| GSAP 3.12.5, ScrollTrigger, Lenis 1.3.26, Three 0.160.0 | CDN com SRI | pacotes npm **nas mesmas versões** |
| Google Fonts via `<link>` | externo | `next/font/google` (self-hosted) |
| `TVlogo.ico`, `eu imagem.jpg`, `assets/*.webm` | raiz/assets | `app/favicon.ico`, `public/` |
| Deploy | GitHub Pages, build `legacy`, branch `main`, pasta `/` | Vercel (Pages desligado + redirect) |

Arquivos que **não** são referenciados em lugar nenhum e não precisam ir para o
Next: `TV1.png`, `agile.png`, `challenge.png`, `developer.png`, `eng.png`,
`face (1).png`, `assets/*:Zone.Identifier`. Continuam no histórico do git.

---

## 2. Stack e decisões

- **Next.js** (versão estável atual, `create-next-app@latest`), **App Router**, **TypeScript**, ESLint.
- **React Server Components por padrão**: todo o HTML continua sendo gerado no
  build (página estática). Só vira `'use client'` o que tem JS de verdade.
  Isso preserva o comportamento atual "sem JS o conteúdo inteiro aparece".
- **Tailwind v4** continua (já é a versão usada), agora pelo PostCSS do Next.
- **CSS continua global e com os mesmos nomes de classe BEM** nesta fase.
  Nada de CSS Modules agora: eles renomeiam as classes, e o `fundo3d.js`
  mede o layout por seletor (`.hero__top`, `.hero__lead`, `.spec`, `#contato`).
  CSS Modules pode entrar no redesign.
- **Sem `output: 'export'`**: na Vercel o build padrão já gera a página como
  estática, e deixa a porta aberta para ISR/rotas de API depois.
- **Versões das libs de animação travadas** (sem `^`): `gsap@3.12.5`,
  `lenis@1.3.26`, `three@0.160.0`. Atualizar muda comportamento, e isso é
  para depois.

---

## 3. Estrutura de pastas

```
Portfolio-Thiago/
├── docs/
│   └── plano-migracao-next.md
├── public/
│   ├── images/
│   │   └── eu-imagem.jpg            # renomeado: sem espaço no nome
│   └── videos/
│       ├── imoveldf.webm
│       ├── destaque.webm
│       ├── agente.webm
│       └── dashboard.webm
├── src/
│   ├── app/
│   │   ├── layout.tsx               # <html lang="pt-BR">, fontes, metadata, casca fixa
│   │   ├── page.tsx                 # monta as 6 seções na ordem
│   │   ├── globals.css              # @import tailwind + tokens + base + parciais (ordem do style.css)
│   │   └── favicon.ico              # ex-TVlogo.ico
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── SkipLink.tsx
│   │   │   ├── ScrollProgress.tsx   # 'use client' — barra + cobra SVG
│   │   │   ├── Header.tsx           # 'use client' — nav desktop + drawer mobile (ex-Alpine)
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── background/
│   │   │   └── Fundo3D.tsx          # 'use client' — <canvas> + import dinâmico do lib/fundo3d
│   │   │
│   │   ├── sections/
│   │   │   ├── Hero.tsx             # 01 / INICIO
│   │   │   ├── Sobre.tsx            # 02 / SOBRE
│   │   │   ├── NemTudo.tsx          # 03 / NEM TUDO É O QUE PARECE
│   │   │   ├── Projetos.tsx         # 04 / PROJETOS
│   │   │   ├── OutrosInteresses.tsx # 05 / OUTROS INTERESSES
│   │   │   └── Contato.tsx          # 06 / CONTATO
│   │   │
│   │   ├── ui/                      # peças reutilizadas entre seções
│   │   │   ├── Section.tsx          # <section id class="section section--x"><div class="wrap">
│   │   │   ├── JoinSep.tsx          # "A · B · C" com os .sep
│   │   │   ├── SpecList.tsx         # ficha técnica (.spec)
│   │   │   ├── StackLine.tsx        # linha de stack (.stack)
│   │   │   ├── OutRow.tsx           # linha de links externos com ↗ (.out-row / .out)
│   │   │   ├── GaugeGroup.tsx
│   │   │   ├── FeatureProject.tsx   # .feature (main | inverso | padrão) + FeatureCorpo
│   │   │   ├── ProjectCard.tsx      # .card dentro da grade
│   │   │   └── ProjectGrid.tsx      # 'use client' — .grid-projects (single | pair) + glow
│   │   │
│   │   └── interactive/             # tudo 'use client'
│   │       ├── SectionLabel.tsx     # "0N / TÍTULO" + marca de pneu (.sec-label + .tire)
│   │       ├── Gauge.tsx            # mostrador radial (calcula o dashoffset, anima)
│   │       ├── Telemetry.tsx        # faixa de telemetria (GitHub API + cache)
│   │       ├── Terminal.tsx         # REPL simulado com "digitação"
│   │       ├── Carousel.tsx         # CarouselProvider + CarouselMedia + CarouselCaption
│   │       └── LazyVideo.tsx        # vídeo que só carrega/toca na viewport
│   │
│   ├── providers/
│   │   └── MotionProvider.tsx       # 'use client' — registra ScrollTrigger, liga Lenis,
│   │                                #   expõe reducedMotion, pausa tudo no visibilitychange
│   ├── hooks/
│   │   └── useCardGlow.ts           # brilho de borda seguindo o cursor
│   │
│   ├── lib/
│   │   ├── gsap.ts                  # import + registerPlugin(ScrollTrigger) uma vez
│   │   ├── motion.ts                # prefersReducedMotion()
│   │   ├── telemetria.ts            # buscarNoGithub, contarCommits, idade, cache localStorage
│   │   ├── gauge.ts                 # ARCO = 207.345, dashoffsetFinal(valor, max)
│   │   └── fundo3d/
│   │       └── index.js             # porta do fundo3d.js: iniciar(canvas) → () => limpeza
│   │
│   ├── content/                     # TODO o texto do site, separado do markup
│   │   ├── site.ts                  # nome, títulos, meta/OG, links de nav, contatos, rodapé
│   │   ├── hero.ts                  # pitch, ficha técnica, valores padrão da telemetria
│   │   ├── sobre.ts                 # parágrafos, transcrito do terminal, gauges
│   │   ├── nota.ts                  # texto + anotação "# sintoma / # causa / # raiz"
│   │   ├── tipos.ts                 # Link, GaugeData, Video, Destaque, CardProjeto
│   │   ├── projetos.ts              # ImóvelDF + Catálogo com Bugs
│   │   └── outros-interesses.ts     # Cell-Detector, portfólio IA (slides), Agente, Dashboard
│   │
│   └── styles/
│       ├── tokens.css               # FONTE ÚNICA de cores, fontes, espaçamentos, medidas
│       ├── fonts.css                # @font-face 'Reserva condensada' e 'Reserva de corpo'
│       ├── base.css                 # html, body, h1–h4, a, img, ::selection, :focus-visible, .wrap, .indent
│       └── components/              # style.css fatiado, mesmo conteúdo, mesma ordem
│           ├── progress.css
│           ├── header.css
│           ├── section.css          # .section, .section--*, .sec-label, .tire
│           ├── fundo3d.css          # .fundo3d, .nuvem-rotulo
│           ├── hero.css             # hero, spec, telemetry
│           ├── sobre.css            # about, term
│           ├── nota.css
│           ├── projetos.css         # origin, stack, card, rank, points, feature
│           ├── carrossel.css
│           ├── gauge.css
│           ├── grid.css             # grid-projects, card__media, out, private-note
│           ├── contato.css          # contact, site-footer
│           └── a11y.css             # skip-link, reduced-motion (sempre por último)
│
├── next.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

**Por que `content/` separado:** o redesign futuro mexe em componentes e
CSS; os textos ficam onde estão. E adicionar um projeto vira acrescentar um
objeto em `projetos.ts`, não copiar 40 linhas de HTML.

Exemplo do formato:

```ts
// src/content/projetos.ts
export type Projeto = {
  slug: string;
  titulo: string;
  origem: string;              // "demanda real" | "prática" | ...
  rank?: string;               // "Projeto principal" | "Em destaque"
  stack: string[];             // StackLine junta com " · "
  paragrafos: string[];
  pontos?: string[];           // lista .points
  video?: { src: string; ariaLabel: string };
  gauges?: GaugeData[];
  links: { href: string; rotulo: string }[];
  nota?: string;               // .private-note
};
```

---

## 4. Componentização

### Server components (sem JS no cliente)

`Hero`, `Sobre`, `NemTudo`, `Projetos`, `OutrosInteresses`, `Contato`,
`Footer`, `SkipLink`, `Section`, `SectionLabel`, `SpecList`, `StackLine`,
`OutLink`, `Gauge`, `GaugeGroup`, `FeatureProject`, `ProjectCard`, `ProjectGrid`.

Eles devolvem **exatamente** a mesma árvore de HTML de hoje: mesmas tags,
classes, `id`s, atributos `aria-*`, `data-*`, `width/height`, `loading`, `decoding`.

`Gauge` calcula o `stroke-dashoffset` a partir de `valor`/`max`
(`207.345 * (1 - valor/max)`), e o resultado tem que bater com o HTML atual:
297/400 → `53.39`, 15/40 → `129.59`, 364/400 → `18.66`, 32/40 → `41.47`.
Os `<line>` dos ticks e o `path` do arco ficam como constantes copiadas do HTML.

### Client components (porta do `site.js` e do `fundo3d.js`)

Cada função do `site.js` vira um componente/hook. **A lógica é copiada, não
reescrita**: mesmos números (durations, eases, `rootMargin`, `start: 'top 85%'`,
4500 ms do carrossel, 26–60 ms por caractere do terminal etc.).

| Função no `site.js` | Destino | Observação |
|---|---|---|
| `progressoDeScroll` | `ScrollProgress` | Usa o ticker do GSAP; fallback por `scroll` + rAF quando reduced motion |
| `marcaDePneu` | `SectionLabel` (efeito com `ref`) | ScrollTrigger `once: true` |
| `carregarTelemetria`, `aplicarTelemetria`, `contadores` | `Telemetry` + `lib/telemetria.ts` | Valores padrão do HTML renderizados no servidor; troca no cliente igual hoje. Mesma chave `telemetria` no `localStorage`, 1 h de validade |
| `observarVideos` | `LazyVideo` | `preload="none"` → `metadata` ao entrar; com reduced motion liga `controls` e tira `loop` |
| `montarCarrossel` | `Carousel` | `aria-live` só na navegação manual; pausa em hover/foco/fora da tela/aba oculta |
| `montarTerminal` | `Terminal` | Ver nota abaixo |
| `brilhoNaBorda` | `CardGlow` | Ver "Peculiaridades" |
| `montarGauges` | `Gauge` vira client **só** para a animação (ou um `GaugeAnimator` filho) | Sem JS/reduced motion: fica o valor final já renderizado |
| Lenis + `visibilitychange` | `MotionProvider` | `new Lenis({ anchors: true })`, `lagSmoothing(0)`, `lenis.on('scroll', ScrollTrigger.update)` |
| Alpine (`x-data`, `@click.outside`, `x-cloak`) | `Header` com `useState` | O drawer fica **sempre no DOM** com `hidden={!aberto}` (o `aria-controls="menu-mobile"` precisa achar o id); clique fora via listener no `document` |

**Terminal:** hoje o JS troca nós de texto do DOM direto. Dentro do React
isso briga com a reconciliação. A porta faz a mesma coisa com estado: o
transcrito inteiro é renderizado no servidor (funciona sem JS e para leitor
de tela), e no cliente cada trecho tem `feito`/`espera`, com o pendente em
`visibility: hidden` (classe `.term__espera`). Mesmos tempos: 90 ms no
prompt, 130 ms em linha vazia, 240 ms na saída, 26–60 ms por caractere digitado.

**Fundo 3D:** `lib/fundo3d/index.ts` é o `fundo3d.js` quase literal, com três
mudanças mecânicas:
1. `import * as THREE from 'three'` (npm, 0.160.0) em vez da URL do CDN;
2. vira `export function iniciar(canvas): () => void`, e a função de retorno
   desfaz tudo (cancela o rAF, remove listeners de `scroll`/`pointermove`/
   `resize`/`visibilitychange`, remove o `<span class="nuvem-rotulo">` do
   `body`, `renderer.dispose()`, `dispose()` de geometrias e materiais);
3. as cores deixam de ser hex soltos e são lidas dos tokens (ver seção 5).

`Fundo3D.tsx` renderiza o `<canvas class="fundo3d" id="fundo3d" aria-hidden="true">`
e faz `import('@/lib/fundo3d')` dentro do `useEffect`, para o Three não
entrar no bundle inicial (hoje ele também carrega em paralelo, como módulo).

### Cuidados de React que não existiam no site estático

- **StrictMode monta todo efeito duas vezes em desenvolvimento.** Sem
  cleanup, aparecem dois renderizadores WebGL, ScrollTriggers duplicados,
  dois rótulos da nuvem. Todo `useEffect` com GSAP/observer/listener precisa
  devolver a limpeza (para GSAP: `gsap.context()` + `ctx.revert()`, ou o
  hook `useGSAP` do `@gsap/react`).
- **Ordem de inicialização**: hoje o `site.js` roda depois do DOM inteiro.
  No React cada componente inicia no próprio efeito; ScrollTriggers criados
  antes do Lenis precisam de um `ScrollTrigger.refresh()` depois que o
  `MotionProvider` montar.
- **Âncoras**: os links do menu continuam `<a href="#sobre">` comuns (não
  `next/link`), para o Lenis com `anchors: true` interceptar igual hoje.
- **Sem mismatch de hidratação**: nada que depende de `Date.now()`,
  `localStorage` ou `matchMedia` roda no render, só em efeito.

---

## 5. Tokens de design (um só lugar)

**Fonte da verdade: `src/styles/tokens.css`.** Os nomes atuais das
variáveis (`--ink`, `--accent`, `--text-dim`...) **são mantidos**, para o CSS
portado funcionar sem trocar uma linha. Os tokens são expostos para o
Tailwind via `@theme inline`, então `bg-ink`, `text-accent`, `font-mono` etc.
passam a existir com os mesmos valores.

```css
/* src/styles/tokens.css */
:root {
  /* Cores */
  --ink:        #131619;
  --ink-2:      #1A1E22;
  --line:       #22262B;
  --line-2:     #2A2F35;
  --text:       #ECECEA;
  --text-dim:   #9BA3AB;
  --text-mute:  #6E7681;
  --accent:     #FF6B1A;
  --accent-rgb: 255 107 26;

  /* Fontes: --font-*-face vem do next/font (layout.tsx) */
  --font-title: var(--font-barlow-face), 'Roboto Condensed', 'Liberation Sans Narrow', 'Reserva condensada', sans-serif;
  --font-mono:  var(--font-plex-face), ui-monospace, SFMono-Regular, monospace;
  --font-body:  var(--font-inter-face), 'Reserva de corpo', system-ui, -apple-system, sans-serif;

  /* Tipografia de rótulo */
  --label-size:  0.6875rem;
  --label-track: 0.16em;

  /* Medidas de layout */
  --header-h: 54px;
  --wrap:     1440px;
  --prose:    42rem;

  /* Espaçamento: valores que hoje estão soltos no style.css, só nomeados.
     Mesmos números. Consolidar numa escala é tarefa do redesign. */
  --gutter-sm: 1.5rem;     /* .wrap mobile */
  --gutter-md: 2.5rem;     /* .wrap >= 900px */
  --gutter-lg: 3.5rem;     /* .wrap >= 1280px */
  --pad-card-sm: 1.5rem;   /* .card__body, .feature__body */
  --pad-card-lg: 2rem;     /* idem >= 860/900px */

  --sec-hero-top:      calc(var(--header-h) + 5rem);
  --sec-hero-bottom:   3rem;
  --sec-sobre-top:     7.5rem;
  --sec-sobre-bottom:  2.25rem;
  --sec-nota-top:      2.25rem;
  --sec-nota-bottom:   6rem;
  --sec-proj-top:      4rem;
  --sec-proj-bottom:   4.5rem;
  --sec-contato-top:   6.5rem;
  --sec-contato-bottom: 4rem;

  color-scheme: dark;
}

@theme inline {
  --color-ink:       var(--ink);
  --color-ink-2:     var(--ink-2);
  --color-line:      var(--line);
  --color-line-2:    var(--line-2);
  --color-text:      var(--text);
  --color-text-dim:  var(--text-dim);
  --color-text-mute: var(--text-mute);
  --color-accent:    var(--accent);

  --font-title: var(--font-title);
  --font-mono:  var(--font-mono);
  --font-body:  var(--font-body);
}
```

**JS lendo os mesmos tokens:** o `fundo3d.js` tem `0x6E7681`, `0xFF6B1A` e
`0x131619` cravados. Na porta, eles saem de
`getComputedStyle(document.documentElement).getPropertyValue('--text-mute')`
etc., então mudar uma cor no `tokens.css` muda também no 3D.

**Única duplicata inevitável:** o `themeColor: '#131619'` do `viewport` no
`layout.tsx` é gerado no servidor e não lê CSS. Fica com um comentário
apontando para `--ink`.

**Breakpoints:** CSS puro não aceita variável dentro de `@media`. Os 12
valores usados hoje (420, 520, 600, 639, 680, 700, 720, 780, 860, 900, 1100,
1280 px) ficam **literais** nos parciais, como estão, e listados num
comentário no topo do `tokens.css`. Unificar isso muda layout, então é
tarefa do redesign.

**Fontes com `next/font/google`:** Barlow Condensed 600, IBM Plex Mono
400/500, Inter (variável). Cada uma com `variable: '--font-…-face'`,
`display: 'swap'` e **`adjustFontFallback: false`**: as reservas
`'Reserva condensada'` (66%) e `'Reserva de corpo'` (95%), que foram medidas
à mão, continuam valendo em `styles/fonts.css`. A vantagem é sumir a
requisição ao Google no carregamento.

**Cascata do Tailwind:** hoje `tailwind.css` (em layers, com preflight) vem
antes do `style.css` (sem layer), e por isso o CSS do site sempre ganha.
`globals.css` reproduz essa ordem: `@import "tailwindcss";` primeiro, depois
tokens, fontes, base e componentes sem `@layer`. As únicas utilidades
usadas no markup são `m-0`, `mt-4` e `mt-6`. A lista `@source inline(...)`
do `tailwind.src.css` deixa de ser necessária (o Tailwind passa a escanear `src/`).

---

## 6. Peculiaridades que serão mantidas (de propósito)

Estão listadas aqui para ninguém "consertar" durante a migração. Cada uma
vira um item do backlog do redesign.

1. **Brilho no cursor só na primeira grade.** O `site.js` usa
   `document.querySelector('.grid-projects')`, que pega só a grade de
   Projetos (Catálogo com Bugs). Na grade de Outros Interesses o brilho
   acende parado no centro (`--mx/--my` caem no padrão 50%).
2. ~~Rodapé citando as ferramentas~~ **Resolvido:** texto removido a pedido.
3. ~~Peso 450 no Inter~~ **Resolvido:** Inter carregado só em 400 e 500, como antes.
4. **`!important` em `* { box-shadow: none }` e nas grades `--single/--pair`**:
   vão como estão.

---

## 7. Passo a passo da migração

### Fase 0 — Linha de base (antes de escrever qualquer código)
1. `git tag v1-estatico` no `main` atual. É o ponto de volta.
2. Criar a branch `migracao-next`. O `main` continua servindo o Pages sem interrupção.
3. Tirar **screenshots de referência** do site atual com Playwright, com
   `prefers-reduced-motion: reduce` (congela as animações), página inteira,
   nas larguras **390, 768, 1024, 1280 e 1440 px**. Guardar em
   `docs/paridade/antes/`.
4. Anotar o checklist de comportamento da Fase 5 rodando no site atual.

### Fase 1 — Esqueleto do Next
1. Gerar o projeto numa pasta temporária (a raiz não está vazia) e trazer os
   arquivos de config:
   `npx create-next-app@latest tmp-next --ts --app --src-dir --eslint --tailwind --import-alias "@/*"`
2. Ajustar o `package.json`: nome, scripts `dev`/`build`/`start`/`lint`,
   remover `@tailwindcss/cli` e os scripts `css`/`css:watch`.
3. Instalar com versão travada:
   `npm i -E gsap@3.12.5 lenis@1.3.26 three@0.160.0` e `npm i -D -E @types/three@0.160.0`
   (+ `@gsap/react` se for usar o `useGSAP`).
4. Mover mídia: `assets/*.webm` → `public/videos/`, `eu imagem.jpg` →
   `public/images/eu-imagem.jpg`, `TVlogo.ico` → `src/app/favicon.ico`.

### Fase 2 — Tokens e CSS
1. Criar `tokens.css`, `fonts.css`, `base.css` e os parciais copiando o
   `style.css` **bloco a bloco, na mesma ordem**, sem editar regra nenhuma
   (só trocar valores soltos pelos tokens da seção 5 quando o número for idêntico).
2. Fontes no `layout.tsx` com `next/font`.
3. Conferência: `diff` entre o CSS final gerado e o `style.css` original não
   pode ter diferença de regra (só de organização).

### Fase 3 — Markup estático (server components + `content/`)
1. `layout.tsx`: `metadata` (title, description, OG, Twitter, `metadataBase`
   com o domínio novo), `viewport.themeColor`, `<html lang="pt-BR">`, canvas,
   skip link, barra de progresso, header, `<main id="conteudo">`, footer.
2. Uma seção por vez, extraindo o texto para `content/`.
3. `<img>` comum nesta fase (com o `eslint-disable` da regra
   `@next/next/no-img-element` nessas linhas). `next/image` gera outro
   markup (srcset, outro `src`) e fica para depois.
4. Conferência: com JS desligado, o HTML gerado deve ser equivalente ao
   `index.html` (comparar o DOM das seções; diferenças aceitáveis: caminhos
   de mídia, `<script>`s e `<link>`s do head).
5. Screenshot com reduced motion deve bater com a referência da Fase 0.

### Fase 4 — Interatividade (um client component por vez)
Ordem sugerida, do mais isolado ao mais acoplado:
`Header` → `LazyVideo` → `Carousel` → `Terminal` → `Telemetry` →
`MotionProvider` (GSAP + Lenis) → `SectionLabel` (pneu) → `Gauge` →
`ScrollProgress` (cobra) → `CardGlow` → `Fundo3D`.
Depois de cada um: testar com e sem reduced motion, e trocar de aba no meio da animação.

### Fase 5 — Paridade (critério para poder publicar)
**Visual:** screenshots nas mesmas 5 larguras com reduced motion, diff de
pixels contra `docs/paridade/antes/`. Só o canvas 3D pode variar (é animado
e depende de WebGL); o resto tem que bater.

> **Captura do 3D:** o screenshot de página inteira do Playwright redimensiona a
> janela no meio da captura, o que dispara o recálculo do 3D e move o novelo
> alguns pixels. Para comparar o canvas, use screenshot da **viewport**.

**Comportamento** (cada item comparado lado a lado com o site atual):
- [ ] Menu mobile abre/fecha, fecha ao clicar fora e ao clicar num link; texto alterna "menu"/"fechar"
- [ ] Barra de progresso: o preto avança, a cabeça da cobra vira ao subir, o pescoço ondula (e não ondula com reduced motion)
- [ ] Marca de pneu aparece uma vez em cada rótulo de seção
- [ ] Telemetria: valores estáticos sem JS, contador anima, cache de 1 h no `localStorage`, falha da API mantém o último valor
- [ ] Gauges animam de 0 até o valor ao entrar na tela
- [ ] Terminal "digita" ao entrar na tela, pausa com a aba oculta e retoma
- [ ] Carrossel: avança a cada 4,5 s, para em hover/foco/fora da tela, setas do teclado, pontos, legenda com `aria-live` só no manual
- [ ] Vídeos só carregam perto da viewport, tocam/pausam; com reduced motion mostram controles e não tocam sozinhos
- [ ] Brilho da borda segue o cursor no card de Projetos
- [ ] Lenis: scroll suave e âncoras do menu; desligado com reduced motion
- [ ] Fundo 3D: cobras laterais, novelo na Hero, nuvem de tecnologias + rótulo no Contato; some sem WebGL
- [ ] Tudo pausa com a aba oculta
- [ ] Skip link aparece no Tab
- [ ] Lighthouse (performance, acessibilidade, SEO) igual ou melhor que o atual
- [ ] Nenhum erro no console; nenhum aviso de hidratação

#### 5.1 Resultado da paridade local

- **DOM:** `index.html` normalizado vs HTML gerado. Diferenças esperadas: caminhos
  da mídia (`/videos/…`, `/images/…`), `aria-expanded` e `hidden` do menu (que
  era Alpine), spans neutros dentro do terminal, rodapé, e um `<div hidden>` do
  próprio Next (metadata).
- **Pixels (reduced motion, página inteira):** 390, 768, 1024 e 1440 px com
  0,009–0,022 % de pixels diferentes, todos na faixa do rodapé. No 390 a página
  ficou 20 px menor porque o texto antigo do rodapé quebrava em duas linhas.
  No 1280 a viewport da Hero bate (0,0037 %).
- **Comportamento (produção e `next dev`):** menu mobile (abrir, fechar fora,
  fechar no botão, fechar no link, âncora via Lenis), terminal, gauges, telemetria
  com dado real e cache, carrossel (auto, manual, `aria-live`, `loading`), vídeo,
  brilho de borda só na primeira grade, 3D, cobra, Lenis. Console sem erros nem
  avisos de hidratação.
- **Ainda não conferido à mão:** aba oculta pausando tudo, `prefers-reduced-motion`
  nos comportamentos (só o visual foi comparado), Lighthouse, e tudo isso de novo
  no Preview da Vercel.

### Fase 6 — Deploy (seção 8)

### Fase 7 — Limpeza
Remover `index.html`, `style.css`, `assets/`, imagens não usadas e os
`Zone.Identifier`. Atualizar o `.gitignore` com o que o `create-next-app`
gera (`.next/`, `.vercel/`, `next-env.d.ts` etc.). Escrever um `README.md` com `npm run dev`/`build`.
Manter `.claude/`, `.agents/`, `.impeccable/` e `skills-lock.json`.

---

## 8. Trocar o deploy do GitHub Pages para a Vercel

Hoje: Pages em modo `legacy`, publicando a branch `main`, pasta `/`, em
`https://acciolyy.github.io/Portfolio-Thiago/`.

**Atenção à ordem:** no momento em que o Next entrar no `main`, o Pages
continuaria publicando a raiz do repo, que não terá mais um `index.html`
de site. Por isso a Vercel é configurada e validada **antes** do merge.

1. **Conectar o repo na Vercel (ainda na branch `migracao-next`)**
   - vercel.com → Add New → Project → importar `Acciolyy/Portfolio-Thiago`.
   - Framework detectado: Next.js. Build `next build`, output padrão, sem variáveis de ambiente.
   - Production Branch: `main`. Cada push na `migracao-next` gera uma
     **Preview Deployment** com URL própria: é nela que roda a Fase 5.
   - Como o `main` ainda é o site estático, o primeiro deploy de produção
     vai servir o HTML antigo. Não tem problema, ninguém usa essa URL ainda.

2. **Domínio**
   - Escolher o nome do projeto (vira `<nome>.vercel.app`, ex.:
     `thiago-accioly.vercel.app`) ou ligar um domínio próprio em
     Settings → Domains.
   - Colocar esse domínio no `metadataBase` do `layout.tsx` (é o que monta o
     `og:url` e o `og:image` absolutos; hoje eles apontam para o github.io).

3. **Merge**
   - PR `migracao-next` → `main`. A Vercel publica em produção.
   - Rodar o checklist da Fase 5 de novo na URL de produção.

4. **Desligar o Pages e redirecionar o endereço antigo**
   O link `acciolyy.github.io/Portfolio-Thiago` deve estar no LinkedIn,
   currículo e candidaturas. O Pages não faz redirect 301, então:
   - criar a branch órfã `gh-pages` com um único `index.html` contendo
     `<meta http-equiv="refresh" content="0; url=https://NOVO-DOMINIO/">`,
     `<link rel="canonical" href="https://NOVO-DOMINIO/">` e um link visível;
   - Settings → Pages → Source: branch `gh-pages`, pasta `/`.
   - (Alternativa sem redirect: Settings → Pages → Unpublish, ou
     `gh api -X DELETE repos/Acciolyy/Portfolio-Thiago/pages`. Os links antigos passam a dar 404.)

5. **Atualizar os links externos:** LinkedIn, perfil do GitHub (campo
   "website" e README do perfil), "About" do repositório, currículo.

6. **Depois (opcional):** Vercel Analytics / Speed Insights, cabeçalhos de
   segurança no `next.config.ts`, e trocar o fetch da telemetria por ISR no
   servidor (acaba com o limite de 60 req/h por IP do visitante). Todos
   mudam comportamento, então ficam fora desta migração.

**Volta atrás**, se algo der errado depois do merge: `git revert` do merge
(ou reset para a tag `v1-estatico`) e voltar o Pages para `main` / `/`.
O site estático volta a ser publicado como era.

---

## 9. Fora do escopo (backlog do redesign)

- Qualquer mudança visual, de texto, de animação ou de layout
- CSS Modules / migrar estilos para utilitários do Tailwind
- Unificar os breakpoints e criar uma escala de espaçamento
- `next/image` para a foto e o carrossel (com `remotePatterns` para o raw.githubusercontent)
- Atualizar GSAP, Lenis e Three
- Corrigir as peculiaridades da seção 6
- Telemetria no servidor (ISR), Analytics, cabeçalhos de segurança
