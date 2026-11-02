// Estrutura de um estudo de caso (prancha Projeto). Todos os estudos de caso
// usam o mesmo template: components/caso/EstudoDeCaso.tsx.

export type LinkCaso = { rotulo: string; href: string; cheio?: boolean };

export type Midia =
  | { tipo: "video"; src: string; poster: string; descricao: string; legenda: string }
  | { tipo: "demo-lenet" };

export type NumeroResumo = { valor: string; rotulo: string; destaque?: boolean };
export type Passo = { titulo: string; texto: string; destaque?: boolean };
export type Decisao = { escolha: string; motivo: string; alternativa: string };
export type Barra = { rotulo: string; base: string; valor: number; texto: string; destaque?: boolean };
export type Licao = { titulo: string; texto: string; principal?: boolean };

export type EstudoDeCaso = {
  slug: string;
  titulo: string;
  rotulo: [string, string];
  resumo: string;
  // Uma frase para o <meta description> e o Open Graph.
  descricao: string;
  tags: string[];
  links: LinkCaso[];
  midia: Midia;
  numeros: NumeroResumo[];
  porQue: string[];
  fluxo: { rotulo: string; passos: Passo[] };
  decisoes: Decisao[];
  resultado: { texto: string; legenda: string; barras: Barra[]; nota?: string };
  erros: Licao[];
  proximos: string[];
  repositorio: string;
};
