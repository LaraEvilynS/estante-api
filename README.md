# Estante API

API REST em Node.js para catálogo de livros, avaliações e estante de leitura.

## Sobre o sistema

Leitores cadastram livros no catálogo, organizam sua estante pessoal (quero ler, lendo, lido) e avaliam os livros que já leram. Sistema da categoria **reviews**.

**API externa:** Open Library (busca de dados do livro por título para preencher o cadastro). _(a implementar)_

## Entidades

- **Usuário**: perfil `USUARIO` ou `ADMIN`.
- **Livro**: título, autor, ISBN, capa, páginas, gênero, sinopse.
- **Avaliação**: nota (1 a 5) e comentário de um usuário sobre um livro.
- **Item da estante**: status do livro para o usuário (`QUERO_LER`, `LENDO`, `LIDO`).

## DER

```mermaid
erDiagram
    USUARIO ||--o{ AVALIACAO : escreve
    USUARIO ||--o{ ITEM_ESTANTE : possui
    LIVRO ||--o{ AVALIACAO : recebe
    LIVRO ||--o{ ITEM_ESTANTE : aparece_em
    USUARIO ||--o{ TOKEN_RECUPERACAO_SENHA : solicita

    USUARIO {
        uuid id PK
        string nome
        string email UK
        string senha_hash
        enum perfil "USUARIO | ADMIN"
        datetime criado_em
    }
    LIVRO {
        uuid id PK
        string titulo
        string autor
        string isbn UK
        string url_capa
        int paginas
        string genero
        text sinopse
        datetime criado_em
    }
    AVALIACAO {
        uuid id PK
        uuid usuario_id FK
        uuid livro_id FK
        int nota
        text comentario
        datetime criado_em
    }
    ITEM_ESTANTE {
        uuid id PK
        uuid usuario_id FK
        uuid livro_id FK
        enum status "QUERO_LER | LENDO | LIDO"
        datetime atualizado_em
    }
    TOKEN_RECUPERACAO_SENHA {
        uuid id PK
        uuid usuario_id FK
        string token_hash UK
        datetime expira_em
        datetime usado_em
        datetime criado_em
    }
```

`AVALIACAO` e `ITEM_ESTANTE` têm par único (`usuario_id`, `livro_id`). A nota é limitada de 1 a 5 por uma restrição `CHECK` no banco. Ao excluir um usuário ou livro, suas avaliações e itens de estante são excluídos em cascata. `TOKEN_RECUPERACAO_SENHA` é uma tabela de apoio (guarda só o hash do token) e não conta como entidade de negócio.

## Regras de negócio e permissões

**Livros**
- O catálogo é público: qualquer pessoa lista, busca e consulta livros.
- Só o `ADMIN` cadastra, edita e remove livros. O ISBN (opcional) é único.
- Ao remover um livro, as avaliações e os itens de estante dele são removidos junto.
- A média das notas e o total de avaliações são calculados a partir das avaliações e vêm junto com o livro.

**Estante** (pessoal: cada usuário só vê e altera os próprios itens)
- O usuário adiciona um livro com um status: `QUERO_LER`, `LENDO` ou `LIDO`. Cada livro aparece uma vez por estante.
- Itens de outro usuário respondem 404, como se não existissem.
- Um livro avaliado não pode mudar de `LIDO` nem sair da estante enquanto a avaliação existir.

**Avaliações**
- Só avalia quem marcou o livro como `LIDO`. Uma avaliação por usuário e livro. Nota de 1 a 5, comentário opcional.
- Só o dono edita a avaliação.
- O dono exclui a própria avaliação, e o `ADMIN` exclui qualquer uma (moderação).

| Perfil | Pode |
|---|---|
| Visitante | Ver o catálogo e as avaliações; cadastrar-se, entrar e recuperar a senha |
| `USUARIO` | Tudo do visitante, mais: gerir a própria estante, avaliar livros lidos, editar e excluir as próprias avaliações |
| `ADMIN` | Tudo do usuário, mais: gerir o catálogo de livros, excluir qualquer avaliação e listar usuários |

## Banco de dados

