import jwt from 'jsonwebtoken';

export function criarServicoTokenJwt({ segredo, expiracao }) {
  return {
    gerar({ id, perfil }) {
      return jwt.sign({ perfil }, segredo, { subject: id, expiresIn: expiracao, algorithm: 'HS256' });
    },
    // Lança erro se o token for inválido, adulterado ou expirado.
    verificar(token) {
      const dados = jwt.verify(token, segredo, { algorithms: ['HS256'] });
      return { id: dados.sub, perfil: dados.perfil };
    },
  };
}
