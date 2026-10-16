export const nota = {
  rotulo: "03 / NEM TUDO É O QUE PARECE",
  paragrafos: [
    "No Senado, eu estava testando uma feature nova de geração de documentos em Typst, e o resultado saía visualmente quebrado. Fui atrás da causa: parte eram campos obrigatórios que ainda não tinham sido populados naquele ambiente de teste, parte eram campos opcionais que, na prática, deveriam ser obrigatórios. Nos dois casos, o motivo de fundo era o mesmo: nada ali tinha fallback para a ausência de dado.",
    "Desde então eu investigo a razão antes de concluir a causa. Foi isso que me fez achar, semanas depois, um bug de mapeamento de coordenada escondido atrás de uma métrica que media a coisa errada.",
  ],
  // O raciocínio em três linhas, do jeito que eu anotaria no código.
  anotacao: [
    "# sintoma: renderização quebrada",
    "# causa: obrigatório vazio + opcional que devia ser obrigatório",
    "# raiz comum: sem fallback pra ausência de dado",
  ],
} as const;
