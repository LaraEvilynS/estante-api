import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarApp } from '../src/apresentacao/app.js';
import { montarCasosDeUso } from '../src/composicao.js';
import { criarServicoOpenLibrary } from '../src/infraestrutura/externo/openLibrary.js';
import { servicoHash } from '../src/infraestrutura/seguranca/servicoHash.js';
import { servicoTokenSeguro } from '../src/infraestrutura/seguranca/servicoTokenSeguro.js';
import { criarServicoTokenJwt } from '../src/infraestrutura/seguranca/servicoTokenJwt.js';

// ---------- Open Library: mapeamento das respostas (fetch simulado) ----------
const resposta = (corpo, status = 200) => ({ ok: status < 400, status, json: async () => corpo });

test('Open Library: converte a busca no formato do sistema', async () => {
  let urlChamada;
  const servico = criarServicoOpenLibrary({
    fetchFn: async (url) => {
      urlChamada = String(url);
      return resposta({
        docs: [
          { key: '/works/OL1W', title: 'Dom Casmurro', author_name: ['Machado de Assis'], isbn: ['8535902775', '978-85-359-0277-5'], cover_i: 123, number_of_pages_median: 256, subject: ['Romance', 'Ficção'] },
          { key: '/authors/OL9A', title: 'Ignorado' },
          { key: '/works/OL2W', title: 'Sem dados' },
        ],
      });
    },
  });
  const lista = await servico.buscarPorTitulo('dom casmurro & co');
  assert.ok(urlChamada.includes('q=dom+casmurro+%26+co'), 'o título deve ir codificado na URL');
  assert.equal(lista.length, 2);
  assert.deepEqual(lista[0], {
    idObra: 'OL1W', titulo: 'Dom Casmurro', autor: 'Machado de Assis', isbn: '9788535902775',
    urlCapa: 'https://covers.openlibrary.org/b/id/123-M.jpg', paginas: 256, genero: 'Romance',
  });
  assert.equal(lista[1].autor, 'Autor desconhecido');
  assert.equal(lista[1].isbn, null);
  assert.equal(lista[1].urlCapa, null);
});

test('Open Library: descrição como texto ou objeto, e obra inexistente', async () => {
  const comTexto = criarServicoOpenLibrary({ fetchFn: async () => resposta({ description: '  Um clássico.  ' }) });
  assert.deepEqual(await comTexto.detalharObra('OL1W'), { sinopse: 'Um clássico.' });
  const comObjeto = criarServicoOpenLibrary({ fetchFn: async () => resposta({ description: { type: '/type/text', value: 'Texto' } }) });
  assert.deepEqual(await comObjeto.detalharObra('OL1W'), { sinopse: 'Texto' });
  const semDescricao = criarServicoOpenLibrary({ fetchFn: async () => resposta({}) });
  assert.deepEqual(await semDescricao.detalharObra('OL1W'), { sinopse: null });
  const inexistente = criarServicoOpenLibrary({ fetchFn: async () => resposta({}, 404) });
  assert.equal(await inexistente.detalharObra('OL1W'), null);
});

test('Open Library: falhas da API externa viram erro 502 amigável', async () => {
  const fora = criarServicoOpenLibrary({ fetchFn: async () => { throw new Error('rede'); } });
  await assert.rejects(() => fora.buscarPorTitulo('x'), (e) => e.statusHttp === 502);
  const erro500 = criarServicoOpenLibrary({ fetchFn: async () => resposta({}, 500) });
  await assert.rejects(() => erro500.buscarPorTitulo('x'), (e) => e.statusHttp === 502);
  const jsonRuim = criarServicoOpenLibrary({ fetchFn: async () => ({ ok: true, status: 200, json: async () => { throw new Error('json'); } }) });
  await assert.rejects(() => jsonRuim.buscarPorTitulo('x'), (e) => e.statusHttp === 502);
});

// ---------- rotas: Open Library e usuários ----------
const usuarios = [];
const repositorioUsuario = {
  async criar(d) { const u = { id: crypto.randomUUID(), criadoEm: new Date(), ...d }; usuarios.push(u); return u; },
  async buscarPorEmail(e) { return usuarios.find((u) => u.email === e) ?? null; },
  async buscarPorId(id) { return usuarios.find((u) => u.id === id) ?? null; },
  async atualizarNome(id, nome) { return Object.assign(usuarios.find((u) => u.id === id), { nome }); },
  async atualizarSenha(id, senhaHash) { usuarios.find((u) => u.id === id).senhaHash = senhaHash; },
  async remover(id) { usuarios.splice(usuarios.findIndex((u) => u.id === id), 1); },
  async listar() { return usuarios; },
};
let ultimaBusca = null;
const servicoLivrosExternos = {
  async buscarPorTitulo(t) { ultimaBusca = t; return [{ idObra: 'OL1W', titulo: 'Dom Casmurro', autor: 'Machado de Assis', isbn: null, urlCapa: null, paginas: null, genero: null }]; },
  async detalharObra(id) { return id === 'OL404W' ? null : { sinopse: 'Resumo' }; },
};
const servicoToken = criarServicoTokenJwt({ segredo: 'x'.repeat(40), expiracao: '1h' });
const casosDeUso = montarCasosDeUso({
  repositorioUsuario, servicoLivrosExternos, servicoHash, servicoToken, servicoTokenSeguro,
  urlFrontend: 'http://localhost:5173', validadeTokenSenhaMinutos: 30,
});

