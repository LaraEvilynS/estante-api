import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';

export function criarAdicionarNaEstante({ repositorioLivro, repositorioItemEstante }) {
  return async function adicionarNaEstante({ usuarioId, livroId, status }) {
    if (!(await repositorioLivro.buscarPorId(livroId))) {
      throw new ErroAplicacao('Livro não encontrado.', 404);
    }
    if (await repositorioItemEstante.buscarPorUsuarioELivro(usuarioId, livroId)) {
      throw new ErroAplicacao('Este livro já está na sua estante.', 409);
    }
    return repositorioItemEstante.criar({ usuarioId, livroId, status });
  };
}
