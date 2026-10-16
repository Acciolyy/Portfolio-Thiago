import type { CardProjeto, Destaque } from "./tipos";

export const projetos = {
  rotulo: "04 / PROJETOS",

  principal: {
    rank: "Projeto principal",
    titulo: "ImóvelDF, Portal de Imóveis",
    origem: "demanda real",
    stack: [
      "Python 3.12",
      "Django 5.2",
      "PostgreSQL 16",
      "HTMX",
      "Alpine.js",
      "Tailwind",
      "Docker",
      "pytest",
    ],
    paragrafos: [
      "Plataforma para anunciantes e imobiliárias: cadastro e busca de imóveis com filtros via HTMX, parceria B2B entre corretores com comissão configurável, e um painel de analytics com histórico de visualizações e leads por imóvel.",
      "Os endpoints devolvem fragmentos de HTML consumidos por HTMX, no modelo de hipermídia, em vez de JSON para uma SPA.",
    ],
    pontos: [
      "UUID como chave primária, para evitar enumeration attacks em endpoints",
      "Soft delete com managers dedicados e auditoria por timestamps",
      "on_delete=PROTECT como padrão e CheckConstraint garantindo invariantes no banco",
      "Hardening contra supply-chain com hashes SRI e tokens CSRF",
      "PostgreSQL 16 em container Docker espelhando produção",
      "Suíte de testes automatizados (pytest), rodando contra PostgreSQL com paralelização via xdist, com CI/CD (GitHub Actions) como gate de qualidade na branch. Validei o locking pessimista (select_for_update) isoladamente, 10 execuções seguidas sem falha, contra concorrência real simulada com threads.",
    ],
    gauges: [
      {
        valor: 364,
        max: 400,
        titulo: "testes automatizados",
        detalhe: "pytest contra PostgreSQL",
        escala: "escala 0 a 400",
      },
      {
        valor: 32,
        max: 40,
        sufixo: "s",
        titulo: "tempo de execução",
        detalhe: "paralelização via xdist",
        escala: "escala 0 a 40 segundos",
      },
    ],
    links: [
      {
        href: "https://imoveldf-homolog.onrender.com",
        rotulo: "Demonstração (homologação)",
      },
    ],
    nota: "Primeiro acesso pode levar ~30s (hospedagem adormece por inatividade). Acesso de corretor requer login; navegação e busca de imóveis são livres para qualquer visitante.",
    video: {
      src: "/videos/imoveldf.webm",
      ariaLabel:
        "Plataforma ImóvelDF em uso: busca de imóveis com filtros, parceria entre corretores e painel de analytics",
    },
  } satisfies Destaque,

  cards: [
    {
      titulo: "Catálogo com Bugs Propositais",
      origem: "prática",
      texto:
        "Aplicação Django que construí para praticar automação de testes, com bugs documentados e reproduzidos: validação de preço negativo, TextField sem limite, off-by-one na paginação, ausência de controle de acesso por papel, e página protegida ainda acessível pelo botão voltar após logout, por falta de Cache-Control.",
      stack: ["Django", "pytest", "Playwright"],
      links: [
        {
          href: "https://github.com/Acciolyy/catalog-under-test",
          rotulo: "github.com/Acciolyy/catalog-under-test",
        },
      ],
    },
  ] satisfies CardProjeto[],
};