let servidor, base, admin, ana, bia, idBia, idAdmin;
before(async () => {
  await casosDeUso.garantirAdmin({ nome: 'Admin', email: 'admin@t.com', senha: 'senhaAdmin1' });
  const ca = await casosDeUso.cadastrarUsuario({ nome: 'Ana', email: 'ana@t.com', senha: 'senha12345' });
  const cb = await casosDeUso.cadastrarUsuario({ nome: 'Bia', email: 'bia@t.com', senha: 'senha12345' });
  idBia = cb.id;
  idAdmin = usuarios.find((u) => u.email === 'admin@t.com').id;
  const entrar = async (email, senha) => (await casosDeUso.autenticarUsuario({ email, senha })).token;
  admin = await entrar('admin@t.com', 'senhaAdmin1');
  ana = await entrar('ana@t.com', 'senha12345');
  bia = await entrar('bia@t.com', 'senha12345');
  assert.ok(ca.id);
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
  return { status: r.status, corpo: r.status === 204 ? null : await r.json() };
};

test('rotas da Open Library: só ADMIN, com validação do título e do id da obra', async () => {
  assert.equal((await chamar('GET', '/livros/externo/busca?titulo=dom')).status, 401);
  assert.equal((await chamar('GET', '/livros/externo/busca?titulo=dom', null, ana)).status, 403);
  assert.equal((await chamar('GET', '/livros/externo/busca?titulo=d', null, admin)).status, 400);
  assert.equal((await chamar('GET', '/livros/externo/busca', null, admin)).status, 400);
  const ok = await chamar('GET', '/livros/externo/busca?titulo=dom%20casmurro', null, admin);
  assert.equal(ok.status, 200);
  assert.equal(ok.corpo.resultados[0].idObra, 'OL1W');
  assert.equal(ultimaBusca, 'dom casmurro');

  assert.equal((await chamar('GET', '/livros/externo/obras/OL1W', null, ana)).status, 403);
  assert.equal((await chamar('GET', '/livros/externo/obras/..%2F..%2Fx', null, admin)).status, 400);
  assert.equal((await chamar('GET', '/livros/externo/obras/abc', null, admin)).status, 400);
  assert.equal((await chamar('GET', '/livros/externo/obras/OL1W', null, admin)).corpo.detalhes.sinopse, 'Resumo');
  assert.equal((await chamar('GET', '/livros/externo/obras/OL404W', null, admin)).status, 404);
});

test('usuário edita o próprio nome', async () => {
  assert.equal((await chamar('PATCH', '/usuarios/eu', { nome: 'Nova' })).status, 401);
  assert.equal((await chamar('PATCH', '/usuarios/eu', { nome: 'A' }, ana)).status, 400);
  const ok = await chamar('PATCH', '/usuarios/eu', { nome: '  Ana Maria  ' }, ana);
  assert.equal(ok.status, 200);
  assert.equal(ok.corpo.usuario.nome, 'Ana Maria');
  assert.equal(JSON.stringify(ok.corpo).includes('senha'), false);
});

test('troca de senha exige a senha atual', async () => {
  assert.equal((await chamar('PATCH', '/usuarios/eu/senha', { senhaAtual: 'errada', novaSenha: 'novaSenha123' }, ana)).status, 400);
  assert.equal((await chamar('PATCH', '/usuarios/eu/senha', { senhaAtual: 'senha12345', novaSenha: 'curta' }, ana)).status, 400);
  assert.equal((await chamar('PATCH', '/usuarios/eu/senha', { senhaAtual: 'senha12345', novaSenha: 'novaSenha123' }, ana)).status, 200);
  const antiga = await chamar('POST', '/auth/login', { email: 'ana@t.com', senha: 'senha12345' });
  assert.equal(antiga.status, 401);
  const nova = await chamar('POST', '/auth/login', { email: 'ana@t.com', senha: 'novaSenha123' });
  assert.equal(nova.status, 200);
});

test('excluir a própria conta exige a senha; admin não pode ser excluído', async () => {
  assert.equal((await chamar('DELETE', '/usuarios/eu', { senha: 'errada' }, bia)).status, 400);
  assert.equal((await chamar('DELETE', '/usuarios/eu', {}, bia)).status, 400);
  assert.equal((await chamar('DELETE', '/usuarios/eu', { senha: 'senhaAdmin1' }, admin)).status, 403);
  assert.equal((await chamar('DELETE', '/usuarios/eu', { senha: 'senha12345' }, bia)).status, 204);
  assert.equal((await chamar('POST', '/auth/login', { email: 'bia@t.com', senha: 'senha12345' })).status, 401);
  // o token antigo continua assinado, mas a conta não existe mais
  assert.equal((await chamar('GET', '/auth/eu', null, bia)).status, 401);
  assert.equal(usuarios.some((u) => u.id === idBia), false);
});

test('admin exclui usuário comum; usuário comum não; admin não é excluído', async () => {
  const extra = await casosDeUso.cadastrarUsuario({ nome: 'Caio', email: 'caio@t.com', senha: 'senha12345' });
  assert.equal((await chamar('DELETE', `/usuarios/${extra.id}`, null, ana)).status, 403);
  assert.equal((await chamar('DELETE', `/usuarios/${extra.id}`)).status, 401);
  assert.equal((await chamar('DELETE', '/usuarios/abc', null, admin)).status, 400);
  assert.equal((await chamar('DELETE', `/usuarios/${crypto.randomUUID()}`, null, admin)).status, 404);
  assert.equal((await chamar('DELETE', `/usuarios/${idAdmin}`, null, admin)).status, 403);
  assert.equal((await chamar('DELETE', `/usuarios/${extra.id}`, null, admin)).status, 204);
  assert.equal((await chamar('DELETE', `/usuarios/${extra.id}`, null, admin)).status, 404);
});
