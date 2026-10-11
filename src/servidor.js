import { criarApp } from './apresentacao/app.js';
import { prisma, verificarBanco } from './infraestrutura/banco/prismaClient.js';

// Ponto de composição: aqui a infraestrutura é ligada à aplicação.
const porta = process.env.PORTA || 3000;
const app = criarApp({ verificarBanco, urlFrontend: process.env.URL_FRONTEND });

const servidor = app.listen(porta, () => {
  console.log(`API Estante rodando na porta ${porta}`);
});

async function encerrar() {
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);
