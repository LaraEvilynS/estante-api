import { ZodError } from 'zod';
import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

// Middleware global: toda falha da aplicação passa por aqui e sai no mesmo formato.
// eslint-disable-next-line no-unused-vars
export function tratadorDeErros(erro, req, res, next) {
  if (erro instanceof ErroAplicacao) {
    return res.status(erro.statusHttp).json({ erro: erro.message });
  }
  if (erro instanceof ZodError) {
    return res.status(400).json({
      erro: 'Dados inválidos.',
      detalhes: erro.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  }
  if (erro.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'JSON inválido.' });
  }
  if (erro.type === 'entity.too.large') {
    return res.status(413).json({ erro: 'Requisição muito grande.' });
  }
  console.error(erro);
  // Nunca expor detalhes internos ao cliente.
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}
