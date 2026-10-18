import { criarCadastrarUsuario } from './aplicacao/casos-de-uso/cadastrarUsuario.js';
import { criarAutenticarUsuario } from './aplicacao/casos-de-uso/autenticarUsuario.js';
import { criarSolicitarRecuperacaoSenha } from './aplicacao/casos-de-uso/solicitarRecuperacaoSenha.js';
import { criarRedefinirSenha } from './aplicacao/casos-de-uso/redefinirSenha.js';
import { criarBuscarUsuarioAtual } from './aplicacao/casos-de-uso/buscarUsuarioAtual.js';
import { criarListarUsuarios } from './aplicacao/casos-de-uso/listarUsuarios.js';
import { criarGarantirAdmin } from './aplicacao/casos-de-uso/garantirAdmin.js';

// Ponto de composição: recebe as implementações concretas (banco, e-mail, JWT...)
// e as entrega aos casos de uso. As regras de negócio não conhecem esses detalhes.
export function montarCasosDeUso({
  repositorioUsuario, repositorioTokenSenha, servicoHash, servicoToken,
  servicoTokenSeguro, servicoEmail, urlFrontend, validadeTokenSenhaMinutos,
}) {
  return {
    cadastrarUsuario: criarCadastrarUsuario({ repositorioUsuario, servicoHash }),
    autenticarUsuario: criarAutenticarUsuario({ repositorioUsuario, servicoHash, servicoToken }),
    solicitarRecuperacaoSenha: criarSolicitarRecuperacaoSenha({
      repositorioUsuario, repositorioTokenSenha, servicoEmail, servicoTokenSeguro,
      urlFrontend, validadeMinutos: validadeTokenSenhaMinutos,
    }),
    redefinirSenha: criarRedefinirSenha({ repositorioTokenSenha, repositorioUsuario, servicoHash, servicoTokenSeguro }),
    buscarUsuarioAtual: criarBuscarUsuarioAtual({ repositorioUsuario }),
    listarUsuarios: criarListarUsuarios({ repositorioUsuario }),
    garantirAdmin: criarGarantirAdmin({ repositorioUsuario, servicoHash }),
  };
}
