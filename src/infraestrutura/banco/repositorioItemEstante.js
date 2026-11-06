import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

const comLivro = { livro: true };

export function criarRepositorioItemEstante(prisma) {
  return {
    async criar({ usuarioId, livroId, status }) {
      try {
        return await prisma.itemEstante.create({ data: { usuarioId, livroId, status }, include: comLivro });
      } catch (erro) {
        if (erro.code === 'P2002') throw new ErroAplicacao('Este livro já está na sua estante.', 409);
        throw erro;
      }
    },
    buscarPorId: (id) => prisma.itemEstante.findUnique({ where: { id } }),
    buscarPorUsuarioELivro: (usuarioId, livroId) =>
      prisma.itemEstante.findUnique({ where: { usuarioId_livroId: { usuarioId, livroId } } }),
    listarDoUsuario: (usuarioId, status) =>
      prisma.itemEstante.findMany({
        where: { usuarioId, ...(status ? { status } : {}) },
        include: comLivro,
        orderBy: { atualizadoEm: 'desc' },
      }),
    atualizarStatus: (id, status) => prisma.itemEstante.update({ where: { id }, data: { status }, include: comLivro }),
    remover: (id) => prisma.itemEstante.delete({ where: { id } }),
  };
}
