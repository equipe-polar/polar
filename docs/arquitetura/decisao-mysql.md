# Decisão: MySQL 8 como banco de dados oficial

Data: 2026-07-27
Status: aceita e implementada

## Contexto

A API persistia em arquivo JSON — aceitável como estágio de desenvolvimento, mas viola a Definition of Done ("persiste no banco") e o teste T10 (dados sobrevivem a restart do serviço). O acervo do projeto registrava PostgreSQL/Supabase como alvo desde abril, mas a migração foi prometida em três sprints e nunca executada.

## Decisão

Adotar **MySQL 8** como banco oficial, acessado via `mysql2` (pool de conexões + transações), atrás da camada de repositórios já existente. O modo JSON permanece disponível apenas para desenvolvimento rápido (`DATABASE_PROVIDER=json`); **produção exige MySQL** (o boot falha caso contrário).

## Justificativa

1. **Aderência à ementa do curso**: MySQL é o SGBD ensinado em Database Modeling and Development. Na banca, cada categoria de SQL estudada é demonstrável no projeto real:
   - **DDL** — `database/schema.sql` (11 tabelas, FKs, UNIQUE, CHECK, índices);
   - **DML** — seed e INSERTs dos repositórios;
   - **DQL** — consultas de listagem, filtros e relatórios;
   - **DCL** — usuário de aplicação com privilégios mínimos (tarefa do setor de BD);
   - **TCL** — transações reais na criação de ocorrência e na mudança de status (status + histórico + auditoria são atômicos).
2. **Normalização demonstrável**: o modelo está em 3FN (ver [normalizacao.md](../banco-de-dados/normalizacao.md)).
3. **Hospedagem gratuita sem cartão**: TiDB Serverless e Aiven Free são MySQL-compatíveis.
4. **utf8mb4** resolve o bug histórico de acentuação ("Não fez atividade", "Dano ao patrimônio").

## Por que não PostgreSQL/Supabase

Postgres não está na ementa estudada — perderia o argumento "usamos o que aprendemos". Além disso, o histórico do projeto mostra que a migração ao Supabase foi adiada três vezes; a troca para MySQL foi executada **no mesmo dia da decisão**, atrás de interfaces, com testes de contrato.

## Consequências

- Novo diretório `apps/api/src/shared/database/mysql/` com uma implementação por repositório.
- `DATABASE_URL` + `DATABASE_SSL` na configuração; conexões em UTC (`timezone: "Z"`).
- Teste de contrato (`mysql-repositories.contract.test.ts`) roda quando `TEST_DATABASE_URL` está definido; o CI continua verde sem banco.
- O schema Postgres anterior foi substituído por dialeto MySQL em `database/schema.sql`.
