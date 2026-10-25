export function criarListarEstante({ repositorioItemEstante }) {
  return async function listarEstante({ usuarioId, status }) {
    return repositorioItemEstante.listarDoUsuario(usuarioId, status);
  };
}
