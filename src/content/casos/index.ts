import type { EstudoDeCaso } from "./tipos";
import { agenteTriagemVagas } from "./agente-triagem-vagas";
import { iaDoZero } from "./ia-do-zero";

export const casos: EstudoDeCaso[] = [agenteTriagemVagas, iaDoZero];

export const casoPorSlug = (slug: string) => casos.find((c) => c.slug === slug);
