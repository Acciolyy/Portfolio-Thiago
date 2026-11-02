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
  space: "https://huggingface.co/spaces/Acciolyyy/lenet5-mnist-demo",
  limiar: 0.7,
} as const;
