import { lerConfiguracao } from './configuracao.js';
import { criarApp } from './apresentacao/app.js';
import { montarCasosDeUso } from './composicao.js';
import { prisma, verificarBanco } from './infraestrutura/banco/prismaClient.js';
import { criarRepositorioUsuario } from './infraestrutura/banco/repositorioUsuario.js';
import { criarRepositorioTokenSenha } from './infraestrutura/banco/repositorioTokenSenha.js';
import { servicoHash } from './infraestrutura/seguranca/servicoHash.js';
import { servicoTokenSeguro } from './infraestrutura/seguranca/servicoTokenSeguro.js';
import { criarServicoTokenJwt } from './infraestrutura/seguranca/servicoTokenJwt.js';
import { criarServicoEmail } from './infraestrutura/email/servicoEmail.js';

const config = lerConfiguracao();
const servicoToken = criarServicoTokenJwt({ segredo: config.segredoJwt, expiracao: config.expiracaoJwt });

const casosDeUso = montarCasosDeUso({
  repositorioUsuario: criarRepositorioUsuario(prisma),
  repositorioTokenSenha: criarRepositorioTokenSenha(prisma),
  servicoHash,
  servicoToken,
  servicoTokenSeguro,
  servicoEmail: criarServicoEmail(config.email),
  urlFrontend: config.urlFrontend,
  validadeTokenSenhaMinutos: config.validadeTokenSenhaMinutos,
});

if (await casosDeUso.garantirAdmin(config.admin)) {
  console.log(`Administrador inicial criado: ${config.admin.email}`);
}

const app = criarApp({
  verificarBanco,
  urlFrontend: config.urlFrontend,
  casosDeUso,
  servicoToken,
});

const servidor = app.listen(config.porta, () => {
  console.log(`API Estante rodando na porta ${config.porta}`);
});

async function encerrar() {
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on('SIGTERM', encerrar);
process.on('SIGINT', encerrar);
