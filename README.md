# Portfólio — Thiago Viriato Accioly

Site pessoal em Next.js (App Router), publicado na Vercel:
https://portfolio-thiago-beta.vercel.app

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de produção
npm run lint
```

- `src/content/`: todos os textos do site.
- `src/styles/tokens.css`: cores, fontes, medidas e espaçamento, num só lugar.
- `src/components/`: `sections/` (as 6 seções), `ui/` (peças reutilizáveis),
  `interactive/` (client components), `layout/`, `background/` (fundo 3D).
- `docs/plano-migracao-next.md`: plano e decisões da migração a partir do site
  estático (a versão antiga está na tag `v1-estatico`).

O endereço antigo do GitHub Pages só redireciona para a Vercel (branch `gh-pages`).
