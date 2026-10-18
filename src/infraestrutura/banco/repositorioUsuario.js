import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

export function criarRepositorioUsuario(prisma) {
  return {
    async criar({ nome, email, senhaHash, perfil }) {
      try {
        return await prisma.usuario.create({ data: { nome, email, senhaHash, perfil } });
      } catch (erro) {
        // P2002 = violação de unicidade (e-mail repetido, inclusive em requisições simultâneas)
        if (erro.code === 'P2002') throw new ErroAplicacao('E-mail já cadastrado.', 409);
        throw erro;
      }
    },
    buscarPorEmail: (email) => prisma.usuario.findUnique({ where: { email } }),
    buscarPorId: (id) => prisma.usuario.findUnique({ where: { id } }),
    atualizarSenha: (id, senhaHash) => prisma.usuario.update({ where: { id }, data: { senhaHash } }),
    listar: () => prisma.usuario.findMany({ orderBy: { criadoEm: 'asc' } }),
  };
}
