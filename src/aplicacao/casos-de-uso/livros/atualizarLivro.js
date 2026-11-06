import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { comResumo } from '../../../dominio/livro.js';

export function criarAtualizarLivro({ repositorioLivro, repositorioAvaliacao }) {
  return async function atualizarLivro(id, dados) {
    if (!(await repositorioLivro.buscarPorId(id))) {
      throw new ErroAplicacao('Livro não encontrado.', 404);
    }
    if (dados.isbn) {
      const existente = await repositorioLivro.buscarPorIsbn(dados.isbn);
      if (existente && existente.id !== id) {
        throw new ErroAplicacao('Já existe um livro com este ISBN.', 409);
      }
    }
    const livro = await repositorioLivro.atualizar(id, dados);
    const resumos = await repositorioAvaliacao.resumosDosLivros([id]);
    return comResumo(livro, resumos.get(id));
  };
}
