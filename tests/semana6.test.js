import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarApp } from '../src/apresentacao/app.js';
import { montarCasosDeUso } from '../src/composicao.js';
import { tratadorDeErros } from '../src/apresentacao/middlewares/tratadorDeErros.js';
import { ErroAplicacao } from '../src/dominio/erros/ErroAplicacao.js';
import { servicoHash } from '../src/infraestrutura/seguranca/servicoHash.js';
import { servicoTokenSeguro } from '../src/infraestrutura/seguranca/servicoTokenSeguro.js';
import { criarServicoTokenJwt } from '../src/infraestrutura/seguranca/servicoTokenJwt.js';

// ---------- repositórios falsos em memória ----------
const usuarios = [];
const tokensSenha = [];
const repositorioUsuario = {
  async criar(d) { const u = { id: crypto.randomUUID(), criadoEm: new Date(), senhaAlteradaEm: null, ...d }; usuarios.push(u); return u; },
  async buscarPorEmail(e) { return usuarios.find((u) => u.email === e) ?? null; },
  async buscarPorId(id) { return usuarios.find((u) => u.id === id) ?? null; },
  async atualizarNome(id, nome) { return Object.assign(usuarios.find((u) => u.id === id), { nome }); },
  // como o repositório real: trocar a senha registra o momento da troca
  async atualizarSenha(id, senhaHash) { Object.assign(usuarios.find((u) => u.id === id), { senhaHash, senhaAlteradaEm: new Date() }); },
  async remover(id) { usuarios.splice(usuarios.findIndex((u) => u.id === id), 1); },
  async listar() { return usuarios; },
};
const repositorioTokenSenha = {
  async consumir(hash, agora) {
    const t = tokensSenha.find((x) => x.tokenHash === hash && !x.usadoEm && x.expiraEm > agora);
    if (!t) return null;
    t.usadoEm = agora;
    return { usuarioId: t.usuarioId };
  },
};

const servicoToken = criarServicoTokenJwt({ segredo: 'x'.repeat(40), expiracao: '1h' });
const casosDeUso = montarCasosDeUso({
  repositorioUsuario, repositorioTokenSenha, servicoHash, servicoToken, servicoTokenSeguro,
  urlFrontend: 'http://localhost:5173', validadeTokenSenhaMinutos: 30,
});

let servidor, base;
before(async () => {
  await casosDeUso.garantirAdmin({ nome: 'Admin', email: 'admin@t.com', senha: 'senhaAdmin1' });
  const app = criarApp({
    verificarBanco: async () => {}, urlFrontend: 'http://localhost:5173', casosDeUso, servicoToken,
    limiteAuth: 100000, limiteGeral: 100000,
  });
  servidor = app.listen(0);
  base = `http://localhost:${servidor.address().port}`;
});
after(() => servidor.close());

