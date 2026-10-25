import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { tratadorDeErros } from './middlewares/tratadorDeErros.js';
import { criarAutenticar } from './middlewares/autenticar.js';
import { criarRotasAuth } from './rotas/authRotas.js';
import { criarRotasUsuarios } from './rotas/usuariosRotas.js';
import { criarRotasLivros } from './rotas/livrosRotas.js';
import { criarRotasEstante } from './rotas/estanteRotas.js';
import { criarRotasAvaliacoes } from './rotas/avaliacoesRotas.js';
import { ErroAplicacao } from '../dominio/erros/ErroAplicacao.js';

export function criarApp({ verificarBanco, urlFrontend, casosDeUso, servicoToken, limiteAuth = 50 }) {
  const app = express();
  app.use(helmet());
  // Libera apenas o front-end configurado a chamar a API pelo navegador (CORS).
  app.use(cors({ origin: urlFrontend }));
  app.use(express.json({ limit: '10kb' }));

  const autenticar = criarAutenticar(servicoToken);
  // Limita tentativas nas rotas de autenticação (proteção contra força bruta).
  const limitador = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: limiteAuth,
    standardHeaders: true,
    legacyHeaders: false,
    message: { erro: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.' },
  });

  app.get('/saude', async (req, res) => {
    try {
      await verificarBanco();
      res.status(200).json({ status: 'ok', banco: 'conectado' });
    } catch (erro) {
      console.error(erro);
      res.status(503).json({ status: 'indisponivel', banco: 'desconectado' });
    }
  });

  app.use('/auth', criarRotasAuth({ casosDeUso, autenticar, limitador }));
  app.use('/usuarios', criarRotasUsuarios({ casosDeUso, autenticar }));
  app.use('/livros', criarRotasLivros({ casosDeUso, autenticar }));
  app.use('/estante', criarRotasEstante({ casosDeUso, autenticar }));
  app.use('/avaliacoes', criarRotasAvaliacoes({ casosDeUso, autenticar }));

  app.use((req, res, next) => {
    next(new ErroAplicacao('Rota não encontrada.', 404));
  });

  app.use(tratadorDeErros);
  return app;
}
