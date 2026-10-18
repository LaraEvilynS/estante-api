import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarApp } from '../src/apresentacao/app.js';
import { montarCasosDeUso } from '../src/composicao.js';
import { ErroAplicacao } from '../src/dominio/erros/ErroAplicacao.js';
import { servicoHash } from '../src/infraestrutura/seguranca/servicoHash.js';
import { servicoTokenSeguro } from '../src/infraestrutura/seguranca/servicoTokenSeguro.js';
import { criarServicoTokenJwt } from '../src/infraestrutura/seguranca/servicoTokenJwt.js';

// Repositórios falsos em memória (no lugar do banco)
const usuarios = [];
const tokens = [];
const emails = [];

const repositorioUsuario = {
  async criar(d) {
    if (usuarios.some((u) => u.email === d.email)) throw new ErroAplicacao('E-mail já cadastrado.', 409);
    const u = { id: crypto.randomUUID(), criadoEm: new Date(), ...d };
    usuarios.push(u);
    return u;
  },
  async buscarPorEmail(email) { return usuarios.find((u) => u.email === email) ?? null; },
  async buscarPorId(id) { return usuarios.find((u) => u.id === id) ?? null; },
  async atualizarSenha(id, senhaHash) { usuarios.find((u) => u.id === id).senhaHash = senhaHash; },
  async listar() { return usuarios; },
};
const repositorioTokenSenha = {
  async criar(d) { tokens.push({ ...d, usadoEm: null }); },
  async invalidarDoUsuario(id) { tokens.filter((t) => t.usuarioId === id && !t.usadoEm).forEach((t) => (t.usadoEm = new Date())); },
  async consumir(hash, agora) {
    const t = tokens.find((x) => x.tokenHash === hash && !x.usadoEm && x.expiraEm > agora);
    if (!t) return null;
    t.usadoEm = agora;
    return { usuarioId: t.usuarioId };
  },
};
const servicoEmail = { async enviarRecuperacaoSenha(d) { emails.push(d); } };

const servicoToken = criarServicoTokenJwt({ segredo: 'x'.repeat(40), expiracao: '1h' });
const casosDeUso = montarCasosDeUso({
  repositorioUsuario, repositorioTokenSenha, servicoHash, servicoToken, servicoTokenSeguro,
  servicoEmail, urlFrontend: 'http://localhost:5173', validadeTokenSenhaMinutos: 30,
});

