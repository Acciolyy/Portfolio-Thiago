// Galeria do "IA do zero": uma aba por algoritmo que tem GIF nos READMEs de
// github.com/Acciolyy/portfolio-ia (README.md e portfolio-2-busca-otimizacao/
// README.md). Os GIFs (docs/assets/*-dark.gif e *-light.gif) foram convertidos
// para WebM em public/projetos/ia. Descrição (alt), legenda e métrica são
// copiadas dos READMEs.

export type ItemGaleria = {
  id: string;
  aba: string;
  arquivo: string; // public/projetos/ia/<arquivo>-dark|light.webm/.jpg
  descricao: string;
  legenda: string;
  metrica: string;
};

export const galeriaIa: ItemGaleria[] = [
  {
    id: "astar",
    aba: "A* × Greedy",
    arquivo: "astar-vs-greedy",
    descricao:
      "Animação com dois grafos do campus lado a lado, A* e Greedy, de Gate até RU. Os nós expandidos aparecem numerados na ordem em que são expandidos. No fim, o A* destaca a rota Gate, Est, RU com 330 m e o Greedy destaca a rota Gate, MEsp, RU com 400 m.",
    legenda:
      "Expansão de nós de Gate até RU. O layout do grafo é automático (as distâncias das arestas aparecem em metros); não é um mapa geográfico.",
    metrica: "A*: ótimo nos 4 cenários (330, 260, 250 e 290 m) · Greedy: Gate→RU custa 400 m contra 330 m (+21%)",
  },
  {
    id: "tsp",
    aba: "Simulated Annealing",
    arquivo: "tsp-40-cidades",
    descricao:
      "Animação do TSP com 40 cidades aleatórias. À esquerda, o melhor tour do Simulated Annealing se refinando. À direita, curvas da melhor distância contra o número de avaliações para o Hill Climbing com reinícios e o Simulated Annealing com dois cronogramas de resfriamento; o cronograma 0,995 congela cedo e o 0,9998 termina próximo ao Hill Climbing com reinícios.",
    legenda:
      "TSP com 40 cidades, semente 42. Na tabela, a média de 30 sementes: o resfriamento 0,995 empata com o Hill Climbing simples; o 0,9998 empata com o Hill Climbing com reinícios.",
    metrica: "40 cidades, 30 sementes: 319,15 ± 4,95 km (resfriamento 0,9998) · 334,30 ± 10,89 km (0,995)",
  },
  {
    id: "kalman",
    aba: "Filtro de Kalman",
    arquivo: "kalman-drone",
    descricao:
      "Animação do Filtro de Kalman 2D rastreando a trajetória de um drone. Os pontos de GPS ruidoso aparecem aos poucos em torno da trajetória real, e a linha tracejada da estimativa do Kalman acompanha a trajetória real de perto. O RMSE acumulado termina em 5,64 m para o GPS e 2,38 m para o Kalman.",
    legenda: "Kalman na semente 42 (5,64 m contra 2,38 m). Em 30 sementes: 5,66 ± 0,22 m contra 2,27 ± 0,21 m.",
    metrica: "RMSE de posição: 2,27 ± 0,21 m contra 5,66 ± 0,22 m do GPS bruto (−59,8% ± 3,4)",
  },
  {
    id: "qlearning",
    aba: "Q-Learning",
    arquivo: "qlearning-grid",
    descricao:
      "Animação do Q-Learning num galpão 8 por 8. À esquerda, o caminho da política gulosa após 0, 5, 10 e até 500 episódios de treino, que passa a contornar obstáculos e a zona de risco e chega ao objetivo em 14 passos. À direita, a curva de recompensa por episódio subindo de cerca de menos 500 para cerca de 35.",
    legenda: "Q-Learning, semente 42: a política gulosa após N episódios e a curva de recompensa.",
    metrica: "14 passos, retorno 37 em 10/10 sementes (ótimo exato)",
  },
  {
    id: "kmeans",
    aba: "K-Means + PCA",
    arquivo: "wine-pca-3d",
    descricao:
      "Gráfico 3D girando com as 178 amostras do dataset Wine projetadas nas três primeiras componentes principais (66,5% da variância). Os pontos dos três cultivares formam grupos separados, com pequena sobreposição entre os cultivares 0 e 1.",
    legenda:
      "Wine: 13 atributos químicos projetados em 3 componentes. É o dado do Portfólio 4, onde o K-Means recupera os cultivares sem usar rótulos (ARI 0,8975).",
    metrica: "ARI 0,8975 · silhueta 0,285 (máximo em k=3)",
  },
];
