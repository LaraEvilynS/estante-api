import { Router } from 'express';
import { envolver } from './envolver.js';
import { exigirPerfil } from '../middlewares/autenticar.js';
import { PERFIS } from '../../dominio/usuario.js';
import { idParams } from '../validacoes/comuns.js';
import {
  atualizarPerfilSchema, alterarSenhaSchema, excluirContaSchema,
} from '../validacoes/usuarioSchemas.js';

export function criarRotasUsuarios({ casosDeUso, autenticar }) {
  const rotas = Router();

  // ----- Minha conta (qualquer usuário autenticado) -----
  // Estas rotas vêm antes de "/:id" para "eu" não ser tratado como um id.
  rotas.patch('/eu', autenticar, envolver(async (req, res) => {
    const { nome } = atualizarPerfilSchema.parse(req.body ?? {});
    res.status(200).json({ usuario: await casosDeUso.atualizarPerfil({ id: req.usuario.id, nome }) });
  }));

  rotas.patch('/eu/senha', autenticar, envolver(async (req, res) => {
    const dados = alterarSenhaSchema.parse(req.body ?? {});
    await casosDeUso.alterarSenha({ id: req.usuario.id, ...dados });
    res.status(200).json({ mensagem: 'Senha alterada com sucesso.' });
  }));

  rotas.delete('/eu', autenticar, envolver(async (req, res) => {
    const { senha } = excluirContaSchema.parse(req.body ?? {});
    await casosDeUso.excluirConta({ usuarioId: req.usuario.id, senha });
    res.status(204).end();
  }));

  // ----- Operações administrativas: restritas ao perfil ADMIN -----
  rotas.get('/', autenticar, exigirPerfil(PERFIS.ADMIN), envolver(async (req, res) => {
    res.status(200).json({ usuarios: await casosDeUso.listarUsuarios() });
  }));

  rotas.delete('/:id', autenticar, exigirPerfil(PERFIS.ADMIN), envolver(async (req, res) => {
    const { id } = idParams.parse(req.params);
    await casosDeUso.excluirUsuario({ id });
    res.status(204).end();
  }));

  return rotas;
}
