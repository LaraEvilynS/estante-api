import { Router } from 'express';
import { envolver } from './envolver.js';
import { idParams } from '../validacoes/comuns.js';
import {
  adicionarEstanteSchema, atualizarEstanteSchema, listarEstanteQuery,
} from '../validacoes/estanteSchemas.js';

// Toda a estante é pessoal: exige login e só enxerga os itens do próprio usuário.
export function criarRotasEstante({ casosDeUso, autenticar }) {
  const rotas = Router();
  rotas.use(autenticar);

  rotas.get('/', envolver(async (req, res) => {
    const { status } = listarEstanteQuery.parse(req.query);
    res.status(200).json({ itens: await casosDeUso.listarEstante({ usuarioId: req.usuario.id, status }) });
  }));

  rotas.post('/', envolver(async (req, res) => {
    const dados = adicionarEstanteSchema.parse(req.body ?? {});
    const item = await casosDeUso.adicionarNaEstante({ usuarioId: req.usuario.id, ...dados });
    res.status(201).json({ item });
  }));

  rotas.patch('/:id', envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const { status } = atualizarEstanteSchema.parse(req.body ?? {});
    res.status(200).json({ item: await casosDeUso.atualizarItemEstante({ usuarioId: req.usuario.id, id, status }) });
  }));

  rotas.delete('/:id', envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    await casosDeUso.removerItemEstante({ usuarioId: req.usuario.id, id });
    res.status(204).end();
  }));

  return rotas;
}
