import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';
import { paraPublico } from '../../dominio/usuario.js';

export function criarBuscarUsuarioAtual({ repositorioUsuario }) {
  return async function buscarUsuarioAtual(id) {
    const usuario = await repositorioUsuario.buscarPorId(id);
    if (!usuario) throw new ErroAplicacao('Usuário não encontrado.', 401);
    return paraPublico(usuario);
  };
}
