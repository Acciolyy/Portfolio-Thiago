# Portfólio — Thiago Viriato Accioly

Site pessoal em Next.js (App Router), publicado na Vercel:
https://portfolio-thiago-beta.vercel.app

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # build de produção
npm run lint
```

- `src/content/`: todos os textos e dados do site (`home.ts`, `site.ts`,
  `sobre.ts`, `casos/` para os estudos de caso, `por-dentro/` para o replay do
  agente e a galeria da IA do zero, `stack.json` para o radar).
- `src/styles/tokens.css`: cores dos dois temas, fontes e medidas, num só lugar.
- `src/components/`: `home/` (seções da Home e a demo da LeNet-5), `caso/`
  (template dos estudos de caso), `painel/` e `por-dentro/` (cards que se
  abrem), `layout/`, `tema/`, `ui/` e `background/` (as cobras do fundo).
- `src/lib/`: `lenet/` (ONNX e o pré-processamento copiado do Space),
  `fundo/cobras.ts` (Canvas 2D) e `aparelho.ts` (camada de movimento). Tudo
  isso é carregado sob demanda, fora do JS inicial.

`src/content/stack.json` é gerado por um script fora do repositório, a partir
dos arquivos de dependências (`requirements*.txt`, `pyproject.toml`,
`package.json`) dos repositórios públicos; o Senado Federal e o ImóvelDF são
privados e entram à mão.

`docs/plano-migracao-next.md` é o registro da migração do site estático para o
Next (a versão antiga está na tag `v1-estatico`). O endereço antigo do GitHub
Pages só redireciona para a Vercel (branch `gh-pages`).
