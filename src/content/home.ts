// Textos da Home (prancha HomeIA).

export const topo = {
  posicionamento: ["Desenvolvedor Python Backend", "IA aplicada: LLMs, agentes e Machine Learning"],
  nome: ["Thiago", "Accioly"],
  // A palavra entre os dois trechos sai no acento.
  frase: ["Construo o backend e a camada de ", "IA", " que roda sobre ele."],
  resumo:
    "Estagiário de desenvolvimento backend no Senado Federal e estudante de Engenharia de Software na UnB, com conclusão prevista em dez/2027. Meta: Engenharia de IA.",
} as const;

export const demo = {
  titulo: "Desenhe um dígito",
  subtitulo: "LeNet-5 · ONNX · no seu navegador",
  instrucoes:
    "Desenhe um único dígito, de 0 a 9, com o mouse, o dedo ou a caneta. A previsão aparece quando você solta o traço. Sem mouse, use o botão Exemplo.",
  vazio: "Desenhe um dígito de 0 a 9 no quadro.",
  carregando: "Carregando o modelo…",
  baixaConfianca:
    "Baixa confiança: a entrada pode não ser um dígito único ou estar fora do padrão do MNIST.",
  acuracia: "CNN: 98,74% ± 0,07 no MNIST",
  notaX:
    "O modelo sempre escolhe um dos 10 dígitos: desenhe um X e ele pode responder 4 com mais de 90% de confiança.",
  space: "https://huggingface.co/spaces/Acciolyyy/lenet5-mnist-demo",
  limiar: 0.7,
} as const;

export type Metrica = { valor: string; extra?: string; rotulo: string; destaque?: boolean };

export type Destaque = {
  id: string;
  // Hash da URL quando o painel está aberto (#projeto-agente).
  ancora: string;
  conteudo: { tipo: "agente" } | { tipo: "ia" };
  // Linha de status em mono, só com dados reais.
  status: string[];
  rotulo: [string, string];
  titulo: string;
  texto: string;
  metricas: [Metrica, Metrica];
  tags: string[];
  href: string;
};

export const destaques: {
  rotulo: string;
  titulo: string;
  texto: string;
  itens: Destaque[];
} = {
  rotulo: "projetos em destaque",
  titulo: "IA que dá para medir",
  texto: "Cada projeto tem avaliação com números e um estudo de caso com o que deu errado.",
  itens: [
    {
      id: "agente",
      ancora: "projeto-agente",
      conteudo: { tipo: "agente" },
      status: ["status: avaliado", "80 vagas reais", "39 testes", "CI"],
      rotulo: ["LLM · agente", "Gemini · function calling"],
      titulo: "Agente de Triagem de Vagas com LLM",
      texto:
        "Avaliado contra vagas reais rotuladas à mão e pares sintéticos de contraste, o que isolou a principal falha: o agente não exigia Python.",
      metricas: [
        { valor: "92,4%", rotulo: "descarte correto · 80 vagas reais", destaque: true },
        { valor: "100%", extra: "/ 80%", rotulo: "recall / precisão · 8 pares" },
      ],
      tags: ["Gemini", "Pydantic", "Docker", "39 testes · CI"],
      href: "/projetos/agente-triagem-vagas",
    },
    {
      id: "ia",
      ancora: "projeto-ia-do-zero",
      conteudo: { tipo: "ia" },
      status: ["status: publicado no Hugging Face", "28 testes", "CI"],
      rotulo: ["ML do zero", "UnB · Hugging Face"],
      titulo: "IA do zero: algoritmos da UnB",
      texto:
        "A*, HMM, filtro de Kalman e Q-Learning do zero, revisados com várias sementes. A revisão corrigiu um vazamento de validação e um erro no Kalman.",
      metricas: [
        { valor: "98,74%", rotulo: "± 0,07 · CNN no MNIST", destaque: true },
        { valor: "59,8%", extra: "± 3,4", rotulo: "redução de erro do Kalman (antes: 27%, instável)" },
      ],
      tags: ["PyTorch", "ONNX", "NumPy", "várias sementes"],
      href: "/projetos/ia-do-zero",
    },
  ],
};

export type LinkCard = { rotulo: string; href: string };

export type OutroProjeto = {
  ancora: string;
  // Vídeo mostrado ao abrir o painel (só baixa quando abre).
  video?: { src: string; poster: string; descricao: string; legenda: string };
  tipo: string;
  titulo: string;
  texto: string;
  numero: string;
  links: LinkCard[];
};

