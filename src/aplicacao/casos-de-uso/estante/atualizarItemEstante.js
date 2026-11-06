import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { STATUS_LEITURA } from '../../../dominio/estante.js';

export function criarAtualizarItemEstante({ repositorioItemEstante, repositorioAvaliacao }) {
  return async function atualizarItemEstante({ usuarioId, id, status }) {
    const item = await repositorioItemEstante.buscarPorId(id);
    // Item de outro usuário responde 404, como se não existisse.
    if (!item || item.usuarioId !== usuarioId) {
      throw new ErroAplicacao('Item da estante não encontrado.', 404);
    }
    // Regra: avaliação só existe para livro lido, então não dá para "desler" um livro avaliado.
    if (item.status === STATUS_LEITURA.LIDO && status !== STATUS_LEITURA.LIDO) {
      if (await repositorioAvaliacao.buscarPorUsuarioELivro(usuarioId, item.livroId)) {
        throw new ErroAplicacao('Exclua sua avaliação antes de mudar o status deste livro.', 409);
      }
    }
    return repositorioItemEstante.atualizarStatus(id, status);
  };
}
