import { z } from 'zod';

const nota = z
  .number({ required_error: 'Nota é obrigatória.', invalid_type_error: 'A nota deve ser um número.' })
  .int('A nota deve ser um número inteiro.')
  .min(1, 'A nota deve ser de 1 a 5.')
  .max(5, 'A nota deve ser de 1 a 5.');

const comentario = z.string().trim().max(2000, 'Comentário muito longo.').nullable().optional();

export const criarAvaliacaoSchema = z.object({ nota, comentario });

export const atualizarAvaliacaoSchema = z
  .object({ nota, comentario })
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, 'Informe ao menos um campo para atualizar.');
