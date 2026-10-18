import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

// Exige um token JWT válido no cabeçalho "Authorization: Bearer <token>".
export function criarAutenticar(servicoToken) {
  return function autenticar(req, res, next) {
    const [tipo, token] = (req.headers.authorization || '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      return next(new ErroAplicacao('Autenticação necessária.', 401));
    }
    try {
      req.usuario = servicoToken.verificar(token);
      return next();
    } catch {
      return next(new ErroAplicacao('Token inválido ou expirado.', 401));
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
