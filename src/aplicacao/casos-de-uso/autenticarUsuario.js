import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';
import { paraPublico } from '../../dominio/usuario.js';

export function criarAutenticarUsuario({ repositorioUsuario, servicoHash, servicoToken }) {
  return async function autenticarUsuario({ email, senha }) {
    const usuario = await repositorioUsuario.buscarPorEmail(email);
    // Compara sempre (mesmo sem usuário) para o tempo de resposta não revelar se o e-mail existe.
    const senhaCorreta = await servicoHash.comparar(senha, usuario ? usuario.senhaHash : servicoHash.hashFalso);
    if (!usuario || !senhaCorreta) {
      throw new ErroAplicacao('E-mail ou senha inválidos.', 401);
    }
    const token = servicoToken.gerar({ id: usuario.id, perfil: usuario.perfil });
    return { token, usuario: paraPublico(usuario) };
  };
}
