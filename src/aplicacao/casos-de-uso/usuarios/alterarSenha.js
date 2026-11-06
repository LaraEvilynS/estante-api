import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';

export function criarAlterarSenha({ repositorioUsuario, servicoHash }) {
  return async function alterarSenha({ id, senhaAtual, novaSenha }) {
    const usuario = await repositorioUsuario.buscarPorId(id);
    if (!usuario) throw new ErroAplicacao('Usuário não encontrado.', 404);
    // Exige a senha atual: quem só tem o token não consegue trancar o dono fora da conta.
    if (!(await servicoHash.comparar(senhaAtual, usuario.senhaHash))) {
      throw new ErroAplicacao('Senha atual incorreta.', 400);
    }
    await repositorioUsuario.atualizarSenha(id, await servicoHash.gerar(novaSenha));
  };
}
