import { ZodError } from 'zod';
import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

const ERROS_DO_BANCO = {
  P2002: { status: 409, mensagem: 'Já existe um registro com estes dados.' },
  P2003: { status: 409, mensagem: 'Operação não permitida: há dados relacionados.' },
  P2023: { status: 400, mensagem: 'Identificador inválido.' },
  P2025: { status: 404, mensagem: 'Registro não encontrado.' },
};

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
  // Erros conhecidos do banco (Prisma): viram respostas claras em vez de um 500 genérico.
  const erroDoBanco = ERROS_DO_BANCO[erro.code];
  if (erroDoBanco) {
    return res.status(erroDoBanco.status).json({ erro: erroDoBanco.mensagem });
  }
  console.error(erro);
  // Nunca expor detalhes internos ao cliente.
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
}
