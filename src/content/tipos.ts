export type Link = { href: string; rotulo: string };

export type GaugeData = {
  valor: number;
  max: number;
  sufixo?: string;
  titulo: string;
  detalhe?: string;
  escala: string;
};

export type Video = { src: string; ariaLabel: string; id?: string };

// Projeto em destaque (.feature): mídia ao lado do texto.
export type Destaque = {
  rank: string;
  titulo: string;
  origem: string;
  stack: string[];
  paragrafos: string[];
  pontos?: string[];
  gauges?: GaugeData[];
  links: Link[];
  nota?: string;
  video?: Video;
};

// Projeto em card (.card): mídia opcional no topo, texto depois.
export type CardProjeto = {
  titulo: string;
  origem: string;
  texto: string;
  stack: string[];
  links: Link[];
  video?: Video;
};
