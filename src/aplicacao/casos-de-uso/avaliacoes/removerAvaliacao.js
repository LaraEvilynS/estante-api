import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { PERFIS } from '../../../dominio/usuario.js';

export function criarRemoverAvaliacao({ repositorioAvaliacao }) {
  return async function removerAvaliacao({ usuario, id }) {
    const avaliacao = await repositorioAvaliacao.buscarPorId(id);
    if (!avaliacao) throw new ErroAplicacao('Avaliação não encontrada.', 404);
    // O dono exclui a própria; o ADMIN exclui qualquer uma (moderação).
    if (avaliacao.usuarioId !== usuario.id && usuario.perfil !== PERFIS.ADMIN) {
      throw new ErroAplicacao('Você não tem permissão para excluir esta avaliação.', 403);
    }
    await repositorioAvaliacao.remover(id);
  };
}
