import { Router } from 'express';
import { envolver } from './envolver.js';
import { idParams } from '../validacoes/comuns.js';
import { atualizarAvaliacaoSchema } from '../validacoes/avaliacaoSchemas.js';

// Edição e exclusão de uma avaliação. A criação e a listagem ficam em /livros/:id/avaliacoes.
export function criarRotasAvaliacoes({ casosDeUso, autenticar }) {
  const rotas = Router();
  rotas.use(autenticar);

  rotas.patch('/:id', envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const dados = atualizarAvaliacaoSchema.parse(req.body ?? {});
    res.status(200).json({ avaliacao: await casosDeUso.atualizarAvaliacao({ usuario: req.usuario, id, dados }) });
  }));

  rotas.delete('/:id', envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    await casosDeUso.removerAvaliacao({ usuario: req.usuario, id });
    res.status(204).end();
  }));

  return rotas;
}
