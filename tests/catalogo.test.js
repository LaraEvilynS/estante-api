import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarApp } from '../src/apresentacao/app.js';
import { montarCasosDeUso } from '../src/composicao.js';
import { servicoHash } from '../src/infraestrutura/seguranca/servicoHash.js';
import { servicoTokenSeguro } from '../src/infraestrutura/seguranca/servicoTokenSeguro.js';
import { criarServicoTokenJwt } from '../src/infraestrutura/seguranca/servicoTokenJwt.js';

// ---------- repositórios falsos em memória ----------
const usuarios = [];
const livros = [];
const itens = [];
const avaliacoes = [];

const repositorioUsuario = {
  async criar(d) { const u = { id: crypto.randomUUID(), criadoEm: new Date(), ...d }; usuarios.push(u); return u; },
  async buscarPorEmail(e) { return usuarios.find((u) => u.email === e) ?? null; },
  async buscarPorId(id) { return usuarios.find((u) => u.id === id) ?? null; },
  async listar() { return usuarios; },
};
const repositorioLivro = {
  async criar(d) { const l = { id: crypto.randomUUID(), isbn: null, urlCapa: null, paginas: null, genero: null, sinopse: null, criadoEm: new Date(), ...d }; livros.push(l); return l; },
  async buscarPorId(id) { return livros.find((l) => l.id === id) ?? null; },
  async buscarPorIsbn(isbn) { return livros.find((l) => l.isbn === isbn) ?? null; },
  async atualizar(id, d) { return Object.assign(livros.find((l) => l.id === id), d); },
  async remover(id) {
    livros.splice(livros.findIndex((l) => l.id === id), 1);
    [itens, avaliacoes].forEach((lista) => { for (let i = lista.length - 1; i >= 0; i--) if (lista[i].livroId === id) lista.splice(i, 1); });
  },
  async listar({ busca, pagina, limite }) {
    const f = livros.filter((l) => !busca || `${l.titulo} ${l.autor}`.toLowerCase().includes(busca.toLowerCase()));
    return { itens: f.slice((pagina - 1) * limite, pagina * limite), total: f.length };
  },
};
const repositorioItemEstante = {
  async criar(d) { const i = { id: crypto.randomUUID(), atualizadoEm: new Date(), ...d }; itens.push(i); return { ...i, livro: livros.find((l) => l.id === d.livroId) }; },
  async buscarPorId(id) { return itens.find((i) => i.id === id) ?? null; },
  async buscarPorUsuarioELivro(u, l) { return itens.find((i) => i.usuarioId === u && i.livroId === l) ?? null; },
  async listarDoUsuario(u, status) { return itens.filter((i) => i.usuarioId === u && (!status || i.status === status)).map((i) => ({ ...i, livro: livros.find((l) => l.id === i.livroId) })); },
  async atualizarStatus(id, status) { return Object.assign(itens.find((i) => i.id === id), { status }); },
  async remover(id) { itens.splice(itens.findIndex((i) => i.id === id), 1); },
};
const repositorioAvaliacao = {
  async criar(d) { const a = { id: crypto.randomUUID(), criadoEm: new Date(), ...d }; avaliacoes.push(a); return a; },
  async buscarPorId(id) { return avaliacoes.find((a) => a.id === id) ?? null; },
  async buscarPorUsuarioELivro(u, l) { return avaliacoes.find((a) => a.usuarioId === u && a.livroId === l) ?? null; },
  async listarDoLivro(l) { return avaliacoes.filter((a) => a.livroId === l).map((a) => ({ ...a, usuario: { id: a.usuarioId, nome: usuarios.find((u) => u.id === a.usuarioId).nome } })); },
  async atualizar(id, d) { return Object.assign(avaliacoes.find((a) => a.id === id), d); },
  async remover(id) { avaliacoes.splice(avaliacoes.findIndex((a) => a.id === id), 1); },
  async resumosDosLivros(ids) {
    const mapa = new Map();
    for (const id of ids) {
      const notas = avaliacoes.filter((a) => a.livroId === id).map((a) => a.nota);
      if (notas.length) mapa.set(id, { media: notas.reduce((x, y) => x + y, 0) / notas.length, total: notas.length });
    }
    return mapa;
  },
};

const servicoToken = criarServicoTokenJwt({ segredo: 'x'.repeat(40), expiracao: '1h' });
const casosDeUso = montarCasosDeUso({
  repositorioUsuario, repositorioTokenSenha: {}, repositorioLivro, repositorioItemEstante, repositorioAvaliacao,
  servicoHash, servicoToken, servicoTokenSeguro, servicoEmail: {}, urlFrontend: 'http://localhost:5173', validadeTokenSenhaMinutos: 30,
});

