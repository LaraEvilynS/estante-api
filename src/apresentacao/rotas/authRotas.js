import { Router } from 'express';
import { envolver } from './envolver.js';
import {
  cadastroSchema, loginSchema, esqueciSenhaSchema, redefinirSenhaSchema,
} from '../validacoes/authSchemas.js';

export function criarRotasAuth({ casosDeUso, autenticar, limitador }) {
  const rotas = Router();
  rotas.use(limitador);

  rotas.post('/cadastro', envolver(async (req, res) => {
    const dados = cadastroSchema.parse(req.body ?? {});
    const usuario = await casosDeUso.cadastrarUsuario(dados);
    res.status(201).json({ usuario });
  }));

  rotas.post('/login', envolver(async (req, res) => {
    const dados = loginSchema.parse(req.body ?? {});
    res.status(200).json(await casosDeUso.autenticarUsuario(dados));
  }));

  rotas.post('/esqueci-senha', envolver(async (req, res) => {
    const dados = esqueciSenhaSchema.parse(req.body ?? {});
    await casosDeUso.solicitarRecuperacaoSenha(dados);
    res.status(200).json({
      mensagem: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
    });
  }));

  rotas.post('/redefinir-senha', envolver(async (req, res) => {
    const dados = redefinirSenhaSchema.parse(req.body ?? {});
    await casosDeUso.redefinirSenha(dados);
    res.status(200).json({ mensagem: 'Senha redefinida com sucesso.' });
  }));

  rotas.get('/eu', autenticar, envolver(async (req, res) => {
    res.status(200).json({ usuario: await casosDeUso.buscarUsuarioAtual(req.usuario.id) });
  }));

  return rotas;
}
