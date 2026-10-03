import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

// Middleware global: toda falha da aplicação passa por aqui.
// eslint-disable-next-line no-unused-vars
export function tratadorDeErros(erro, req, res, next) {
  if (erro instanceof ErroAplicacao) {
    return res.status(erro.statusHttp).json({ erro: erro.message });
  }
  console.error(erro);
  // Nunca expor detalhes internos ao cliente.
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}
