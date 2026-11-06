import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';

export function criarListarAvaliacoesDoLivro({ repositorioLivro, repositorioAvaliacao }) {
  return async function listarAvaliacoesDoLivro(livroId) {
    if (!(await repositorioLivro.buscarPorId(livroId))) {
      throw new ErroAplicacao('Livro não encontrado.', 404);
    }
    return repositorioAvaliacao.listarDoLivro(livroId);
  };
}
