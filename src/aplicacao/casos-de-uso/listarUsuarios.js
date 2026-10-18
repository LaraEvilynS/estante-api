import { paraPublico } from '../../dominio/usuario.js';

export function criarListarUsuarios({ repositorioUsuario }) {
  return async function listarUsuarios() {
    const usuarios = await repositorioUsuario.listar();
    return usuarios.map(paraPublico);
  };
}
