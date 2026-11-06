import { comResumo } from '../../../dominio/livro.js';

export function criarListarLivros({ repositorioLivro, repositorioAvaliacao }) {
  return async function listarLivros({ busca, pagina, limite }) {
    const { itens, total } = await repositorioLivro.listar({ busca, pagina, limite });
    const resumos = await repositorioAvaliacao.resumosDosLivros(itens.map((l) => l.id));
    return {
      itens: itens.map((livro) => comResumo(livro, resumos.get(livro.id))),
      pagina,
      limite,
      total,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
    };
  };
}
