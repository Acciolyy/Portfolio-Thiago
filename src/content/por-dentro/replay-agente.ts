// Replay de UM caso real da avaliação do agente de triagem, sem chamada à API.
// Todo o texto é copiado literalmente do repositório
// github.com/Acciolyy/agente-triagem-vagas (branch master):
//   - vaga:      eval/vagas_backendbr.csv, linha da Ártemis (título, link e
//                descrição de 300 caracteres, exatamente o que o agente recebe)
//   - critérios: eval/criterios_eval.txt
//   - chamada:   nomes dos campos de AVALIAR_VAGA_DECLARATION em
//                src/triagem/agente.py; valores de eval/resultados_backendbr.csv
//   - validação: o modelo Avaliacao de src/triagem/modelos.py
//   - veredito:  eval/resultados_backendbr.csv (veredito_agente, motivo,
//                veredito_esperado, acerto)

export const replayAgente = {
  fonte: "eval/resultados_backendbr.csv",
  vaga: {
    titulo: "[Remoto] Desenvolvedor(a) Full Stack Pleno (Python / TypeScript / IA) na Ártemis",
    link: "https://github.com/backend-br/vagas/issues/12422",
    descricao:
      "# Vaga: Desenvolvedor(a) Full Stack Pleno (Python / TypeScript / IA) ## Sobre a oportunidade A Ártemis – Perícia Médica Especializada está contratando Desenvolvedor(a) Full Stack com início imediato para atuar no desenvolvimento de sistemas internos de análise de dados, automação de fluxos documenta...",
  },
  criterios:
    "O candidato busca vagas de nível júnior ou pleno. As posições devem usar Python no backend, com Django, FastAPI ou Flask, ou atuar com dados e inteligência artificial usando Python. É aceitável que a vaga exija inglês de nível intermediário ou avançado. A vaga precisa ser remota e aceitar candidatos que morem fora dos Estados Unidos.",
  resultado: {
    veredito: "aplicar",
    motivo: "Vaga 100% remota, de nível pleno, envolvendo Python e IA, totalmente alinhada aos critérios.",
    esperado: "aplicar",
    acerto: "True",
  },
  // Campos do modelo Avaliacao conferidos pelo Pydantic (modelos.py).
  validacao: [
    'veredito: Literal["aplicar", "não aplicar"]',
    "motivo: str (strip_whitespace=True, min_length=1)",
  ],
} as const;
