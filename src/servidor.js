import { criarApp } from './apresentacao/app.js';

const porta = process.env.PORTA || 3000;
const app = criarApp();

app.listen(porta, () => {
  console.log(`API Estante rodando na porta ${porta}`);
});