PostgreSQL com [Prisma](https://www.prisma.io/). O esquema fica em `prisma/schema.prisma` e as migrations em `prisma/migrations/`. As migrations são aplicadas automaticamente quando o container da API inicia.

## Como executar

Pré-requisitos: Docker e Docker Compose.

1. Crie o arquivo de ambiente:

       cp .env.example .env

2. Edite o `.env` e troque os valores marcados com `[TROCAR]`: `BANCO_SENHA` (apenas letras e números), `SEGREDO_JWT` e `ADMIN_SENHA`. Para gerar um segredo JWT:

       node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

   (sem Node instalado, use qualquer sequência aleatória com 32 caracteres ou mais)

3. Suba o ambiente:

       docker compose up --build

Verificação: `GET http://localhost:3000/saude` deve retornar `{"status":"ok","banco":"conectado"}`.

| Serviço | Endereço |
|---|---|
| API | http://localhost:3000 |
| Mailpit (caixa de e-mails de teste) | http://localhost:8025 |
| Front-end (repositório `estante-web`) | http://localhost:5173 |

Observações:

- A senha do banco existe em um único lugar (`BANCO_SENHA`); a URL de conexão é montada pelo `docker-compose.yml`.
- O banco só lê usuário e senha na **primeira** criação. Se trocar `BANCO_USUARIO` ou `BANCO_SENHA` depois, rode `docker compose down -v` (apaga os dados locais) e suba de novo.
- O front-end precisa rodar no endereço de `URL_FRONTEND`. Se usar outra porta, altere essa variável e reinicie a API (do contrário o CORS bloqueia as chamadas).
- O administrador inicial é criado automaticamente com `ADMIN_EMAIL` e `ADMIN_SENHA` do `.env`.
- Testes automáticos (sem banco): `npm install && npm test`.

## Autenticação e permissões

Login por e-mail e senha com JWT (expira em `EXPIRACAO_JWT`). Rotas protegidas exigem o cabeçalho `Authorization: Bearer <token>`.

As permissões de cada perfil estão na seção "Regras de negócio e permissões".

Segurança aplicada: senhas com hash bcrypt; perfil nunca vem do cliente (todo cadastro é `USUARIO`); login responde a mesma mensagem para e-mail inexistente e senha errada; limite de tentativas nas rotas `/auth`; validação com Zod; cabeçalhos de segurança (Helmet); CORS restrito ao front; erros sem detalhes internos.

### Recuperação de senha

1. `POST /auth/esqueci-senha` com o e-mail. A resposta é sempre a mesma, exista ou não a conta.
2. A API gera um token aleatório, guarda **somente o hash** dele (válido por `VALIDADE_TOKEN_SENHA_MINUTOS`, uso único) e envia o link por e-mail. Um novo pedido invalida os anteriores.
3. O e-mail chega no Mailpit (http://localhost:8025) com o link `URL_FRONTEND/redefinir-senha?token=...`.
4. `POST /auth/redefinir-senha` com o token e a nova senha.

Limitação conhecida: os tokens JWT já emitidos continuam válidos até expirarem, mesmo depois de uma troca de senha.

## Endpoints

| Método e caminho | Acesso | Corpo | Respostas |
|---|---|---|---|
| `POST /auth/cadastro` | Público | `nome` (2-100), `email`, `senha` (8-72) | 201 `{usuario}`; 400 dados inválidos; 409 e-mail já cadastrado |
| `POST /auth/login` | Público | `email`, `senha` | 200 `{token, usuario}`; 401 credenciais inválidas |
| `POST /auth/esqueci-senha` | Público | `email` | 200 `{mensagem}` |
| `POST /auth/redefinir-senha` | Público | `token`, `novaSenha` (8-72) | 200 `{mensagem}`; 400 token inválido ou expirado |
| `GET /auth/eu` | Autenticado | (nenhum) | 200 `{usuario}`; 401 |
| `GET /usuarios` | `ADMIN` | (nenhum) | 200 `{usuarios}`; 401; 403 |
| `GET /saude` | Público | (nenhum) | 200 API e banco ok; 503 banco fora |
| `GET /livros` | Público | query: `busca`, `pagina` (1), `limite` (12, máx. 50) | 200 `{itens, pagina, limite, total, totalPaginas}` |
| `GET /livros/:id` | Público | (nenhum) | 200 `{livro}` com `mediaNota` e `totalAvaliacoes`; 400 id inválido; 404 |
| `POST /livros` | `ADMIN` | `titulo`, `autor`; opcionais: `isbn`, `urlCapa`, `paginas`, `genero`, `sinopse` | 201 `{livro}`; 400; 401; 403; 409 ISBN repetido |
| `PATCH /livros/:id` | `ADMIN` | qualquer campo de livro (ao menos um); `null` limpa um campo opcional | 200 `{livro}`; 400; 403; 404; 409 |
| `DELETE /livros/:id` | `ADMIN` | (nenhum) | 204; 403; 404 |
| `GET /livros/:id/avaliacoes` | Público | (nenhum) | 200 `{avaliacoes}` (com nome do autor); 404 |
| `POST /livros/:id/avaliacoes` | Autenticado | `nota` (1-5), `comentario` opcional | 201 `{avaliacao}`; 400; 403 livro não lido; 404; 409 já avaliou |
| `PATCH /avaliacoes/:id` | Dono | `nota` e/ou `comentario` | 200 `{avaliacao}`; 400; 403; 404 |
| `DELETE /avaliacoes/:id` | Dono ou `ADMIN` | (nenhum) | 204; 403; 404 |
| `GET /estante` | Autenticado | query opcional: `status` | 200 `{itens}` (cada item com o `livro`) |
| `POST /estante` | Autenticado | `livroId`, `status` | 201 `{item}`; 400; 404; 409 já está na estante |
| `PATCH /estante/:id` | Dono do item | `status` | 200 `{item}`; 400; 404; 409 livro avaliado |
| `DELETE /estante/:id` | Dono do item | (nenhum) | 204; 404; 409 livro avaliado |

Exemplo de login:

    POST /auth/login
    {"email": "admin@estante.local", "senha": "sua_senha_admin"}

    200 OK
    {"token": "eyJhbGciOi...", "usuario": {"id": "...", "nome": "Administrador", "email": "admin@estante.local", "perfil": "ADMIN", "criadoEm": "..."}}

Todo erro tem o formato `{"erro": "mensagem"}`; erros de validação trazem também `detalhes` (lista de `campo` e `mensagem`).

## Collection do Postman

Arquivo: `docs/estante-api.postman_collection.json` (21 requisições organizadas por pasta).

1. No Postman: **Import** e escolha o arquivo.
2. Abra a collection, aba **Variables**, e preencha `adminSenha` com a `ADMIN_SENHA` do seu `.env`. As demais variáveis já têm valores de exemplo (`baseUrl` é `http://localhost:3000`).
3. Ordem sugerida: **Login (administrador)** (salva o token sozinho) > **Livros / Criar livro** (salva `livroId`) > **Cadastro** e **Login (usuário comum)** > **Estante / Adicionar** > **Estante / Atualizar status** para `LIDO` > **Avaliações / Avaliar livro**.
4. A recuperação de senha é testada em **Esqueci a senha**: abra o Mailpit (http://localhost:8025), copie o `token` do link do e-mail para a variável `tokenRecuperacao` e envie **Redefinir senha**.

Os tokens e ids são salvos automaticamente nas variáveis da collection; nenhuma senha real vai no arquivo.

## Estrutura (Clean Architecture)

```
src/
  dominio/          entidades e regras de negócio puras
  aplicacao/        casos de uso e interfaces (repositórios, serviços)
  infraestrutura/   banco, e-mail, API externa
  apresentacao/     rotas, controllers, middlewares (erros globais)
```

## Status

Semana 1: estrutura inicial, DER e ambiente Docker.
Semana 2: modelagem concluída, persistência com Prisma/PostgreSQL e migrations no Docker.
Semana 3: cadastro, login com JWT, perfis (USUARIO e ADMIN) e recuperação de senha por e-mail.
Semana 4: CRUD de livros, estante e avaliações com regras de negócio, e collection do Postman.
