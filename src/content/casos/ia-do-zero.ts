import type { EstudoDeCaso } from "./tipos";

// Fonte: README.md de github.com/Acciolyy/portfolio-ia (e o card do modelo
// e o README do Space no Hugging Face).
const REPO = "https://github.com/Acciolyy/portfolio-ia";

export const iaDoZero: EstudoDeCaso = {
  slug: "ia-do-zero",
  titulo: "IA do zero: algoritmos da UnB",
  rotulo: ["estudo de caso", "ML do zero · UnB"],
  resumo:
    "Algoritmos clássicos de IA implementados do zero na disciplina de Inteligência Artificial da UnB e revisados em 2026 com várias sementes. A LeNet-5 está no Hugging Face e roda no seu navegador, aqui ao lado.",
  descricao:
    "A*, Simulated Annealing, HMM/Viterbi, filtro de Kalman e Q-Learning do zero, revisados com várias sementes, e a LeNet-5 no Hugging Face (98,74% ± 0,07 no MNIST) rodando no navegador via ONNX.",
  tags: ["Python", "NumPy", "PyTorch", "ONNX", "scikit-learn", "pytest · CI"],
  links: [
    { rotulo: "GitHub", href: REPO, cheio: true },
    { rotulo: "Modelo no Hugging Face", href: "https://huggingface.co/Acciolyyy/lenet5-mnist-unb" },
    { rotulo: "Demo no Hugging Face", href: "https://huggingface.co/spaces/Acciolyyy/lenet5-mnist-demo" },
  ],
  midia: { tipo: "demo-lenet" },
  numeros: [
    { valor: "98,74%", rotulo: "acurácia de teste da LeNet-5 no MNIST, ± 0,07 em 5 sementes", destaque: true },
    { valor: "59,8%", rotulo: "redução do erro do Kalman contra o GPS bruto, ± 3,4 em 30 trajetórias" },
    { valor: "0 de 30", rotulo: "trajetórias em que o Kalman fica pior que o GPS (antes: 7 de 30)" },
    { valor: "28", rotulo: "testes de sanidade, rodando em CI" },
  ],
  porQue: [
    "Os portfólios nasceram na disciplina Inteligência Artificial (FGA0221) da UnB, com os algoritmos implementados do zero.",
    "Em outubro de 2026 revisei o repositório inteiro no estilo de uma revisão de código sênior: refiz as conclusões com várias sementes e corrigi o que não se sustentava. A LeNet-5 também está no Hugging Face, com uma demo que roda a rede inteira no navegador.",
  ],
  fluxo: {
    rotulo: "Da LeNet-5 treinada à demo no navegador",
    passos: [
      { titulo: "Treino", texto: "PyTorch no MNIST: 55 mil treino, 5 mil validação e 10 mil teste, avaliado uma vez por execução." },
      { titulo: "Exportação", texto: "Os pesos viram model.onnx; um script confere PyTorch contra ONNX Runtime em 1.000 imagens." },
      { titulo: "Hugging Face", texto: "O modelo vai para o Hub, com card, métricas e a demo num Space." },
      { titulo: "Pré-processamento em JS", texto: "O mesmo recorte, centralização e normalização do app em Python, portado para JavaScript.", destaque: true },
      { titulo: "Paridade", texto: "Um teste compara o tensor e a classe do JavaScript com os do Python em 20 imagens." },
    ],
  },
  decisoes: [
    {
      escolha: "Validação separada do teste na LeNet-5",
      motivo:
        "5 mil amostras saem do treino para validação, e o teste só é avaliado no fim, uma vez por execução. O número antigo vinha de um conjunto que acompanhou o treino.",
      alternativa: "Usar o teste como validação a cada época (a versão antiga, com 98,90%).",
    },
    {
      escolha: "Ruído de processo bloco-diagonal no Kalman",
      motivo:
        "As acelerações de X e Y são independentes, então a covariância do ruído de processo é por eixo, e o resultado fica estável entre sementes. A atualização de P usa a forma de Joseph, que a mantém simétrica e semidefinida positiva.",
      alternativa: "Uma matriz Q de posto 1, que acoplava os eixos (a versão antiga).",
    },
    {
      escolha: "A* que recusa heurística inadmissível",
      motivo:
        "A otimalidade do A* depende da admissibilidade. A busca recusa objetivos com h(objetivo) ≠ 0, e um teste confere a tabela contra Dijkstra.",
      alternativa: "Reutilizar a tabela de heurística do RU para outro destino, como antes.",
    },
    {
      escolha: "Várias sementes em cada conclusão",
      motivo:
        "Média ± desvio amostral sobre as sementes indicadas. A semente 42 era favorável ao Kalman e escondia a instabilidade, e a vantagem do Viterbi sobre o Forward era ruído.",
      alternativa: "Uma execução por experimento.",
    },
    {
      escolha: "Testes de sanidade contra referências exatas",
      motivo:
        "A* contra Dijkstra, Viterbi contra busca exaustiva, rede bayesiana contra enumeração, caminho do Q-Learning contra BFS: cada implementação própria tem uma resposta conhecida para bater.",
      alternativa: "Conferir os resultados a olho.",
    },
    {
      escolha: "Demo no navegador via ONNX",
      motivo:
        "O model.onnx é baixado do Hugging Face e a rede roda inteira no cliente, sem servidor, com o pré-processamento validado por testes de paridade.",
      alternativa: "Um app Gradio em Python, que também está no repositório.",
    },
  ],
  resultado: {
    texto:
      "A revisão trocou números de uma execução por médias sobre várias sementes. No MNIST o número caiu, porque o antigo tinha vazamento; no Kalman subiu, porque o antigo tinha um erro de modelagem.",
    legenda: "antes e depois da revisão · em %",
    barras: [
      { rotulo: "LeNet-5, antes", base: "um treino, teste usado como validação", valor: 98.9, texto: "98,90%" },
      { rotulo: "LeNet-5, depois", base: "5 sementes, teste avaliado uma vez", valor: 98.74, texto: "98,74%", destaque: true },
      { rotulo: "Kalman, antes", base: "redução de erro contra o GPS · instável", valor: 27, texto: "27%" },
      { rotulo: "Kalman, depois", base: "redução de erro · 30 trajetórias", valor: 59.8, texto: "59,8%", destaque: true },
    ],
    nota: "Antes da revisão o Kalman era pior que o GPS em 7 de 30 sementes; depois, em nenhuma.",
  },
  erros: [
    {
      titulo: "Vazamento de validação no MNIST",
      principal: true,
      texto:
        "O teste servia de validação a cada época, e o 98,90% vinha de um conjunto que acompanhou o treino. Com validação separada e 5 sementes, o número confiável é 98,74% ± 0,07.",
    },
    {
      titulo: "Ruído de processo acoplado no Kalman",
      texto:
        "A matriz Q de posto 1 acoplava as acelerações de X e Y. A semente 42 dava 2,35 m e escondia o problema: em 30 sementes, o RMSE era 4,13 ± 2,05 m, pior que o GPS em 7. Com Q bloco-diagonal, 2,27 ± 0,21 m e 59,8% ± 3,4 de redução.",
    },
    {
      titulo: "Heurística inadmissível no A*",
      texto:
        "A tabela de heurística do RU foi reutilizada para outro destino, com estimativas maiores que o custo real (245 contra 100). A rota certa naquele cenário era coincidência.",
    },
    {
      titulo: "Conclusões de uma execução só",
      texto:
        "Viterbi contra Forward, o Simulated Annealing \"mais robusto\" e o DFS \"mais rápido\" vinham de uma semente ou de uma medição. Refeitas com várias sementes ou com a mediana de 2.000 execuções, as diferenças desapareceram.",
    },
  ],
  proximos: [],
  repositorio: REPO,
};
