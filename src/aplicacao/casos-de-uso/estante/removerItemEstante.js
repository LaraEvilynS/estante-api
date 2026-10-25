import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';

export function criarRemoverItemEstante({ repositorioItemEstante, repositorioAvaliacao }) {
  return async function removerItemEstante({ usuarioId, id }) {
    const item = await repositorioItemEstante.buscarPorId(id);
    if (!item || item.usuarioId !== usuarioId) {
      throw new ErroAplicacao('Item da estante não encontrado.', 404);
    }
    if (await repositorioAvaliacao.buscarPorUsuarioELivro(usuarioId, item.livroId)) {
      throw new ErroAplicacao('Exclua sua avaliação antes de remover este livro da estante.', 409);
    }
    await repositorioItemEstante.remover(id);
  };
}
