import type { EstudoDeCaso } from "./tipos";

// Fonte: README.md e docs/EVAL.md de github.com/Acciolyy/agente-triagem-vagas.
const REPO = "https://github.com/Acciolyy/agente-triagem-vagas";

export const agenteTriagemVagas: EstudoDeCaso = {
  slug: "agente-triagem-vagas",
  titulo: "Agente de Triagem de Vagas com LLM",
  rotulo: ["estudo de caso", "LLM · agente"],
  resumo:
    "Um agente em Python que filtra vagas remotas por critérios escritos em linguagem natural, com Gemini e function calling, e que foi avaliado com vagas reais antes de eu confiar nele.",
  descricao:
    "Agente em Python com Gemini e function calling que tria vagas remotas. Avaliado em 80 vagas reais rotuladas à mão (92,4% de descarte correto) e em 8 pares sintéticos de contraste.",
  tags: ["Python", "Gemini", "Function calling", "Pydantic", "Docker", "pytest · CI"],
  links: [
    { rotulo: "GitHub", href: REPO, cheio: true },
    { rotulo: "Relatório de avaliação", href: `${REPO}/blob/master/docs/EVAL.md` },
  ],
  midia: {
    tipo: "video",
    src: "/videos/agente.webm",
    poster: "/videos/agente-poster.jpg",
    descricao:
      "Agente de triagem em uso: critérios de vaga escritos em linguagem natural na barra lateral e busca de vagas remotas",
    legenda: "critérios na barra lateral · vagas avaliadas à direita",
  },
  numeros: [
    { valor: "92,4%", rotulo: "descarte correto em 80 vagas reais rotuladas à mão", destaque: true },
    { valor: "100%", rotulo: "recall em 8 pares sintéticos de contraste" },
    { valor: "80%", rotulo: "precisão nos mesmos 8 pares" },
    { valor: "39", rotulo: "testes automatizados, rodando em CI" },
  ],
  porQue: [
    "Triar vagas remotas na mão toma tempo: abrir cada anúncio só para descobrir que pede outro nível, outra stack ou residência nos EUA.",
    "Quis automatizar essa triagem, mas o objetivo maior era praticar a engenharia que fica em volta de um LLM: ferramentas, validação, testes e, principalmente, avaliação.",
  ],
  fluxo: {
    rotulo: "Fluxo do agente",
    passos: [
      { titulo: "Critérios", texto: "O que eu procuro, escrito em linguagem natural (criterios.txt)." },
      { titulo: "Busca no feed", texto: "A ferramenta buscar_vagas_wwr lê o RSS do We Work Remotely e filtra pelo termo." },
      { titulo: "Modelo decide", texto: "O Gemini, com function calling, lê cada vaga contra os critérios.", destaque: true },
      { titulo: "Validação", texto: "Pydantic valida a chamada de avaliar_vaga; argumento inválido volta ao modelo como erro." },
      { titulo: "Resultado", texto: "Vagas para aplicar e para descartar, com o motivo de cada decisão." },
    ],
  },
  decisoes: [
    {
      escolha: "Decisão por function calling",
      motivo:
        "O schema das ferramentas e o enum do veredito ficam declarados, e a resposta do modelo chega como uma chamada estruturada.",
      alternativa: "Pedir JSON no prompt e interpretar o texto da resposta.",
    },
    {
      escolha: "A ferramenta só registra e valida; quem decide é o modelo",
      motivo:
        "Ler a vaga contra os critérios é justamente o que quero que o modelo faça, e assim a avaliação mede o julgamento dele, não regras que eu escrevi.",
      alternativa: "Filtrar as vagas por palavras-chave no código.",
    },
    {
      escolha: "Pydantic na ferramenta",
      motivo:
        "Avaliacao restringe o veredito a \"aplicar\" ou \"não aplicar\" e exige motivo não vazio. Argumento inválido volta ao modelo como erro de ferramenta, e o programa não cai.",
      alternativa: "Confiar só no enum do schema, que não cobre, por exemplo, um motivo vazio.",
    },
    {
      escolha: "RSS do We Work Remotely como fonte",
      motivo:
        "A API do Remote OK passou a servir um conjunto limitado de vagas, aparentemente uma medida contra raspagem de dados, e rendia pouquíssimos resultados para termos como \"python\". Por isso a fonte passou a ser o RSS do We Work Remotely.",
      alternativa: "API do Remote OK.",
    },
    {
      escolha: "Rótulo humano e controle sintético em pares de contraste",
      motivo:
        "Rótulos feitos por mim, a partir do mesmo texto que o agente recebe, dão um gabarito independente do tipo de modelo avaliado. Os pares mudam um fator por vez (nível, Python, local, stack, modelo de trabalho).",
      alternativa: "Usar outro LLM como juiz.",
    },
    {
      escolha: "Testes com LLM falso",
      motivo:
        "Um cliente falso devolve chamadas de função pré-definidas, inclusive com argumentos inválidos e timeout: o CI fica rápido e determinístico, e a API real devolveu 503 e 429 várias vezes durante o projeto.",
      alternativa: "Testar contra a API real.",
    },
  ],
  resultado: {
    texto:
      "Duas avaliações com papéis diferentes: as vagas reais medem o uso de verdade; os pares de contraste mudam um critério por vez e mostram onde o agente erra.",
    legenda: "avaliação · em % (maior é melhor)",
    barras: [
      { rotulo: "Descarte correto", base: "80 vagas reais · 73 de 79", valor: 92.4, texto: "92,4%", destaque: true },
      { rotulo: "Recall", base: "8 pares de contraste · 8 de 8", valor: 100, texto: "100%" },
      { rotulo: "Precisão", base: "8 pares de contraste · 8 de 10", valor: 80, texto: "80%" },
    ],
    nota: "Nas vagas reais só uma era \"aplicar\" em 80, então recall e precisão vêm do controle sintético.",
  },
  erros: [
    {
      titulo: "O agente não exigia Python",
      principal: true,
      texto:
        "Os 6 falsos positivos reais e os 2 do controle sintético são vagas de IA/ML ou dados que não mencionam Python, e o agente aprovou mesmo assim. A falha foi encontrada e documentada no relatório de avaliação, mas a correção ainda não foi feita: está nos próximos passos. Aprendi: eu desconfiava do nível; foi o par de contraste, mudando um fator por vez, que mostrou que a causa era o Python.",
    },
    {
      titulo: "As vagas reais quase não têm positivos",
      texto:
        "Das 80 vagas, só uma ficou como \"aplicar\", e com um positivo precisão e recall não dizem nada. Isso me levou ao conjunto sintético, com 8 positivos e 8 negativos por construção.",
    },
    {
      titulo: "Avaliar um LLM exige tolerar a API",
      texto:
        "Cotas (429) e indisponibilidade (503) me levaram a fazer a avaliação retomável (--retomar), reaproveitando as decisões já gravadas.",
    },
    {
      titulo: "Uma requisição sem resposta",
      texto:
        "Uma chamada ao Gemini ficou mais de 10 minutos sem resposta e sem erro. Configurei um timeout de 60 s e passei a tratar o estouro como erro recuperável, com nova tentativa e espera crescente, coberto por testes que simulam o timeout.",
    },
  ],
  proximos: [
    "Corrigir a falha do Python: exigir menção explícita a Python e checar o nível antes de decidir, extraindo os dois da vaga, com a evidência no texto, e tratando \"não informado\" como incerto.",
    "Depois, rodar a avaliação de novo nos mesmos três conjuntos e comparar: o alvo é reduzir os 6 falsos positivos reais e acertar os pares de Python, sem perder os que já passam.",
  ],
  repositorio: REPO,
};