const chamar = async (metodo, caminho, corpo, token, urlBase = base) => {
  const r = await fetch(urlBase + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { status: r.status, corpo: r.status === 204 ? null : await r.json() };
};
const novoUsuario = async (nome, email) => {
  await casosDeUso.cadastrarUsuario({ nome, email, senha: 'senha12345' });
  return (await casosDeUso.autenticarUsuario({ email, senha: 'senha12345' })).token;
};

// ---------- sessão ----------
test('trocar a senha invalida os tokens antigos; um novo login funciona', async () => {
  const antigo = await novoUsuario('Ana', 'ana@t.com');
  assert.equal((await chamar('GET', '/auth/eu', null, antigo)).status, 200);
  assert.equal((await chamar('PATCH', '/usuarios/eu/senha', { senhaAtual: 'senha12345', novaSenha: 'novaSenha123' }, antigo)).status, 200);
  const recusado = await chamar('GET', '/auth/eu', null, antigo);
  assert.equal(recusado.status, 401);
  assert.equal(recusado.corpo.erro, 'Sessão expirada. Entre novamente.');
  const login = await chamar('POST', '/auth/login', { email: 'ana@t.com', senha: 'novaSenha123' });
  assert.equal((await chamar('GET', '/auth/eu', null, login.corpo.token)).status, 200);
});

test('redefinir a senha pelo link do e-mail também encerra as sessões antigas', async () => {
  const antigo = await novoUsuario('Bia', 'bia@t.com');
  const usuario = usuarios.find((u) => u.email === 'bia@t.com');
  tokensSenha.push({ usuarioId: usuario.id, tokenHash: servicoTokenSeguro.hash('token-de-teste'), expiraEm: new Date(Date.now() + 60000), usadoEm: null });
  assert.equal((await chamar('POST', '/auth/redefinir-senha', { token: 'token-de-teste', novaSenha: 'outraSenha123' })).status, 200);
  assert.equal((await chamar('GET', '/auth/eu', null, antigo)).status, 401);
});

test('token de conta excluída é recusado com 401 em qualquer rota protegida (nunca 500)', async () => {
  const token = await novoUsuario('Caio', 'caio@t.com');
  assert.equal((await chamar('DELETE', '/usuarios/eu', { senha: 'senha12345' }, token)).status, 204);
  for (const [metodo, caminho, corpo] of [
    ['GET', '/auth/eu'],
    ['GET', '/estante'],
    ['POST', '/estante', { livroId: crypto.randomUUID(), status: 'LENDO' }],
    ['POST', `/livros/${crypto.randomUUID()}/avaliacoes`, { nota: 5 }],
    ['PATCH', '/usuarios/eu', { nome: 'Fantasma' }],
  ]) {
    const r = await chamar(metodo, caminho, corpo, token);
    assert.equal(r.status, 401, `${metodo} ${caminho} deveria dar 401`);
  }
});

test('o perfil vale o do banco: um admin rebaixado perde o acesso na hora', async () => {
  const token = (await casosDeUso.autenticarUsuario({ email: 'admin@t.com', senha: 'senhaAdmin1' })).token;
  assert.equal((await chamar('GET', '/usuarios', null, token)).status, 200);
  usuarios.find((u) => u.email === 'admin@t.com').perfil = 'USUARIO';
  assert.equal((await chamar('GET', '/usuarios', null, token)).status, 403);
  usuarios.find((u) => u.email === 'admin@t.com').perfil = 'ADMIN';
});

test('token adulterado ou sem o formato Bearer é recusado', async () => {
  const token = await novoUsuario('Duda', 'duda@t.com');
  assert.equal((await chamar('GET', '/auth/eu', null, token + 'x')).status, 401);
  const semBearer = await fetch(`${base}/auth/eu`, { headers: { Authorization: token } });
  assert.equal(semBearer.status, 401);
});

// ---------- limite geral ----------
test('limite geral: excedido, a API responde 429 no formato padrão', async () => {
  const app = criarApp({ verificarBanco: async () => {}, urlFrontend: 'http://localhost:5173', casosDeUso, servicoToken, limiteGeral: 3 });
  const s = app.listen(0);
  const url = `http://localhost:${s.address().port}`;
  try {
    for (let i = 0; i < 3; i++) assert.equal((await chamar('GET', '/saude', null, null, url)).status, 200);
    const r = await chamar('GET', '/saude', null, null, url);
    assert.equal(r.status, 429);
    assert.ok(r.corpo.erro);
  } finally {
    s.close();
  }
});

// ---------- middleware global de erros ----------
function executarTratador(erro) {
  const res = { status(c) { this.codigo = c; return this; }, json(b) { this.corpo = b; return this; } };
  const original = console.error;
  console.error = () => {};
  try { tratadorDeErros(erro, {}, res, () => {}); } finally { console.error = original; }
  return res;
}

test('erros conhecidos do banco viram respostas claras', () => {
  assert.equal(executarTratador(Object.assign(new Error('x'), { code: 'P2002' })).codigo, 409);
  assert.equal(executarTratador(Object.assign(new Error('x'), { code: 'P2003' })).codigo, 409);
  assert.equal(executarTratador(Object.assign(new Error('x'), { code: 'P2023' })).codigo, 400);
  assert.equal(executarTratador(Object.assign(new Error('x'), { code: 'P2025' })).codigo, 404);
});

test('erro desconhecido vira 500 genérico, sem vazar detalhes; ErroAplicacao passa direto', () => {
  const interno = executarTratador(new Error('senha do banco: segredo123'));
  assert.equal(interno.codigo, 500);
  assert.equal(JSON.stringify(interno.corpo).includes('segredo123'), false);
  const conhecido = executarTratador(new ErroAplicacao('Regra violada.', 422));
  assert.equal(conhecido.codigo, 422);
  assert.deepEqual(conhecido.corpo, { erro: 'Regra violada.' });
});
