import type { GaugeData } from "./tipos";

export const sobre = {
  rotulo: "02 / SOBRE",
  foto: {
    src: "/images/eu-imagem.jpg",
    alt: "Thiago Viriato Accioly",
    legenda: "Brasília, DF",
  },
  paragrafos: [
    "Python foi minha primeira linguagem. Eu já me interessava por IA antes de saber programar, e foi por aí que entrei.",
    "Gosto de entender o sistema inteiro antes de mexer numa parte dele. Foi assim que acabei caindo em testes: para automatizar um fluxo eu precisava entender a arquitetura, o banco e as regras de negócio. O hábito virou a forma como eu programo.",
    "Sobre otimização: se existe um jeito mais simples que serve ao mesmo propósito, eu troco. Não gosto de sistema lento, nem de suíte de teste lenta.",
  ],
} as const;

// Transcrito do REPL. Cada trecho é um nó do <code> original:
//   ps  = prompt ">>> "            (aparece em 90 ms)
//   cmd = comando                  (digitado caractere a caractere)
//   out = saída ou quebra de linha (aparece de uma vez)
export type TrechoTerminal = { t: "ps" | "cmd" | "out"; texto: string };

export const terminal: TrechoTerminal[] = [
  { t: "ps", texto: ">>> " },
  { t: "cmd", texto: "import thiago" },
  { t: "out", texto: "\n" },
  { t: "ps", texto: ">>> " },
  { t: "cmd", texto: "thiago.stack()" },
  {
    t: "out",
    texto: "\n['Django', 'PostgreSQL', 'Playwright', 'pytest', 'Gemini API']\n\n",
  },
  { t: "ps", texto: ">>> " },
  { t: "cmd", texto: "thiago.testes_no_senado()" },
  {
    t: "out",
    texto: "\n297 testes automatizados, ~15s, gate de qualidade no GitLab CI\n\n",
  },
  { t: "ps", texto: ">>> " },
  { t: "cmd", texto: "help(thiago)" },
  {
    t: "out",
    texto:
      "\nDesenvolvedor Backend Python. Testa o que constrói.\nVeja thiago.projetos() ou digite 'sobre'.\n\n",
  },
  { t: "ps", texto: ">>> " },
  { t: "cmd", texto: "thiago.projetos()" },
  {
    t: "out",
    texto: "\n['ImóvelDF', 'Agente de Triagem', 'Dashboard Salarial', 'Cell-Detector']",
  },
];

export const gaugesSobre: GaugeData[] = [
  {
    valor: 297,
    max: 400,
    titulo: "testes automatizados no Senado",
    escala: "escala 0 a 400",
  },
  {
    valor: 15,
    max: 40,
    sufixo: "s",
    titulo: "tempo de execução",
    detalhe: "gate de qualidade no GitLab CI",
    escala: "escala 0 a 40 segundos",
  },
];
