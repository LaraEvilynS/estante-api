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

- Um usuário avalia um livro uma única vez, e só se ele estiver como `LIDO` na estante.
- O dono edita e exclui a própria avaliação; o `ADMIN` exclui qualquer uma.
- Só o `ADMIN` cadastra, edita e remove livros.
- A média das notas do livro é calculada a partir das avaliações.

## Banco de dados

PostgreSQL com [Prisma](https://www.prisma.io/). O esquema fica em `prisma/schema.prisma` e as migrations em `prisma/migrations/`. As migrations são aplicadas automaticamente quando o container da API inicia.

## Como executar

Pré-requisitos: Docker e Docker Compose.

```bash
cp .env.example .env
# edite o .env e troque as senhas e o segredo JWT
docker-compose up --build
```

Verificação: `GET http://localhost:3000/saude` deve retornar `{"status":"ok","banco":"conectado"}`.
Caixa de e-mails de teste (Mailpit): http://localhost:8025

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
