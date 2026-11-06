// Junta o livro com o resumo das avaliações (média de 1 casa decimal e total).
export function comResumo(livro, resumo) {
  return {
    ...livro,
    mediaNota: resumo ? Math.round(resumo.media * 10) / 10 : null,
    totalAvaliacoes: resumo ? resumo.total : 0,
  };
}
