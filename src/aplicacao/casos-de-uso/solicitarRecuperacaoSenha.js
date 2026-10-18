export function criarSolicitarRecuperacaoSenha({
  repositorioUsuario, repositorioTokenSenha, servicoEmail, servicoTokenSeguro, urlFrontend, validadeMinutos,
}) {
  return async function solicitarRecuperacaoSenha({ email }) {
    const usuario = await repositorioUsuario.buscarPorEmail(email);
    // Quem chama sempre recebe a mesma resposta, exista ou não a conta (evita descobrir e-mails cadastrados).
    if (!usuario) return;

    const token = servicoTokenSeguro.gerar();
    const expiraEm = new Date(Date.now() + validadeMinutos * 60 * 1000);

    await repositorioTokenSenha.invalidarDoUsuario(usuario.id);
    // No banco fica só o hash do token; o token em si só existe no e-mail.
    await repositorioTokenSenha.criar({ usuarioId: usuario.id, tokenHash: servicoTokenSeguro.hash(token), expiraEm });

    try {
      await servicoEmail.enviarRecuperacaoSenha({
        para: usuario.email,
        nome: usuario.nome,
        link: `${urlFrontend}/redefinir-senha?token=${token}`,
        validadeMinutos,
      });
    } catch (erro) {
      console.error('Falha ao enviar e-mail de recuperação:', erro.message);
    }
  };
}
