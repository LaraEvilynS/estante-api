import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { STATUS_LEITURA } from '../../../dominio/estante.js';

export function criarCriarAvaliacao({ repositorioLivro, repositorioItemEstante, repositorioAvaliacao }) {
  return async function criarAvaliacao({ usuarioId, livroId, nota, comentario }) {
    if (!(await repositorioLivro.buscarPorId(livroId))) {
      throw new ErroAplicacao('Livro não encontrado.', 404);
    }
    // Regra: só avalia quem marcou o livro como lido na estante.
    const item = await repositorioItemEstante.buscarPorUsuarioELivro(usuarioId, livroId);
    if (!item || item.status !== STATUS_LEITURA.LIDO) {
      throw new ErroAplicacao('Marque o livro como lido na sua estante para avaliá-lo.', 403);
    }
    // Regra: uma avaliação por usuário e livro.
    if (await repositorioAvaliacao.buscarPorUsuarioELivro(usuarioId, livroId)) {
      throw new ErroAplicacao('Você já avaliou este livro.', 409);
    }
    return repositorioAvaliacao.criar({ usuarioId, livroId, nota, comentario: comentario ?? null });
  };
}
