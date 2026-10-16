import type { CardProjeto, Destaque } from "./tipos";

// As imagens moram no repo do portfolio-ia, servidas pelo raw.githubusercontent.
const RAW = "https://raw.githubusercontent.com/Acciolyy/portfolio-ia/master/portfolio-4-machine-learning/imagens/";

export const slidesIA = [
  {
    src: RAW + "p3_policy_path.png",
    alt: "Grid do labirinto com a política aprendida e o caminho de 14 passos marcado",
    legenda: "Q-Learning encontra o caminho ótimo de 14 passos no grid",
  },
  {
    src: RAW + "p4_training_curves.png",
    alt: "Curvas de perda e acurácia de treino e validação da CNN, lado a lado",
    legenda: "CNN converge sem overfitting: treino e validação lado a lado",
  },
  {
    src: RAW + "p2_clusters_pca.png",
    alt: "Dispersão dos vinhos em duas componentes principais, colorida por cluster",
    legenda: "Clusters de vinho descobertos sem rótulo, via PCA",
  },
  {
    src: RAW + "p4_confusion_matrix.png",
    alt: "Matriz de confusão 10 por 10 da CNN sobre os dígitos do MNIST",
    legenda: "Matriz de confusão da CNN no MNIST",
  },
] as const;

export const outrosInteresses = {
  rotulo: "05 / OUTROS INTERESSES",

  detector: {
    rank: "Em destaque",
    titulo: "Detector de uso de celular",
    origem: "prática",
    stack: ["Python", "OpenCV", "Edge Impulse", "NumPy"],
    paragrafos: [
      "A latência que o modelo reportava era de 1 ms, mas o sistema entregava de 3 a 8 quadros por segundo. Investigando, achei três causas escondidas atrás de uma métrica que só media a rede neural: a câmera limitando a entrega, um laço de extração de features não vetorizado, e a exibição de vídeo consumindo boa parte do tempo.",
      "No caminho apareceu um segundo problema. As caixas de detecção estavam mal mapeadas sempre que o objeto saía do centro da imagem. Depois de corrigir, deu para isolar a limitação real do modelo: ele detecta bem com o celular perto da orelha e falha em outras posições, sinal de que o dataset super-representa uma única pose.",
    ],
    links: [
      {
        href: "https://github.com/Acciolyy/Cell-Detector",
        rotulo: "github.com/Acciolyy/Cell-Detector",
      },
    ],
    video: {
      id: "video-destaque",
      src: "/videos/destaque.webm",
      ariaLabel:
        "Detecção de uso de celular rodando em tempo real sobre vídeo de webcam",
    },
  } satisfies Destaque,

  portfolioIA: {
    rank: "Em destaque",
    titulo: "Portfólio de IA e Machine Learning",
    origem: "acadêmico",
    stack: ["Python", "PyTorch", "scikit-learn", "NumPy"],
    paragrafos: [
      "Implementações dos quatro paradigmas de ML: supervisionado, não supervisionado, reforço e deep learning. Inclui uma CNN com 98,9% de acurácia em PyTorch, redes bayesianas, HMM, filtro de Kalman e métodos clássicos de busca e otimização.",
    ],
    links: [
      {
        href: "https://github.com/Acciolyy/portfolio-ia",
        rotulo: "github.com/Acciolyy/portfolio-ia",
      },
    ],
  } satisfies Destaque,

  cards: [
    {
      titulo: "Agente de Triagem de Vagas com IA",
      origem: "necessidade própria",
      texto:
        "Eu estava me candidatando a dezenas de vagas remotas e cansei de rolar site atrás de site. Construí um agente em Python com a API do Gemini e function calling para filtrar vagas por critérios em linguagem natural. Comecei consumindo a API do RemoteOK e percebi que os resultados eram bons demais. Era um dataset chamariz, servido para quem não tem contrato. Migrei para o RSS do We Work Remotely.",
      stack: ["Python", "Streamlit", "Gemini API", "Function Calling"],
      links: [
        {
          href: "https://github.com/Acciolyy/agente-triagem-vagas",
          rotulo: "github.com/Acciolyy/agente-triagem-vagas",
        },
      ],
      video: {
        src: "/videos/agente.webm",
        ariaLabel:
          "Agente de triagem em uso: critérios de vaga escritos em linguagem natural na barra lateral e busca de vagas remotas",
      },
    },
    {
      titulo: "Dashboard de Análise Salarial",
      origem: "prática",
      texto:
        "Ferramenta de BI sobre mais de 130 mil registros do mercado de tecnologia, com Pandas e Plotly. Integra dados em tempo real da API da Adzuna com cache de 24h para respeitar o limite de requisições, e continua funcionando se a API externa cair.",
      stack: ["Python", "Pandas", "Plotly", "Streamlit", "Adzuna API"],
      links: [
        { href: "https://tech-salary-insights.streamlit.app/", rotulo: "demo ao vivo" },
        {
          href: "https://github.com/Acciolyy/Dashboard-Salarios",
          rotulo: "github.com/Acciolyy/Dashboard-Salarios",
        },
      ],
      video: {
        src: "/videos/dashboard.webm",
        ariaLabel:
          "Dashboard de salários em uso: filtros por ano e senioridade à esquerda, métricas gerais e gráficos à direita",
      },
    },
  ] satisfies CardProjeto[],
};
