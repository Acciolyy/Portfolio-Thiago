export const site = {
  nome: "Thiago Accioly",
  titulo: "Thiago Viriato Accioly, Desenvolvedor Python",
  descricao:
    "Desenvolvedor Python. Construo aplicações com Django, HTMX e PostgreSQL, e escrevo os testes que provam que elas continuam funcionando depois.",
  descricaoOg:
    "Django, HTMX, PostgreSQL e pytest. Projetos com o problema que apareceu no caminho e o que eu fiz para resolver.",
  imagemOg: "/images/eu-imagem.jpg",
  email: "thiagoacciolyest@gmail.com",
  local: "Brasília, DF",
  ano: 2026,
} as const;

// Seções da Home, na ordem do cabeçalho.
export const nav = [
  { href: "#projetos", rotulo: "projetos" },
  { href: "#experiencia", rotulo: "experiência" },
  { href: "#competencias", rotulo: "competências" },
  { href: "#contato", rotulo: "contato" },
] as const;

export type LinkPerfil = { rotulo: string; href: string; externo: boolean };

// Os mesmos quatro botões no topo e no contato.
export const perfis: LinkPerfil[] = [
  { rotulo: "GitHub", href: "https://github.com/Acciolyy", externo: true },
  { rotulo: "LinkedIn", href: "https://www.linkedin.com/in/thiago-viriato-accioly", externo: true },
  { rotulo: "Hugging Face", href: "https://huggingface.co/Acciolyyy", externo: true },
  { rotulo: "Currículo (PDF)", href: "/curriculo-thiago-accioly.pdf", externo: false },
];

export const contato = {
  rotulo: "contato",
  titulo: ["Vagas de AI Engineer", "e backend Python"],
} as const;
