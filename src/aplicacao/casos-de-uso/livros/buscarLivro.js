import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { comResumo } from '../../../dominio/livro.js';

export function criarBuscarLivro({ repositorioLivro, repositorioAvaliacao }) {
  return async function buscarLivro(id) {
    const livro = await repositorioLivro.buscarPorId(id);
    if (!livro) throw new ErroAplicacao('Livro não encontrado.', 404);
    const resumos = await repositorioAvaliacao.resumosDosLivros([id]);
    return comResumo(livro, resumos.get(id));
  };
}
