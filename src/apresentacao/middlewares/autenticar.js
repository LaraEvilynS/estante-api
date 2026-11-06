import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

// Exige um token JWT válido no cabeçalho "Authorization: Bearer <token>"
// e confere no banco se a sessão ainda vale (conta existente e senha não trocada depois).
export function criarAutenticar({ servicoToken, validarSessao }) {
  return async function autenticar(req, res, next) {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      return next(new ErroAplicacao('Autenticação necessária.', 401));
    }
    let dados;
    try {
      dados = servicoToken.verificar(token);
    } catch {
      return next(new ErroAplicacao('Token inválido ou expirado.', 401));
    }
    try {
      req.usuario = await validarSessao(dados);
      return next();
    } catch (erro) {
      return next(erro);
    }
  };
}

// Restringe a rota aos perfis informados (use depois de autenticar).
export function exigirPerfil(...perfis) {
  return function (req, res, next) {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      return next(new ErroAplicacao('Acesso negado.', 403));
    }
    return next();
  };
}
