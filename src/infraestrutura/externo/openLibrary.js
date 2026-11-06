import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

const BASE = 'https://openlibrary.org';
const CAPAS = 'https://covers.openlibrary.org/b/id';
const CABECALHOS = { 'User-Agent': 'EstanteTrainee/1.0 (projeto academico)', Accept: 'application/json' };

// Prefere ISBN de 13 dígitos; se não houver, aceita o de 10.
function escolherIsbn(lista) {
  const limpos = (lista ?? []).map((i) => String(i).replace(/[-\s]/g, '').toUpperCase());
  return limpos.find((i) => /^\d{13}$/.test(i)) ?? limpos.find((i) => /^(\d{10}|\d{9}X)$/.test(i)) ?? null;
}

function mapearResultado(doc) {
  return {
    idObra: doc.key.replace('/works/', ''),
    titulo: String(doc.title ?? '').slice(0, 200),
    autor: (doc.author_name ?? []).slice(0, 3).join(', ').slice(0, 200) || 'Autor desconhecido',
    isbn: escolherIsbn(doc.isbn),
    urlCapa: doc.cover_i ? `${CAPAS}/${doc.cover_i}-M.jpg` : null,
    paginas: doc.number_of_pages_median ?? null,
    genero: doc.subject?.[0] ? String(doc.subject[0]).slice(0, 80) : null,
  };
}

// A descrição da obra pode vir como texto ou como { type, value }.
function extrairDescricao(descricao) {
  const texto = typeof descricao === 'string' ? descricao : descricao?.value;
  return texto ? texto.trim().slice(0, 5000) : null;
}

// Cliente da Open Library (https://openlibrary.org/developers/api). Não exige chave de API.
// O fetch é injetável para permitir testes sem internet.
export function criarServicoOpenLibrary({ fetchFn = fetch, timeoutMs = 8000 } = {}) {
  async function pedir(url) {
    let resposta;
    try {
      resposta = await fetchFn(url, { headers: CABECALHOS, signal: AbortSignal.timeout(timeoutMs) });
    } catch {
      throw new ErroAplicacao('Não foi possível consultar a Open Library agora. Tente novamente.', 502);
    }
    if (resposta.status === 404) return null;
    if (!resposta.ok) throw new ErroAplicacao('A Open Library não respondeu corretamente.', 502);
    try {
      return await resposta.json();
    } catch {
      throw new ErroAplicacao('Resposta inválida da Open Library.', 502);
    }
  }

  return {
    async buscarPorTitulo(titulo) {
      const params = new URLSearchParams({
        q: titulo,
        limit: '8',
        fields: 'key,title,author_name,isbn,cover_i,number_of_pages_median,subject',
      });
      const dados = await pedir(`${BASE}/search.json?${params}`);
      return (dados?.docs ?? []).filter((d) => d.key?.startsWith('/works/')).map(mapearResultado);
    },

    async detalharObra(idObra) {
      const dados = await pedir(`${BASE}/works/${idObra}.json`);
      return dados ? { sinopse: extrairDescricao(dados.description) } : null;
    },
  };
}
