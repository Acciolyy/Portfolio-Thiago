export const site = {
  nome: "Thiago Viriato Accioly",
  titulo: "Thiago Viriato Accioly, Desenvolvedor Python",
  descricao:
    "Desenvolvedor Python. Construo aplicações com Django, HTMX e PostgreSQL, e escrevo os testes que provam que elas continuam funcionando depois.",
  descricaoOg:
    "Django, HTMX, PostgreSQL e pytest. Projetos com o problema que apareceu no caminho e o que eu fiz para resolver.",
  imagemOg: "/images/eu-imagem.jpg",
  rodape: "© 2026 Thiago Viriato Accioly.",
} as const;

export const nav = [
  { href: "#inicio", rotulo: "Início" },
  { href: "#sobre", rotulo: "Sobre" },
  { href: "#projetos", rotulo: "Projetos" },
  { href: "#outros-interesses", rotulo: "Outros Interesses" },
  { href: "#contato", rotulo: "Contato" },
] as const;

export const contato = {
  titulo: "Vamos conversar",
  texto:
    "Procuro vagas de Desenvolvedor Python, Back-End ou Full-Stack. Moro em Brasília e atendo presencial ou híbrido aqui, e remoto para fora.",
  links: [
    {
      k: "GitHub",
      v: "Acciolyy",
      href: "https://github.com/Acciolyy",
      externo: true,
    },
    {
      k: "LinkedIn",
      v: "thiago-viriato-accioly",
      href: "https://www.linkedin.com/in/thiago-viriato-accioly",
      externo: true,
    },
    {
      k: "E-mail",
      v: "thiagoacciolyest@gmail.com",
      href: "mailto:thiagoacciolyest@gmail.com",
      externo: false,
    },
  ],
} as const;
