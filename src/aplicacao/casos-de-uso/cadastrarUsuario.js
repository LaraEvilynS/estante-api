import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';
import { PERFIS, paraPublico } from '../../dominio/usuario.js';

export function criarCadastrarUsuario({ repositorioUsuario, servicoHash }) {
  return async function cadastrarUsuario({ nome, email, senha }) {
    if (await repositorioUsuario.buscarPorEmail(email)) {
      throw new ErroAplicacao('E-mail já cadastrado.', 409);
    }
    const senhaHash = await servicoHash.gerar(senha);
    // O perfil nunca vem do cliente: todo cadastro público é USUARIO.
    const usuario = await repositorioUsuario.criar({ nome, email, senhaHash, perfil: PERFIS.USUARIO });
    return paraPublico(usuario);
  };
}
