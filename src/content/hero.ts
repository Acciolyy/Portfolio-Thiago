export const hero = {
  rotulo: "01 / INICIO",
  nome: "Thiago Viriato Accioly",
  titulo: "Desenvolvedor",
  tituloDestaque: "Python",
  pitch:
    "Construo aplicações com Django e PostgreSQL, e escrevo os testes que provam que elas continuam funcionando depois.",

  // Ficha técnica: os dados que não cabem no título.
  ficha: [
    { rotulo: "Local", itens: ["Brasília, DF"] },
    { rotulo: "Formação", itens: ["Eng. de Software, UnB", "2027"] },
    { rotulo: "Atual", itens: ["Estagiário fullstack, Senado Federal"] },
    { rotulo: "Foco", itens: ["Django", "PostgreSQL", "automação de testes"] },
    { rotulo: "Disponível", itens: ["presencial", "híbrido", "remoto"] },
  ],

  // Valores estáticos: é o que aparece sem JS, enquanto a API do GitHub não
  // responde, e se o IP estourar as 60 requisições por hora. O componente
  // Telemetry troca por dado real. Confiram de vez em quando.
  telemetria: [
    { chave: "ultimoCommit", rotulo: "Ult. commit", valor: "1d", texto: false },
    { chave: "repos", rotulo: "Repos", valor: "20", texto: false },
    { chave: "commits30d", rotulo: "Commits (30d)", valor: "89", texto: false },
    { chave: "stack", rotulo: "Stack", valor: "Python", texto: true },
  ],
} as const;
