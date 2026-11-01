import { criarCadastrarUsuario } from './aplicacao/casos-de-uso/cadastrarUsuario.js';
import { criarAutenticarUsuario } from './aplicacao/casos-de-uso/autenticarUsuario.js';
import { criarSolicitarRecuperacaoSenha } from './aplicacao/casos-de-uso/solicitarRecuperacaoSenha.js';
import { criarRedefinirSenha } from './aplicacao/casos-de-uso/redefinirSenha.js';
import { criarBuscarUsuarioAtual } from './aplicacao/casos-de-uso/buscarUsuarioAtual.js';
import { criarListarUsuarios } from './aplicacao/casos-de-uso/listarUsuarios.js';
import { criarGarantirAdmin } from './aplicacao/casos-de-uso/garantirAdmin.js';
import { criarBuscarLivrosExternos } from './aplicacao/casos-de-uso/livros/buscarLivrosExternos.js';
import { criarDetalharLivroExterno } from './aplicacao/casos-de-uso/livros/detalharLivroExterno.js';
import { criarAtualizarPerfil } from './aplicacao/casos-de-uso/usuarios/atualizarPerfil.js';
import { criarAlterarSenha } from './aplicacao/casos-de-uso/usuarios/alterarSenha.js';
import { criarExcluirConta } from './aplicacao/casos-de-uso/usuarios/excluirConta.js';
import { criarExcluirUsuario } from './aplicacao/casos-de-uso/usuarios/excluirUsuario.js';
import { criarCriarLivro } from './aplicacao/casos-de-uso/livros/criarLivro.js';
import { criarListarLivros } from './aplicacao/casos-de-uso/livros/listarLivros.js';
import { criarBuscarLivro } from './aplicacao/casos-de-uso/livros/buscarLivro.js';
import { criarAtualizarLivro } from './aplicacao/casos-de-uso/livros/atualizarLivro.js';
import { criarRemoverLivro } from './aplicacao/casos-de-uso/livros/removerLivro.js';
import { criarAdicionarNaEstante } from './aplicacao/casos-de-uso/estante/adicionarNaEstante.js';
import { criarListarEstante } from './aplicacao/casos-de-uso/estante/listarEstante.js';
import { criarAtualizarItemEstante } from './aplicacao/casos-de-uso/estante/atualizarItemEstante.js';
import { criarRemoverItemEstante } from './aplicacao/casos-de-uso/estante/removerItemEstante.js';
import { criarCriarAvaliacao } from './aplicacao/casos-de-uso/avaliacoes/criarAvaliacao.js';
import { criarListarAvaliacoesDoLivro } from './aplicacao/casos-de-uso/avaliacoes/listarAvaliacoesDoLivro.js';
import { criarAtualizarAvaliacao } from './aplicacao/casos-de-uso/avaliacoes/atualizarAvaliacao.js';
import { criarRemoverAvaliacao } from './aplicacao/casos-de-uso/avaliacoes/removerAvaliacao.js';

// Ponto de composição: recebe as implementações concretas (banco, e-mail, JWT...)
// e as entrega aos casos de uso. As regras de negócio não conhecem esses detalhes.
export function montarCasosDeUso({
  repositorioUsuario, repositorioTokenSenha, repositorioLivro, repositorioItemEstante, repositorioAvaliacao,
  servicoLivrosExternos, servicoHash, servicoToken, servicoTokenSeguro, servicoEmail, urlFrontend, validadeTokenSenhaMinutos,
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

    atualizarPerfil: criarAtualizarPerfil({ repositorioUsuario }),
    alterarSenha: criarAlterarSenha({ repositorioUsuario, servicoHash }),
    excluirConta: criarExcluirConta({ repositorioUsuario, servicoHash }),
    excluirUsuario: criarExcluirUsuario({ repositorioUsuario }),

    buscarLivrosExternos: criarBuscarLivrosExternos({ servicoLivrosExternos }),
    detalharLivroExterno: criarDetalharLivroExterno({ servicoLivrosExternos }),
    criarLivro: criarCriarLivro({ repositorioLivro }),
    listarLivros: criarListarLivros({ repositorioLivro, repositorioAvaliacao }),
    buscarLivro: criarBuscarLivro({ repositorioLivro, repositorioAvaliacao }),
    atualizarLivro: criarAtualizarLivro({ repositorioLivro, repositorioAvaliacao }),
    removerLivro: criarRemoverLivro({ repositorioLivro }),

    adicionarNaEstante: criarAdicionarNaEstante({ repositorioLivro, repositorioItemEstante }),
    listarEstante: criarListarEstante({ repositorioItemEstante }),
    atualizarItemEstante: criarAtualizarItemEstante({ repositorioItemEstante, repositorioAvaliacao }),
    removerItemEstante: criarRemoverItemEstante({ repositorioItemEstante, repositorioAvaliacao }),

    criarAvaliacao: criarCriarAvaliacao({ repositorioLivro, repositorioItemEstante, repositorioAvaliacao }),
    listarAvaliacoesDoLivro: criarListarAvaliacoesDoLivro({ repositorioLivro, repositorioAvaliacao }),
    atualizarAvaliacao: criarAtualizarAvaliacao({ repositorioAvaliacao }),
    removerAvaliacao: criarRemoverAvaliacao({ repositorioAvaliacao }),
  };
}
