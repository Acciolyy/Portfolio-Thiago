import type { EstudoDeCaso } from "./tipos";
import { agenteTriagemVagas } from "./agente-triagem-vagas";
import { portfolioIa } from "./portfolio-ia";

export const casos: EstudoDeCaso[] = [agenteTriagemVagas, portfolioIa];

export const casoPorSlug = (slug: string) => casos.find((c) => c.slug === slug);
