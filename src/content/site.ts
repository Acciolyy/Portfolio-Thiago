export const site = {
  nome: "Thiago Accioly",
  // Título e descrição: o posicionamento e a frase do topo da Home.
  titulo: "Thiago Accioly · Desenvolvedor Python Backend · IA aplicada",
  descricao:
    "Desenvolvedor Python Backend · IA aplicada: LLMs, agentes e Machine Learning. Construo o backend e a camada de IA que roda sobre ele.",
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
  titulo: "Abrir canal",
} as const;
