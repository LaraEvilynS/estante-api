import crypto from 'node:crypto';

// Token aleatório para recuperação de senha. Só o hash (SHA-256) é guardado no banco.
export const servicoTokenSeguro = {
  gerar: () => crypto.randomBytes(32).toString('hex'),
  hash: (token) => crypto.createHash('sha256').update(token).digest('hex'),
};
