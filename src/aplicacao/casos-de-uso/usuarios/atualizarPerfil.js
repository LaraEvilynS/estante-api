import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { paraPublico } from '../../../dominio/usuario.js';

export function criarAtualizarPerfil({ repositorioUsuario }) {
  return async function atualizarPerfil({ id, nome }) {
    if (!(await repositorioUsuario.buscarPorId(id))) {
      throw new ErroAplicacao('Usuário não encontrado.', 404);
    }
    return paraPublico(await repositorioUsuario.atualizarNome(id, nome));
  };
}