let servidor, base, admin, ana, bia;
before(async () => {
  await casosDeUso.garantirAdmin({ nome: 'Admin', email: 'admin@t.com', senha: 'senhaAdmin1' });
  await casosDeUso.cadastrarUsuario({ nome: 'Ana', email: 'ana@t.com', senha: 'senha12345' });
  await casosDeUso.cadastrarUsuario({ nome: 'Bia', email: 'bia@t.com', senha: 'senha12345' });
  const entrar = async (email, senha) => (await casosDeUso.autenticarUsuario({ email, senha })).token;
  admin = await entrar('admin@t.com', 'senhaAdmin1');
  ana = await entrar('ana@t.com', 'senha12345');
  bia = await entrar('bia@t.com', 'senha12345');
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

let livroId, itemId, avaliacaoId;

test('livros: só o ADMIN cadastra; validações e ISBN repetido', async () => {
  const dados = { titulo: 'Dom Casmurro', autor: 'Machado de Assis', isbn: '978-85-359-0277-5', paginas: 256 };
  assert.equal((await chamar('POST', '/livros', dados)).status, 401);
  assert.equal((await chamar('POST', '/livros', dados, ana)).status, 403);
  const ok = await chamar('POST', '/livros', dados, admin);
  assert.equal(ok.status, 201);
  assert.equal(ok.corpo.livro.isbn, '9788535902775');
  assert.equal(ok.corpo.livro.mediaNota, null);
  livroId = ok.corpo.livro.id;
  assert.equal((await chamar('POST', '/livros', dados, admin)).status, 409);
  const invalido = await chamar('POST', '/livros', { autor: 'X', isbn: '123', urlCapa: 'ftp://x', paginas: -2 }, admin);
  assert.equal(invalido.status, 400);
  assert.ok(invalido.corpo.detalhes.length >= 4);
});

test('livros: leitura pública, busca, paginação, id inválido e inexistente', async () => {
  await chamar('POST', '/livros', { titulo: 'O Cortiço', autor: 'Aluísio Azevedo' }, admin);
  const lista = await chamar('GET', '/livros');
  assert.equal(lista.status, 200);
  assert.equal(lista.corpo.total, 2);
  const busca = await chamar('GET', '/livros?busca=machado');
  assert.equal(busca.corpo.itens.length, 1);
  const pagina = await chamar('GET', '/livros?limite=1&pagina=2');
  assert.equal(pagina.corpo.itens.length, 1);
  assert.equal(pagina.corpo.totalPaginas, 2);
  assert.equal((await chamar('GET', `/livros/${livroId}`)).corpo.livro.titulo, 'Dom Casmurro');
  assert.equal((await chamar('GET', '/livros/abc')).status, 400);
  assert.equal((await chamar('GET', `/livros/${crypto.randomUUID()}`)).status, 404);
});

test('livros: atualização restrita ao ADMIN e ISBN de outro livro é recusado', async () => {
  assert.equal((await chamar('PATCH', `/livros/${livroId}`, { genero: 'Romance' }, ana)).status, 403);
  const ok = await chamar('PATCH', `/livros/${livroId}`, { genero: 'Romance' }, admin);
  assert.equal(ok.status, 200);
  assert.equal(ok.corpo.livro.genero, 'Romance');
  assert.equal((await chamar('PATCH', `/livros/${livroId}`, {}, admin)).status, 400);
  const outro = await chamar('POST', '/livros', { titulo: 'Outro', autor: 'Fulano', isbn: '9780306406157' }, admin);
  assert.equal((await chamar('PATCH', `/livros/${livroId}`, { isbn: '9780306406157' }, admin)).status, 409);
  await chamar('DELETE', `/livros/${outro.corpo.livro.id}`, null, admin);
});

test('estante: exige login, é pessoal e não aceita livro repetido', async () => {
  assert.equal((await chamar('GET', '/estante')).status, 401);
  assert.equal((await chamar('POST', '/estante', { livroId: crypto.randomUUID(), status: 'LENDO' }, ana)).status, 404);
  assert.equal((await chamar('POST', '/estante', { livroId, status: 'INVALIDO' }, ana)).status, 400);
  const add = await chamar('POST', '/estante', { livroId, status: 'LENDO' }, ana);
  assert.equal(add.status, 201);
  itemId = add.corpo.item.id;
  assert.equal((await chamar('POST', '/estante', { livroId, status: 'LIDO' }, ana)).status, 409);
  assert.equal((await chamar('GET', '/estante', null, ana)).corpo.itens.length, 1);
  assert.equal((await chamar('GET', '/estante', null, bia)).corpo.itens.length, 0);
  assert.equal((await chamar('GET', '/estante?status=LIDO', null, ana)).corpo.itens.length, 0);
  assert.equal((await chamar('PATCH', `/estante/${itemId}`, { status: 'LIDO' }, bia)).status, 404);
  assert.equal((await chamar('DELETE', `/estante/${itemId}`, null, bia)).status, 404);
});

test('avaliações: só quem leu avalia, uma vez, com nota de 1 a 5', async () => {
  assert.equal((await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 5 })).status, 401);
  // ainda está como LENDO
  assert.equal((await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 5 }, ana)).status, 403);
  await chamar('PATCH', `/estante/${itemId}`, { status: 'LIDO' }, ana);
  assert.equal((await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 6 }, ana)).status, 400);
  assert.equal((await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 4.5 }, ana)).status, 400);
  const ok = await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 4, comentario: 'Ótimo' }, ana);
  assert.equal(ok.status, 201);
  avaliacaoId = ok.corpo.avaliacao.id;
  assert.equal((await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 5 }, ana)).status, 409);
  // Bia nunca leu o livro
  assert.equal((await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 5 }, bia)).status, 403);
});

