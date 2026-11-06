import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

export function criarRepositorioAvaliacao(prisma) {
  return {
    async criar(dados) {
      try {
        return await prisma.avaliacao.create({ data: dados });
      } catch (erro) {
        if (erro.code === 'P2002') throw new ErroAplicacao('Você já avaliou este livro.', 409);
        throw erro;
      }
    },
    buscarPorId: (id) => prisma.avaliacao.findUnique({ where: { id } }),
    buscarPorUsuarioELivro: (usuarioId, livroId) =>
      prisma.avaliacao.findUnique({ where: { usuarioId_livroId: { usuarioId, livroId } } }),
    listarDoLivro: (livroId) =>
      prisma.avaliacao.findMany({
        where: { livroId },
        orderBy: { criadoEm: 'desc' },
        include: { usuario: { select: { id: true, nome: true } } },
      }),
    atualizar: (id, dados) => prisma.avaliacao.update({ where: { id }, data: dados }),
    remover: (id) => prisma.avaliacao.delete({ where: { id } }),

    // Média e total de avaliações de vários livros de uma vez: Map(livroId -> { media, total })
    async resumosDosLivros(ids) {
      if (ids.length === 0) return new Map();
      const grupos = await prisma.avaliacao.groupBy({
        by: ['livroId'],
        where: { livroId: { in: ids } },
        _avg: { nota: true },
        _count: { _all: true },
      });
      return new Map(grupos.map((g) => [g.livroId, { media: g._avg.nota, total: g._count._all }]));
    },
  };
}
