// Busca livros na API externa (Open Library) para o administrador preencher o cadastro.
export function criarBuscarLivrosExternos({ servicoLivrosExternos }) {
  return async function buscarLivrosExternos(titulo) {
    return servicoLivrosExternos.buscarPorTitulo(titulo);
  };
}
