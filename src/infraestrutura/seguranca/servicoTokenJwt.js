import jwt from 'jsonwebtoken';

export function criarServicoTokenJwt({ segredo, expiracao }) {
  return {
    gerar({ id, perfil }) {
      // "emitidoEm" (em ms) é mais preciso que o "iat" padrão (em segundos) e permite
      // invalidar sessões antigas depois de uma troca de senha.
      return jwt.sign({ perfil, emitidoEm: Date.now() }, segredo, {
        subject: id,
        expiresIn: expiracao,
        algorithm: 'HS256',
      });
    },
    // Lança erro se o token for inválido, adulterado ou expirado.
    verificar(token) {
      const dados = jwt.verify(token, segredo, { algorithms: ['HS256'] });
      return { id: dados.sub, perfil: dados.perfil, emitidoEm: dados.emitidoEm ?? dados.iat * 1000 };
    },
  };
}
