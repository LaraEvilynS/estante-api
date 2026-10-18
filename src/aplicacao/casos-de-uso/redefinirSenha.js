import { ErroAplicacao } from '../../dominio/erros/ErroAplicacao.js';

export function criarRedefinirSenha({ repositorioTokenSenha, repositorioUsuario, servicoHash, servicoTokenSeguro }) {
  return async function redefinirSenha({ token, novaSenha }) {
    // Consome o token de forma atômica: só funciona se existir, não estiver usado e não tiver expirado.
    const registro = await repositorioTokenSenha.consumir(servicoTokenSeguro.hash(token), new Date());
    if (!registro) {
      throw new ErroAplicacao('Token inválido ou expirado.', 400);
    }
    const senhaHash = await servicoHash.gerar(novaSenha);
    await repositorioUsuario.atualizarSenha(registro.usuarioId, senhaHash);
  };
}
