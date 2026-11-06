import { ErroAplicacao } from '../../../dominio/erros/ErroAplicacao.js';
import { comResumo } from '../../../dominio/livro.js';

export function criarCriarLivro({ repositorioLivro }) {
  return async function criarLivro(dados) {
    if (dados.isbn && (await repositorioLivro.buscarPorIsbn(dados.isbn))) {
      throw new ErroAplicacao('Já existe um livro com este ISBN.', 409);
    }
    return comResumo(await repositorioLivro.criar(dados), null);
  };
}