export const outros = {
  rotulo: "outros projetos",
  itens: [
    {
      ancora: "projeto-detector",
      video: {
        src: "/videos/destaque.webm",
        poster: "/videos/destaque-poster.jpg",
        descricao: "Detecção de uso de celular rodando em tempo real sobre vídeo de webcam",
        legenda: "detecção em tempo real sobre vídeo de webcam",
      },
      tipo: "visão computacional · tempo real",
      titulo: "Detector de uso de celular",
      texto:
        "Detecção em tempo real com OpenCV e Edge Impulse. O gargalo estava fora da rede neural: câmera, extração de features e exibição.",
      numero: "~10 → ~30 FPS",
      links: [{ rotulo: "GitHub", href: "https://github.com/Acciolyy/Cell-Detector" }],
    },
    {
      ancora: "projeto-dashboard",
      video: {
        src: "/videos/dashboard.webm",
        poster: "/videos/dashboard-poster.jpg",
        descricao:
          "Dashboard de salários em uso: filtros por ano e senioridade à esquerda, métricas gerais e gráficos à direita",
        legenda: "filtros à esquerda, métricas e gráficos à direita",
      },
      tipo: "dados · dashboard",
      titulo: "Dashboard de análise salarial",
      texto:
        "Streamlit sobre o mercado de tecnologia: um histórico de salários e uma consulta à API da Adzuna, com cache de 24 h. Se a API falhar, o resto do dashboard continua no ar.",
      numero: "130 mil+ registros",
      links: [{ rotulo: "demo", href: "https://tech-salary-insights.streamlit.app/" }],
    },
    {
      ancora: "projeto-imoveldf",
      video: {
        src: "/videos/imoveldf.webm",
        poster: "/videos/imoveldf-poster.jpg",
        descricao:
          "Plataforma ImóvelDF em uso: busca de imóveis com filtros, parceria entre corretores e painel de analytics",
        legenda: "vitrine, detalhe do imóvel e painel de analytics",
      },
      tipo: "backend · web",
      titulo: "ImóvelDF",
      texto:
        "Portal de imóveis em Django e PostgreSQL, com busca via HTMX e regras de negócio garantidas no banco.",
      numero: "364 testes",
      links: [
        { rotulo: "demo", href: "https://imoveldf-homolog.onrender.com" },
        { rotulo: "GitHub", href: "https://github.com/Acciolyy/imoveldf-vitrine" },
      ],
    },
    {
      ancora: "projeto-open-source",
      tipo: "open source",
      titulo: "miniclient e Excalidraw",
      texto:
        "miniclient: cliente HTTP em Python que executa JavaScript sem navegador, que meu time no Senado está adotando nos testes end-to-end. E testes contribuídos ao Excalidraw.",
      numero: "em adoção no Senado",
      links: [
        { rotulo: "miniclient", href: "https://github.com/marciomazza/miniclient" },
        { rotulo: "Excalidraw", href: "https://github.com/Acciolyy/excalidraw" },
      ],
    },
  ] satisfies OutroProjeto[],
};

// Experiência como "git log --graph": cada ramo é uma trilha; cada commit, um
// nó com data. Textos dos detalhes exatamente como fornecidos; o miniclient
// não tem data informada.
export type Commit = {
  id: string;
  ramo: string;
  titulo: string;
  papel: string;
  periodo?: string;
  detalhe: string;
};

export const experiencia: { rotulo: string; titulo: string; commits: Commit[] } = {
  rotulo: "experiência",
  titulo: "Onde isso roda em produção",
  commits: [
    {
      id: "monitoria",
      ramo: "monitoria",
      titulo: "Monitoria de SBD1",
      papel: "UnB",
      periodo: "2026.2 – atual",
      detalhe: "Monitor de Sistemas de Banco de Dados 1 na UnB.",
    },
    {
      id: "miniclient",
      ramo: "miniclient",
      titulo: "miniclient",
      papel: "open source",
      detalhe:
        "Participo do projeto open source miniclient (github.com/marciomazza/miniclient), em adoção no Senado no lugar do Playwright para testes end-to-end.",
    },
    {
      id: "senado",
      ramo: "senado",
      titulo: "Senado Federal",
      papel: "estágio em desenvolvimento backend",
      periodo: "dez/2025 – atual",
      detalhe:
        "Estágio em desenvolvimento backend na SECOM/COTI. Sistemas em Python, Django, HTMX e Alpine.js; o principal gerencia eventos legislativos e administrativos e é usado pela Secretaria de Relações Públicas e Comunicação Organizacional, pela Diretoria-Geral, pelo ILB e por fornecedores. Regras de negócio, correções em views e testes, motor de convites em Typst (PDF/SVG). Suíte de 297 testes em cerca de 15 s, com pre-commit e CI.",
    },
    {
      id: "orcestra",
      ramo: "orc'estra",
      titulo: "Orc'estra Gamificação",
      papel: "Empresa Júnior",
      periodo: "jan – jul/2025",
      detalhe: "Automações em Python com IA e um portal interno em React.",
    },
    {
      id: "unb",
      ramo: "unb",
      titulo: "UnB",
      papel: "Engenharia de Software",
      periodo: "2023 – dez/2027",
      detalhe: "Engenharia de Software, 2023 a dez/2027.",
    },
  ],
};

export const competencias = {
  rotulo: "competências",
  titulo: "Três camadas",
  grupos: [
    {
      titulo: "IA e ML",
      nivel: 1,
      itens: ["LLMs (Gemini)", "Function calling", "Agentes", "Avaliação de modelos", "PyTorch", "ONNX", "scikit-learn", "OpenCV", "Edge Impulse", "Hugging Face"],
    },
    {
      titulo: "Backend e dados",
      nivel: 2,
      itens: ["Python", "Django", "HTMX", "Alpine.js", "PostgreSQL", "Pydantic", "Pandas", "Streamlit", "React"],
    },
    {
      titulo: "Engenharia",
      nivel: 3,
      itens: ["pytest", "CI (GitHub Actions, GitLab CI)", "Docker", "Git", "Avaliação com várias sementes", "Open source"],
    },
  ],
};
