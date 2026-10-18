// Lê e valida as variáveis de ambiente na inicialização.
// Se algo essencial estiver faltando, a API não sobe e explica o motivo.
export function lerConfiguracao(env = process.env) {
  const obrigatorias = [
    'URL_BANCO_DADOS', 'SEGREDO_JWT', 'URL_FRONTEND',
    'EMAIL_HOST', 'EMAIL_REMETENTE', 'ADMIN_EMAIL', 'ADMIN_SENHA',
  ];
  const faltando = obrigatorias.filter((nome) => !env[nome]);
  if (faltando.length > 0) {
    throw new Error(
      `Variáveis de ambiente ausentes: ${faltando.join(', ')}. Copie o .env.example para .env e preencha.`,
    );
  }
  if (env.SEGREDO_JWT.length < 32) {
    throw new Error('SEGREDO_JWT deve ter pelo menos 32 caracteres.');
  }
  if (env.ADMIN_SENHA.length < 8) {
    throw new Error('ADMIN_SENHA deve ter pelo menos 8 caracteres.');
  }
  if (env.SEGREDO_JWT === 'troque_por_um_valor_longo_e_aleatorio') {
    console.warn('AVISO: SEGREDO_JWT está com o valor de exemplo. Gere um segredo próprio no .env.');
  }
  return {
    porta: Number(env.PORTA) || 3000,
    segredoJwt: env.SEGREDO_JWT,
    expiracaoJwt: env.EXPIRACAO_JWT || '1h',
    urlFrontend: env.URL_FRONTEND,
    email: {
      host: env.EMAIL_HOST,
      porta: Number(env.EMAIL_PORTA) || 1025,
      remetente: env.EMAIL_REMETENTE,
    },
    validadeTokenSenhaMinutos: Number(env.VALIDADE_TOKEN_SENHA_MINUTOS) || 30,
    admin: {
      nome: env.ADMIN_NOME || 'Administrador',
      email: env.ADMIN_EMAIL.trim().toLowerCase(),
      senha: env.ADMIN_SENHA,
    },
  };
}
