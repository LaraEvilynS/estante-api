import { PERFIS } from '../../dominio/usuario.js';

// Cria o administrador inicial (dados vindos do .env) se ele ainda não existir.
export function criarGarantirAdmin({ repositorioUsuario, servicoHash }) {
  return async function garantirAdmin({ nome, email, senha }) {
    if (await repositorioUsuario.buscarPorEmail(email)) return false;
    const senhaHash = await servicoHash.gerar(senha);
    await repositorioUsuario.criar({ nome, email, senhaHash, perfil: PERFIS.ADMIN });
    return true;
  };
}
