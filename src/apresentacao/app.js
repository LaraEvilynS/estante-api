import express from 'express';
import { tratadorDeErros } from './middlewares/tratadorDeErros.js';
import { ErroAplicacao } from '../dominio/erros/ErroAplicacao.js';

export function criarApp({ verificarBanco }) {
  const app = express();
  app.use(express.json());

  app.get('/saude', async (req, res) => {
    try {
      await verificarBanco();
      res.status(200).json({ status: 'ok', banco: 'conectado' });
    } catch (erro) {
      console.error(erro);
      res.status(503).json({ status: 'indisponivel', banco: 'desconectado' });
    }
  });

  app.use((req, res, next) => {
    next(new ErroAplicacao('Rota não encontrada.', 404));
  });

  app.use(tratadorDeErros);
  return app;
}
