export const PERFIS = Object.freeze({ USUARIO: 'USUARIO', ADMIN: 'ADMIN' });

// Dados do usuário que podem sair da API (nunca inclui a senha).
export function paraPublico(usuario) {
  const { id, nome, email, perfil, criadoEm } = usuario;
  return { id, nome, email, perfil, criadoEm };
}
