export function criarRepositorioTokenSenha(prisma) {
  return {
    criar: ({ usuarioId, tokenHash, expiraEm }) =>
      prisma.tokenRecuperacaoSenha.create({ data: { usuarioId, tokenHash, expiraEm } }),

    // Invalida pedidos anteriores ainda não usados do mesmo usuário.
    invalidarDoUsuario: (usuarioId) =>
      prisma.tokenRecuperacaoSenha.updateMany({
        where: { usuarioId, usadoEm: null },
        data: { usadoEm: new Date() },
      }),

    // Marca como usado só se ainda for válido. O updateMany é atômico: dois usos simultâneos não passam.
    async consumir(tokenHash, agora) {
      const resultado = await prisma.tokenRecuperacaoSenha.updateMany({
        where: { tokenHash, usadoEm: null, expiraEm: { gt: agora } },
        data: { usadoEm: agora },
      });
      if (resultado.count !== 1) return null;
      return prisma.tokenRecuperacaoSenha.findUnique({ where: { tokenHash }, select: { usuarioId: true } });
    },
  };
}
