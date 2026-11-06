import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

// Confere, a cada requisição autenticada, se a sessão ainda vale:
// - a conta precisa existir (token de conta excluída é recusado);
// - o token não pode ser anterior à última troca de senha;
// - o perfil vem do banco, não do token (um perfil revogado vale na hora).
export function criarValidarSessao({ repositorioUsuario }) {
  return async function validarSessao({ id, emitidoEm }) {
    const usuario = await repositorioUsuario.buscarPorId(id);
    if (!usuario) {
      throw new ErroAplicacao('Sessão inválida. Entre novamente.', 401);
    }
    if (usuario.senhaAlteradaEm && emitidoEm < usuario.senhaAlteradaEm.getTime()) {
      throw new ErroAplicacao('Sessão expirada. Entre novamente.', 401);
    }
    return { id: usuario.id, perfil: usuario.perfil };
  };
}
