<div align="center">

<img src="apps/web/src/assets/logo-polar.svg" width="72" height="72" alt="Logo do POLAR" />

# POLAR

**Sistema de gestão de ocorrências escolares** — do registro pelo professor ao encerramento pela direção, com histórico imutável e auditável.

[![CI](https://github.com/Origenes-Lessa/P.O.L.A/actions/workflows/ci.yml/badge.svg)](https://github.com/Origenes-Lessa/P.O.L.A/actions/workflows/ci.yml)
[![Licença: MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue.svg)](LICENSE)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_18-61DAFB?logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js_20-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express_5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL_15-4169E1?logo=postgresql&logoColor=white)

[Documentação completa](docs/visao-geral.md) · [Como rodar localmente](#rodar-em-desenvolvimento)

</div>

---

## O problema resolvido

O registro de ocorrências disciplinares hoje é informal (papel, conversa, mensagem avulsa): a informação se perde, não há histórico por aluno, ninguém sabe em que etapa o caso está e nada é rastreável. O POLAR digitaliza o processo em um fluxo institucional único e auditável:

```text
PROFESSOR registra → COORDENAÇÃO analisa/resolve → DIREÇÃO encerra
      (REGISTRADA)      (EM_ANALISE → RESOLVIDA)     (ENCERRADA)
```

Cada ação gera histórico **imutável** (append-only). O valor central é o histórico permanente por aluno — a análise de reincidência.

## Funcionalidades

- **Registro de ocorrências** com aluno, categoria, prioridade e descrição — autor e data sempre derivados no backend.
- **Máquina de estados fechada**: 4 status, 3 transições, cada uma restrita a um papel. Pular etapa é rejeitado (`409`).
- **Histórico append-only**: toda ação (criação, edição, transição) gera um registro imutável, com observação opcional do responsável.
- **Visibilidade por papel**: professor vê só o que registrou; coordenação, direção e administração veem tudo.
- **Notas, faltas, dashboard e relatórios** por turma e aluno.
- **Auditoria completa** de login, criação/edição de entidades e mudanças de status.

## Stack técnico

| Camada | Tecnologia |
| --- | --- |
| Frontend | React 18 + TypeScript + Vite + React Router |
| Backend | Node.js 20 + Express 5 + TypeScript |
| Banco de dados | PostgreSQL 15 (Supabase) via `pg`, com transações reais |
| Validação | Zod |
| Segurança | JWT, bcrypt, helmet, rate-limit + bloqueio de login, RBAC no backend |
| Testes | Vitest + Supertest (integração da API) + Testing Library (web) |
| CI/CD | GitHub Actions (lint, typecheck, test, build); deploy pela integração Git da Vercel |
| Deploy | Vercel (SPA estático no CDN + API Express como função sob `/api`) |
| Monorepo | pnpm workspaces |

## Arquitetura

```mermaid
flowchart LR
    subgraph Apresentacao
        WEB["apps/web<br/>React 18 + Vite + TypeScript"]
    end
    subgraph Aplicacao
        API["apps/api<br/>Node.js 20 + Express 5 + TypeScript"]
        AUTH["Auth: JWT + bcrypt"]
        RBAC["Permissões por papel"]
        VAL["Validação: Zod"]
    end
    subgraph Persistencia
        PG[("PostgreSQL 15<br/>Supabase")]
    end
    WEB -- "HTTP/JSON (REST)" --> API
    API --- AUTH
    API --- RBAC
    API --- VAL
    API -- "pg (pool + transações)" --> PG
```

Detalhamento completo (padrões, camadas, decisões): [docs/arquitetura/arquitetura.md](docs/arquitetura/arquitetura.md).

## Modelo de segurança

| Medida | Implementação |
| --- | --- |
| Senhas | bcrypt (custo 10); nenhuma resposta expõe hash |
| Autenticação | JWT assinado, expiração configurável; bloqueio após 5 tentativas inválidas |
| Autorização | RBAC aplicado no backend em toda rota — a UI só oculta, nunca é a autoridade |
| Entrada | Zod em 100% dos endpoints; caracteres de controle rejeitados; HTML removido |
| Banco | Queries 100% parametrizadas via `pg` (`$1..$n`); zero concatenação de SQL |
| Cabeçalhos | `helmet` (CSP, X-Content-Type-Options, etc.) |
| Auditoria | Log de login, criação/edição e transições de status |

Detalhamento completo + análise LGPD (dados de menores): [docs/seguranca-e-lgpd.md](docs/seguranca-e-lgpd.md).

## Rodar em desenvolvimento

Pré-requisitos: Node 20+, pnpm 9 (`npm i -g pnpm@9.15.4`), Docker (para o PostgreSQL local).

```bash
pnpm install
```

Suba o PostgreSQL e aplique o schema:

```bash
docker run --name polar-pg -e POSTGRES_USER=polar -e POSTGRES_PASSWORD=polar \
  -e POSTGRES_DB=polar -p 5432:5432 -d postgres:16
psql postgresql://polar:polar@localhost:5432/polar -f database/schema.sql
```

Crie `apps/api/.env` a partir de `apps/api/.env.example`:

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=um-segredo-forte-com-pelo-menos-32-caracteres
DATABASE_PROVIDER=postgres
DATABASE_URL=postgresql://polar:polar@localhost:5432/polar
DATABASE_SSL=false
SEED_SENHA_PADRAO=SenhaDemo1!
```

Popule os dados de demonstração e suba tudo:

```bash
pnpm seed
pnpm dev
```

- Web: <http://localhost:5173> — API: <http://localhost:3000/health>
- Contas de controle (uma por papel): `professor@`, `coordenacao@`, `direcao@`, `adm@` e `aluno@escola.polar` — senha = `SEED_SENHA_PADRAO`.

> Sem Docker? `DATABASE_PROVIDER=json` roda a API com persistência em arquivo — **apenas** para desenvolvimento; produção exige PostgreSQL (o boot falha sem ele).

## Qualidade

```bash
pnpm lint        # ESLint
pnpm typecheck   # tsc API + web
pnpm test        # Vitest API (integração HTTP real) + web
pnpm build       # build de produção
```

O CI executa os quatro em todo push/PR. O teste de contrato dos repositórios PostgreSQL roda quando `TEST_DATABASE_URL` aponta para um banco com o schema aplicado.

## Deploy

SPA estático no CDN da Vercel + API como função serverless, banco PostgreSQL gratuito no Supabase, custo zero.
Passo a passo: [docs/deploy/supabase.md](docs/deploy/supabase.md) (banco, primeiro) e [docs/deploy/vercel.md](docs/deploy/vercel.md) (aplicação).

```text
[Browser] → Vercel (CDN: build React  |  função: API Express em /api) → Supabase (PostgreSQL)
```

## Regras de negócio inegociáveis

1. Só existem 4 estados e 3 transições, cada uma restrita a um papel. Pular etapa → `409`.
2. Professor não altera status; professor só vê as próprias ocorrências.
3. Edição: só o autor, só em `REGISTRADA`, sempre com registro de histórico.
4. Histórico é append-only em todas as camadas; tentativa de edição → `405`.
5. Ocorrência `ENCERRADA` é somente leitura, para sempre.
6. Exclusão física não existe: alunos, turmas e usuários são **inativados**.
7. Autor e data são derivados no backend, nunca digitados.
8. O backend é a autoridade única de permissão; a UI apenas oculta.
9. Aluno nunca é usuário do sistema.
10. Acentuação PT-BR é válida por definição (utf8mb4 + validadores).

## Fluxo de trabalho

- `master` é a única branch de longa duração e é protegida: PR obrigatório, CI verde é pré-condição de merge.
- Toda mudança nasce como `feature/<nome-curto>` (ou `fix/<nome-curto>`) e morre após o merge.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).

## Estrutura

```text
apps/api/       Express + TS (módulos: auth, usuarios, turmas, alunos, ocorrencias,
                notas, faltas, dashboard, relatorios, auditoria)
apps/web/       React + TS (13 telas)
database/       schema.sql (DDL PostgreSQL) + contas.ts + seed.ts (dados de demonstração)
docs/           documentação completa (produto, arquitetura, banco, testes, segurança, deploy)
scripts/        migração de dados legados
```

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [docs/visao-geral.md](docs/visao-geral.md) | Problema, papéis, escopo, critério de aceite |
| [docs/arquitetura/arquitetura.md](docs/arquitetura/arquitetura.md) | 3 camadas, padrões, diagramas |
| [docs/arquitetura/decisao-postgres.md](docs/arquitetura/decisao-postgres.md) | ADR: por que PostgreSQL/Supabase |
| [docs/banco-de-dados/modelo-relacional.md](docs/banco-de-dados/modelo-relacional.md) | DER + dicionário de dados |
| [docs/banco-de-dados/normalizacao.md](docs/banco-de-dados/normalizacao.md) | 1FN→3FN com o modelo real |
| [docs/api/endpoints.md](docs/api/endpoints.md) | Tabela completa de endpoints |
| [docs/fluxos/fluxo-ocorrencias.md](docs/fluxos/fluxo-ocorrencias.md) | Máquina de estados e regras |
| [docs/testes/plano-de-testes.md](docs/testes/plano-de-testes.md) | T01–T16 com evidências |
| [docs/seguranca-e-lgpd.md](docs/seguranca-e-lgpd.md) | OWASP + LGPD (dados de menores) |
| [docs/uso-de-ia.md](docs/uso-de-ia.md) | Declaração de uso de IA |
| [docs/deploy/supabase.md](docs/deploy/supabase.md) | Passo a passo do banco no Supabase |
| [docs/deploy/vercel.md](docs/deploy/vercel.md) | Passo a passo do deploy na Vercel |
| [docs/demo/roteiro-apresentacao.md](docs/demo/roteiro-apresentacao.md) | Roteiro ensaiável da banca |

## Roadmap

- [x] Persistência PostgreSQL real com transações
- [x] RBAC completo com regras de visibilidade e edição fechadas
- [x] Docker + CI/CD (lint, typecheck, test, build)
- [x] Prova de execução real contra PostgreSQL na nuvem (teste de contrato + seed rodando no Supabase)
- [ ] Deploy público no ar
- [ ] Roteiro de 6 passos executado na URL pública

## Licença

Distribuído sob a licença [MIT](LICENSE).
