import express from 'express';
import { tratadorDeErros } from './middlewares/tratadorDeErros.js';
import { ErroAplicacao } from '../dominio/erros/ErroAplicacao.js';

export function criarApp() {
  const app = express();
  app.use(express.json());

  app.get('/saude', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use((req, res, next) => {
    next(new ErroAplicacao('Rota não encontrada.', 404));
  });

  app.use(tratadorDeErros);
  return app;
}
