import { z } from 'zod';
import { LISTA_STATUS } from '../../dominio/estante.js';

const status = z.enum(LISTA_STATUS, {
  errorMap: () => ({ message: `Status inválido. Use: ${LISTA_STATUS.join(', ')}.` }),
});

export const adicionarEstanteSchema = z.object({
  livroId: z.string({ required_error: 'livroId é obrigatório.' }).uuid('livroId inválido.'),
  status,
});

export const atualizarEstanteSchema = z.object({ status });

export const listarEstanteQuery = z.object({ status: status.optional() });
