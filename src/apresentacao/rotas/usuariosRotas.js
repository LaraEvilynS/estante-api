import { Router } from 'express';
import { envolver } from './envolver.js';
import { exigirPerfil } from '../middlewares/autenticar.js';
import { PERFIS } from '../../dominio/usuario.js';

// Operações administrativas: restritas ao perfil ADMIN.
export function criarRotasUsuarios({ casosDeUso, autenticar }) {
  const rotas = Router();

  rotas.get('/', autenticar, exigirPerfil(PERFIS.ADMIN), envolver(async (req, res) => {
    res.status(200).json({ usuarios: await casosDeUso.listarUsuarios() });
  }));

  return rotas;
}
