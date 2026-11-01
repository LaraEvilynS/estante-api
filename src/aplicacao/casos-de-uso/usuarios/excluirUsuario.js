import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { PERFIS } from '../../../dominio/usuario.js';

// Exclusão feita por um administrador (moderação).
export function criarExcluirUsuario({ repositorioUsuario }) {
  return async function excluirUsuario({ id }) {
    const usuario = await repositorioUsuario.buscarPorId(id);
    if (!usuario) throw new ErroAplicacao('Usuário não encontrado.', 404);
    if (usuario.perfil === PERFIS.ADMIN) {
      throw new ErroAplicacao('Contas de administrador não podem ser excluídas.', 403);
    }
    await repositorioUsuario.remover(id);
  };
}