test('avaliações: média no livro e listagem pública com o nome do autor', async () => {
  const bia1 = await chamar('POST', '/estante', { livroId, status: 'LIDO' }, bia);
  await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 5 }, bia);
  const livro = (await chamar('GET', `/livros/${livroId}`)).corpo.livro;
  assert.equal(livro.mediaNota, 4.5);
  assert.equal(livro.totalAvaliacoes, 2);
  const lista = await chamar('GET', `/livros/${livroId}/avaliacoes`);
  assert.equal(lista.status, 200);
  assert.equal(lista.corpo.avaliacoes.length, 2);
  assert.ok(lista.corpo.avaliacoes.every((a) => a.usuario.nome));
  assert.equal(JSON.stringify(lista.corpo).includes('senha'), false);
  assert.ok(bia1.corpo.item.id);
});

test('avaliações: só o dono edita; dono ou ADMIN excluem', async () => {
  assert.equal((await chamar('PATCH', `/avaliacoes/${avaliacaoId}`, { nota: 1 }, bia)).status, 403);
  assert.equal((await chamar('PATCH', `/avaliacoes/${avaliacaoId}`, { nota: 1 }, admin)).status, 403);
  const ok = await chamar('PATCH', `/avaliacoes/${avaliacaoId}`, { nota: 3 }, ana);
  assert.equal(ok.status, 200);
  assert.equal(ok.corpo.avaliacao.nota, 3);
  assert.equal((await chamar('DELETE', `/avaliacoes/${avaliacaoId}`, null, bia)).status, 403);
  assert.equal((await chamar('DELETE', `/avaliacoes/${crypto.randomUUID()}`, null, ana)).status, 404);
  assert.equal((await chamar('DELETE', `/avaliacoes/${avaliacaoId}`, null, admin)).status, 204);
  assert.equal((await chamar('GET', `/livros/${livroId}`)).corpo.livro.totalAvaliacoes, 1);
});

test('regra: livro avaliado não pode deixar de ser "lido" nem sair da estante', async () => {
  const nova = await chamar('POST', `/livros/${livroId}/avaliacoes`, { nota: 5 }, ana);
  assert.equal(nova.status, 201);
  assert.equal((await chamar('PATCH', `/estante/${itemId}`, { status: 'LENDO' }, ana)).status, 409);
  assert.equal((await chamar('DELETE', `/estante/${itemId}`, null, ana)).status, 409);
  await chamar('DELETE', `/avaliacoes/${nova.corpo.avaliacao.id}`, null, ana);
  assert.equal((await chamar('PATCH', `/estante/${itemId}`, { status: 'LENDO' }, ana)).status, 200);
  assert.equal((await chamar('DELETE', `/estante/${itemId}`, null, ana)).status, 204);
});

test('excluir livro (ADMIN) remove também avaliações e itens da estante', async () => {
  assert.equal((await chamar('DELETE', `/livros/${livroId}`, null, ana)).status, 403);
  assert.equal((await chamar('DELETE', `/livros/${livroId}`, null, admin)).status, 204);
  assert.equal((await chamar('GET', `/livros/${livroId}`)).status, 404);
  assert.equal(avaliacoes.length, 0);
  assert.equal(itens.filter((i) => i.livroId === livroId).length, 0);
  assert.equal((await chamar('DELETE', `/livros/${livroId}`, null, admin)).status, 404);
});
