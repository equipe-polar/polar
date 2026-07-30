# Decisão: PostgreSQL no Supabase como banco oficial, Vercel como deploy

Data: 2026-07-30
Status: aceita e implementada
Substitui: a decisão de 2026-07-27 que adotava MySQL 8 no TiDB Serverless (registrada abaixo, em "Histórico")

## Contexto

Em 27/07 o projeto migrou de persistência JSON para MySQL 8 hospedado no TiDB Serverless, e ganhou o primeiro deploy real, no Render. Tecnicamente a migração cumpriu o que prometia: transações reais, schema normalizado, teste de contrato contra banco de verdade.

O que não se sustentou foi o uso diário. Nas semanas seguintes ficou claro que:

- o painel do TiDB é orientado a operador de banco, não a estudante conferindo uma tabela; tarefas triviais (olhar as linhas de `users`, rodar um SELECT rápido) custavam tempo demais para quem não é DBA;
- o plano gratuito do Render hiberna após ~15 minutos, com retorno de ~50 segundos. Foi preciso criar um workflow de keepalive só para disfarçar isso, e ainda assim a primeira visita de qualquer avaliador pegava a aplicação dormindo;
- as duas ferramentas somadas criavam atrito em cada demonstração, que é justamente o momento em que o projeto precisa funcionar sem explicação.

Em paralelo, os serviços saíram da conta pessoal do líder do projeto para uma conta dedicada, o que tornou este o momento certo para recriar a infraestrutura do zero em vez de transferir a existente.

## Decisão

Voltar para **PostgreSQL hospedado no Supabase** e trocar o deploy do Render pela **Vercel**.

O modo JSON permanece para desenvolvimento rápido e testes (`DATABASE_PROVIDER=json`); **produção exige PostgreSQL** (o boot falha caso contrário). O MySQL foi removido — manter três providers triplicaria a superfície do contrato compartilhado sem ninguém usando o terceiro.

## Justificativa

1. **Usabilidade da equipe é um requisito, não um detalhe.** O Table Editor e o SQL Editor do Supabase deixam qualquer integrante inspecionar e corrigir dados sem cliente instalado. Isso é o que fazia falta.
2. **A defesa acadêmica não é perdida.** Todas as categorias de SQL estudadas continuam demonstráveis no código, e o PostgreSQL as expressa igual ou melhor:
   - **DDL** — `database/schema.sql`: 10 tabelas, tipos `ENUM` nomeados, FKs, `UNIQUE`, `CHECK`, índices (inclusive funcionais sobre `LOWER()`);
   - **DML** — seed e INSERTs dos repositórios, com `ON CONFLICT` no lugar de `ON DUPLICATE KEY`;
   - **DQL** — consultas de listagem, filtros e relatórios;
   - **DCL** — usuário de aplicação com privilégios mínimos;
   - **TCL** — transações reais na criação de ocorrência e na mudança de status, com `SELECT ... FOR UPDATE` travando a linha.
3. **A migração custou pouco porque a arquitetura previa isso.** `shared/database/repositories/*` são interfaces; trocar de SGBD foi escrever uma nova implementação e apagar a antiga. Nenhum serviço, controller ou rota mudou por causa do banco. É a segunda vez que essa camada paga o próprio preço — antes em JSON → MySQL, agora em MySQL → PostgreSQL.
4. **Sem hibernação.** A Vercel não dorme, e o workflow de keepalive foi eliminado junto com o Render.
5. **UTF-8 nativo** resolve a acentuação PT-BR ("Não fez atividade", "Dano ao patrimônio") sem a configuração de charset que o MySQL exigia.

## Consequências

- Novo diretório `apps/api/src/shared/database/postgres/`, uma implementação por repositório; `mysql/` removido. Dependência `mysql2` → `pg`.
- Dois parsers de tipo registrados em `postgres-client.ts`, ambos corrigindo quebras silenciosas: `NUMERIC` volta como `number` (senão `notas.valor` chegaria como string) e `DATE` volta como string `YYYY-MM-DD` (senão o dia civil se deslocaria em fusos a oeste de Greenwich).
- **A API passou a viver sob `/api`.** Antes os routers ficavam na raiz e colidiam por nome com as rotas do React (`/alunos`, `/turmas`, `/usuarios`), desambiguados por um truque de ordenação baseado no header `Accept: text/html`. Roteamento de CDN é por caminho e não replica esse discriminador. Com o prefixo, a Vercel serve o SPA estaticamente e encaminha só `/api/*` para a função.
- Nova função serverless em `api/index.ts` e `vercel.json` na raiz. `server.ts` e o `Dockerfile` continuam válidos como rota de fuga: um serviço só, servindo API e SPA na mesma origem.
- `render.yaml`, `docs/deploy/render.md` e o workflow de keepalive foram removidos.
- O rate limit de login em memória (`login-rate-limit.ts`) deixa de ser confiável com N instâncias efêmeras. O bloqueio por tentativas de `auth.service.ts` persiste no banco e continua sendo o mecanismo real; consolidar os dois fica para outra onda.
- Teste de contrato renomeado para `postgres-repositories.contract.test.ts`, agora cobrindo também o retorno de `NUMERIC` e `DATE`. Roda quando `TEST_DATABASE_URL` está definido; o CI segue verde sem banco.

## Histórico: a decisão anterior (2026-07-27)

Registrada aqui porque explica escolhas ainda visíveis no código (nomenclatura das colunas, `CHAR(36)` para UUID, datas geradas pela aplicação).

A API persistia em arquivo JSON, o que violava a Definition of Done ("persiste no banco") e o teste T10 (dados sobrevivem a restart). Adotou-se MySQL 8 via `mysql2`, hospedado no TiDB Serverless, com deploy Docker no Render. O argumento central era aderência à ementa do curso — MySQL é o SGBD ensinado em Database Modeling and Development — e a existência de hospedagem gratuita sem cartão. O contra-argumento a PostgreSQL/Supabase, na época, foi que o Postgres estava fora da ementa e que a migração para o Supabase já havia sido adiada três vezes.

O que aquela decisão não pesou foi o custo de operação diária para uma equipe sem DBA. É o ponto que esta decisão corrige. O modelo relacional em si permanece: normalizado em 3FN (ver [normalizacao.md](../banco-de-dados/normalizacao.md)), com os mesmos nomes de tabela e coluna.
