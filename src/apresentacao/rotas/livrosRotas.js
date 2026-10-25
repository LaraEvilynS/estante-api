import { Router } from 'express';
import { envolver } from './envolver.js';
import { exigirPerfil } from '../middlewares/autenticar.js';
import { PERFIS } from '../../dominio/usuario.js';
import { idParams } from '../validacoes/comuns.js';
import { criarLivroSchema, atualizarLivroSchema, listarLivrosQuery } from '../validacoes/livroSchemas.js';
import { criarAvaliacaoSchema } from '../validacoes/avaliacaoSchemas.js';

export function criarRotasLivros({ casosDeUso, autenticar }) {
  const rotas = Router();
  const somenteAdmin = [autenticar, exigirPerfil(PERFIS.ADMIN)];

  // Catálogo público: qualquer pessoa pode listar e consultar.
  rotas.get('/', envolver(async (req, res) => {
    res.status(200).json(await casosDeUso.listarLivros(listarLivrosQuery.parse(req.query)));
  }));

  rotas.get('/:id', envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.status(200).json({ livro: await casosDeUso.buscarLivro(id) });
  }));

  // Gestão do catálogo: só ADMIN.
  rotas.post('/', ...somenteAdmin, envolver(async (req, res) => {
    const dados = criarLivroSchema.parse(req.body ?? {});
    res.status(201).json({ livro: await casosDeUso.criarLivro(dados) });
  }));

  rotas.patch('/:id', ...somenteAdmin, envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const dados = atualizarLivroSchema.parse(req.body ?? {});
    res.status(200).json({ livro: await casosDeUso.atualizarLivro(id, dados) });
  }));

  rotas.delete('/:id', ...somenteAdmin, envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    await casosDeUso.removerLivro(id);
    res.status(204).end();
  }));

  // Avaliações de um livro
  rotas.get('/:id/avaliacoes', envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    res.status(200).json({ avaliacoes: await casosDeUso.listarAvaliacoesDoLivro(id) });
  }));

  rotas.post('/:id/avaliacoes', autenticar, envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    const dados = criarAvaliacaoSchema.parse(req.body ?? {});
    const avaliacao = await casosDeUso.criarAvaliacao({ usuarioId: req.usuario.id, livroId: id, ...dados });
    res.status(201).json({ avaliacao });
  }));

  return rotas;
}
