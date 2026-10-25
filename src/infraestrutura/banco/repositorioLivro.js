import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

export function criarRepositorioLivro(prisma) {
  // P2002 = violação de unicidade (ISBN repetido, inclusive em requisições simultâneas)
  async function tratarIsbnRepetido(operacao) {
    try {
      return await operacao();
    } catch (erro) {
      if (erro.code === 'P2002') throw new ErroAplicacao('Já existe um livro com este ISBN.', 409);
      throw erro;
    }
  }

  return {
    criar: (dados) => tratarIsbnRepetido(() => prisma.livro.create({ data: dados })),
    buscarPorId: (id) => prisma.livro.findUnique({ where: { id } }),
    buscarPorIsbn: (isbn) => prisma.livro.findUnique({ where: { isbn } }),
    atualizar: (id, dados) => tratarIsbnRepetido(() => prisma.livro.update({ where: { id }, data: dados })),
    remover: (id) => prisma.livro.delete({ where: { id } }),

    async listar({ busca, pagina, limite }) {
      const where = busca
        ? {
            OR: [
              { titulo: { contains: busca, mode: 'insensitive' } },
              { autor: { contains: busca, mode: 'insensitive' } },
            ],
          }
        : {};
      const [itens, total] = await prisma.$transaction([
        prisma.livro.findMany({ where, orderBy: { titulo: 'asc' }, skip: (pagina - 1) * limite, take: limite }),
        prisma.livro.count({ where }),
      ]);
      return { itens, total };
    },
  };
}
