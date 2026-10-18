import { z } from 'zod';

const email = z
  .string({ required_error: 'E-mail é obrigatório.' })
  .trim()
  .toLowerCase()
  .email('E-mail inválido.')
  .max(254, 'E-mail muito longo.');

const novaSenha = z
  .string({ required_error: 'Senha é obrigatória.' })
  .min(8, 'A senha deve ter pelo menos 8 caracteres.')
  .max(72, 'A senha deve ter no máximo 72 caracteres.');

export const cadastroSchema = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório.' })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
  email,
  senha: novaSenha,
});

export const loginSchema = z.object({
  email,
  senha: z.string({ required_error: 'Senha é obrigatória.' }).min(1, 'Senha é obrigatória.').max(72),
});

export const esqueciSenhaSchema = z.object({ email });

export const redefinirSenhaSchema = z.object({
  token: z.string({ required_error: 'Token é obrigatório.' }).min(1, 'Token é obrigatório.').max(200),
  novaSenha,
});
