import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';

export function criarAtualizarAvaliacao({ repositorioAvaliacao }) {
  return async function atualizarAvaliacao({ usuario, id, dados }) {
    const avaliacao = await repositorioAvaliacao.buscarPorId(id);
    if (!avaliacao) throw new ErroAplicacao('Avaliação não encontrada.', 404);
    // Só o dono edita (nem o admin: ele apenas modera, excluindo).
    if (avaliacao.usuarioId !== usuario.id) {
      throw new ErroAplicacao('Você só pode editar a sua própria avaliação.', 403);
    }
    return repositorioAvaliacao.atualizar(id, dados);
  };
}
