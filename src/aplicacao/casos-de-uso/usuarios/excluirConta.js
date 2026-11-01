import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { PERFIS } from '../../../dominio/usuario.js';

export function criarExcluirConta({ repositorioUsuario, servicoHash }) {
  return async function excluirConta({ usuarioId, senha }) {
    const usuario = await repositorioUsuario.buscarPorId(usuarioId);
    if (!usuario) throw new ErroAplicacao('Usuário não encontrado.', 404);
    // Regra: o sistema nunca fica sem administrador.
    if (usuario.perfil === PERFIS.ADMIN) {
      throw new ErroAplicacao('Contas de administrador não podem ser excluídas.', 403);
    }
    if (!(await servicoHash.comparar(senha, usuario.senhaHash))) {
      throw new ErroAplicacao('Senha incorreta.', 400);
    }
    // As avaliações, itens de estante e tokens da conta saem junto (cascata no banco).
    await repositorioUsuario.remover(usuarioId);
  };
}
