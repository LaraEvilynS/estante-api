import { z } from 'zod';

const novaSenha = z
  .string({ required_error: 'A nova senha é obrigatória.' })
  .min(8, 'A nova senha deve ter pelo menos 8 caracteres.')
  .max(72, 'A nova senha deve ter no máximo 72 caracteres.');

export const atualizarPerfilSchema = z.object({
  nome: z
    .string({ required_error: 'Nome é obrigatório.' })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(100, 'O nome deve ter no máximo 100 caracteres.'),
});

export const alterarSenhaSchema = z.object({
  senhaAtual: z.string({ required_error: 'A senha atual é obrigatória.' }).min(1, 'A senha atual é obrigatória.').max(72),
  novaSenha,
});

export const excluirContaSchema = z.object({
  senha: z.string({ required_error: 'Informe a senha para confirmar.' }).min(1, 'Informe a senha para confirmar.').max(72),
});
