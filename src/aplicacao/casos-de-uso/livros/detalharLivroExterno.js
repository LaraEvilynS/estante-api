import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';

export function criarDetalharLivroExterno({ servicoLivrosExternos }) {
  return async function detalharLivroExterno(idObra) {
    const detalhes = await servicoLivrosExternos.detalharObra(idObra);
    if (!detalhes) throw new ErroAplicacao('Obra não encontrada na Open Library.', 404);
    return detalhes;
  };
}
