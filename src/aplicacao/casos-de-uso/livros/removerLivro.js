import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';

export function criarRemoverLivro({ repositorioLivro }) {
  return async function removerLivro(id) {
    if (!(await repositorioLivro.buscarPorId(id))) {
      throw new ErroAplicacao('Livro não encontrado.', 404);
    }
    // As avaliações e os itens de estante do livro saem junto (exclusão em cascata no banco).
    await repositorioLivro.remover(id);
  };
}