let servidor, base;
before(async () => {
  await casosDeUso.garantirAdmin({ nome: 'Admin', email: 'admin@teste.com', senha: 'senhaAdmin123' });
  const app = criarApp({ verificarBanco: async () => {}, urlFrontend: 'http://localhost:5173', casosDeUso, servicoToken, limiteAuth: 1000 });
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}`;
});
after(() => servidor.close());

const chamar = async (metodo, caminho, corpo, token) => {
  const r = await fetch(base + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { status: r.status, corpo: await r.json() };
};

test('cadastro cria USUARIO, ignora perfil enviado e não devolve a senha', async () => {
  const r = await chamar('POST', '/auth/cadastro', { nome: 'Lara', email: ' LARA@Teste.com ', senha: 'senha1234', perfil: 'ADMIN' });
  assert.equal(r.status, 201);
  assert.equal(r.corpo.usuario.perfil, 'USUARIO');
  assert.equal(r.corpo.usuario.email, 'lara@teste.com');
  assert.equal(JSON.stringify(r.corpo).includes('senha'), false);
  assert.notEqual(usuarios.find((u) => u.email === 'lara@teste.com').senhaHash, 'senha1234');
});

test('cadastro rejeita e-mail repetido (409) e dados inválidos (400)', async () => {
  const dup = await chamar('POST', '/auth/cadastro', { nome: 'Lara', email: 'lara@teste.com', senha: 'senha1234' });
  assert.equal(dup.status, 409);
  const inv = await chamar('POST', '/auth/cadastro', { nome: 'L', email: 'nao-e-email', senha: '123' });
  assert.equal(inv.status, 400);
  assert.ok(inv.corpo.detalhes.length >= 3);
});

test('login correto devolve token; credenciais erradas dão a mesma mensagem', async () => {
  const ok = await chamar('POST', '/auth/login', { email: 'lara@teste.com', senha: 'senha1234' });
  assert.equal(ok.status, 200);
  assert.ok(ok.corpo.token);
  const senhaErrada = await chamar('POST', '/auth/login', { email: 'lara@teste.com', senha: 'errada123' });
  const emailInexistente = await chamar('POST', '/auth/login', { email: 'ninguem@teste.com', senha: 'senha1234' });
  assert.equal(senhaErrada.status, 401);
  assert.equal(emailInexistente.status, 401);
  assert.equal(senhaErrada.corpo.erro, emailInexistente.corpo.erro);
});

test('rotas protegidas exigem token válido', async () => {
  assert.equal((await chamar('GET', '/auth/eu')).status, 401);
  assert.equal((await chamar('GET', '/auth/eu', null, 'token.falso.aqui')).status, 401);
  const { corpo } = await chamar('POST', '/auth/login', { email: 'lara@teste.com', senha: 'senha1234' });
  const eu = await chamar('GET', '/auth/eu', null, corpo.token);
  assert.equal(eu.status, 200);
  assert.equal(eu.corpo.usuario.email, 'lara@teste.com');
});

test('listar usuários: 403 para USUARIO, 200 para ADMIN', async () => {
  const user = (await chamar('POST', '/auth/login', { email: 'lara@teste.com', senha: 'senha1234' })).corpo.token;
  const admin = (await chamar('POST', '/auth/login', { email: 'admin@teste.com', senha: 'senhaAdmin123' })).corpo.token;
  assert.equal((await chamar('GET', '/usuarios', null, user)).status, 403);
  const r = await chamar('GET', '/usuarios', null, admin);
  assert.equal(r.status, 200);
  assert.equal(r.corpo.usuarios.length, usuarios.length);
});

test('recuperação de senha: fluxo completo, uso único e e-mail inexistente', async () => {
  emails.length = 0;
  const desconhecido = await chamar('POST', '/auth/esqueci-senha', { email: 'ninguem@teste.com' });
  assert.equal(desconhecido.status, 200);
  assert.equal(emails.length, 0);

  const pedido = await chamar('POST', '/auth/esqueci-senha', { email: 'lara@teste.com' });
  assert.equal(pedido.status, 200);
  assert.equal(pedido.corpo.mensagem, desconhecido.corpo.mensagem);
  assert.equal(emails.length, 1);

  const token = new URL(emails[0].link).searchParams.get('token');
  assert.ok(token);
  assert.equal(tokens.some((t) => t.tokenHash === token), false, 'o token não pode ser guardado em texto puro');

  assert.equal((await chamar('POST', '/auth/redefinir-senha', { token, novaSenha: 'curta' })).status, 400);
  assert.equal((await chamar('POST', '/auth/redefinir-senha', { token: 'invalido', novaSenha: 'novaSenha123' })).status, 400);

  assert.equal((await chamar('POST', '/auth/redefinir-senha', { token, novaSenha: 'novaSenha123' })).status, 200);
  assert.equal((await chamar('POST', '/auth/redefinir-senha', { token, novaSenha: 'outraSenha123' })).status, 400);
  assert.equal((await chamar('POST', '/auth/login', { email: 'lara@teste.com', senha: 'senha1234' })).status, 401);
  assert.equal((await chamar('POST', '/auth/login', { email: 'lara@teste.com', senha: 'novaSenha123' })).status, 200);
});

test('novo pedido invalida o anterior e token expirado é recusado', async () => {
  emails.length = 0;
  await chamar('POST', '/auth/esqueci-senha', { email: 'lara@teste.com' });
  await chamar('POST', '/auth/esqueci-senha', { email: 'lara@teste.com' });
  const [primeiro, segundo] = emails.map((e) => new URL(e.link).searchParams.get('token'));
  assert.equal((await chamar('POST', '/auth/redefinir-senha', { token: primeiro, novaSenha: 'senhaNova123' })).status, 400);

  tokens.forEach((t) => { t.expiraEm = new Date(Date.now() - 1000); });
  assert.equal((await chamar('POST', '/auth/redefinir-senha', { token: segundo, novaSenha: 'senhaNova123' })).status, 400);
});

test('JSON inválido devolve 400 e rota inexistente 404, sempre no formato { erro }', async () => {
  const r = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{quebrado' });
  assert.equal(r.status, 400);
  assert.equal((await r.json()).erro, 'JSON inválido.');
  const nf = await chamar('GET', '/nada');
  assert.equal(nf.status, 404);
  assert.ok(nf.corpo.erro);
});
