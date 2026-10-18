import nodemailer from 'nodemailer';

export function criarServicoEmail({ host, porta, remetente }) {
  const transporte = nodemailer.createTransport({ host, port: porta, secure: false });

  return {
    async enviarRecuperacaoSenha({ para, nome, link, validadeMinutos }) {
      await transporte.sendMail({
        from: remetente,
        to: para,
        subject: 'Recuperação de senha - Estante',
        text:
          `Olá, ${nome}!\n\n` +
          `Recebemos um pedido para redefinir a senha da sua conta na Estante.\n` +
          `Acesse o link abaixo (válido por ${validadeMinutos} minutos, uso único):\n\n${link}\n\n` +
          `Se não foi você, ignore este e-mail: sua senha continua a mesma.`,
      });
    },
  };
}
