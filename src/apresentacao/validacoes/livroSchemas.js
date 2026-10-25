import { z } from 'zod';

const isbn = z
  .string()
  .trim()
  .transform((s) => s.replace(/[-\s]/g, '').toUpperCase())
  .refine((s) => /^(\d{10}|\d{13}|\d{9}X)$/.test(s), 'ISBN inválido (use 10 ou 13 dígitos).');

const campos = {
  titulo: z.string({ required_error: 'Título é obrigatório.' }).trim().min(1, 'Título é obrigatório.').max(200, 'Título muito longo.'),
  autor: z.string({ required_error: 'Autor é obrigatório.' }).trim().min(1, 'Autor é obrigatório.').max(200, 'Autor muito longo.'),
  isbn: isbn.nullable().optional(),
  urlCapa: z
    .string()
    .trim()
    .max(500, 'URL da capa muito longa.')
    .url('URL da capa inválida.')
    .refine((u) => /^https?:\/\//i.test(u), 'A URL da capa deve começar com http ou https.')
    .nullable()
    .optional(),
  paginas: z
    .number({ invalid_type_error: 'Páginas deve ser um número.' })
    .int('Páginas deve ser um número inteiro.')
    .positive('Páginas deve ser maior que zero.')
    .max(20000, 'Número de páginas inválido.')
    .nullable()
    .optional(),
  genero: z.string().trim().max(80, 'Gênero muito longo.').nullable().optional(),
  sinopse: z.string().trim().max(5000, 'Sinopse muito longa.').nullable().optional(),
};

export const criarLivroSchema = z.object(campos);

export const atualizarLivroSchema = z
  .object(campos)
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, 'Informe ao menos um campo para atualizar.');

export const listarLivrosQuery = z.object({
  busca: z.string().trim().max(100).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(50).default(12),
});
