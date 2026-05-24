# P.O.L.A

P.O.L.A e um sistema escolar para registro, acompanhamento e auditoria de ocorrencias institucionais.

## Problema Resolvido

Escolas precisam registrar ocorrencias de forma padronizada, acompanhar responsaveis por cada etapa, preservar historico auditavel e impedir alteracoes indevidas depois do encerramento.

## Funcionalidades Do MVP

- Autenticacao JWT.
- Controle por papeis: `PROFESSOR`, `COORDENADOR`, `DIRETOR`, `ADM`.
- Gestao de usuarios, turmas e alunos.
- Registro e acompanhamento de ocorrencias.
- Historico automatico e imutavel de ocorrencias.
- Notas, faltas, dashboard, relatorios, auditoria e notificacoes.
- Validacao de entrada com Zod.
- Testes de integracao da API com Vitest e Supertest.
- Frontend React + TypeScript com layout institucional.

## Arquitetura Atual

A logica principal foi migrada para Node.js + TypeScript em `apps/api`. O frontend ativo fica em `apps/web` com React + TypeScript + Vite. O HTML antigo foi preservado em `legacy/frontend-html` apenas como prototipo visual.

```text
apps/
  api/
    src/modules/
    src/shared/
    tests/
  web/
    src/
    index.html
database/
docs/
legacy/frontend-html/
legacy/python/
scripts/
```

## Tecnologias

- Node.js 20+
- TypeScript
- Express
- React
- Vite
- React Router
- Zod
- JWT
- bcryptjs
- Vitest
- Supertest
- pnpm workspaces
- PostgreSQL/Supabase planejado via `database/schema.sql`

## Instalar

```bash
pnpm install
```

Se `pnpm` nao existir na maquina:

```bash
npm install -g pnpm@9.15.4
```

## Configurar Ambiente

Crie `apps/api/.env` a partir de `apps/api/.env.example`.

```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=troque-por-um-segredo-forte-com-32-caracteres
JWT_EXPIRES_IN=8h
DATABASE_PROVIDER=json
DATABASE_JSON_PATH=apps/api/data/dev-db.json
BOOTSTRAP_ADMIN_EMAIL=admin@pola.local
BOOTSTRAP_ADMIN_PASSWORD=
```

`JWT_SECRET` e obrigatorio. A API falha ao iniciar se ele nao estiver configurado. Nao versionar `.env` real.

Para o frontend, crie `apps/web/.env` a partir de `apps/web/.env.example` quando precisar apontar para outra API:

```env
VITE_API_URL=http://localhost:3000
```

## Rodar Em Desenvolvimento

```bash
pnpm dev
```

Esse comando sobe API e web em paralelo. Para rodar separadamente:

```bash
pnpm --filter @pola/api dev
pnpm --filter web dev
```

Health check:

```bash
curl http://localhost:3000/health
```

O frontend Vite roda por padrao em `http://localhost:5173`.

## Testes, Lint, Typecheck E Build

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Somente frontend:

```bash
pnpm --filter web test
pnpm --filter web build
```

## Frontend

Estrutura principal:

```text
apps/web/
  src/app/
  src/components/
  src/features/
  src/services/
  src/styles/
```

Telas disponiveis:

- login
- dashboard
- ocorrencias
- nova ocorrencia
- detalhe da ocorrencia
- alunos
- perfil/historico do aluno
- turmas
- usuarios
- relatorios
- configuracoes
- acesso negado
- pagina nao encontrada

Documentacao visual: `docs/frontend/guia-visual.md`.  
Catalogo de telas: `docs/frontend/telas.md`.

As telas principais consomem a API em `VITE_API_URL` por meio de servicos HTTP tipados. Dados simulados ficam restritos aos testes automatizados.

## Autenticacao

Login:

```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@escola.test",
  "senha": "senha-forte"
}
```

Resposta:

```json
{
  "token": "jwt",
  "user": {
    "id": "uuid",
    "nome": "Usuario",
    "email": "usuario@escola.test",
    "papel": "PROFESSOR"
  }
}
```

Nenhuma resposta retorna `senhaHash`, `senha_hash`, `password_hash` ou segredo.

## Permissoes

- `PROFESSOR`: registra ocorrencia, consulta ocorrencias permitidas, historico permitido e alunos permitidos.
- `COORDENADOR`: consulta ocorrencias, coloca em analise, resolve ocorrencias e acessa relatorios operacionais.
- `DIRETOR`: consulta ocorrencias, encerra ocorrencia e consulta relatorios gerais.
- `ADM`: gerencia usuarios, turmas, alunos, permissoes, configuracoes e auditoria.

## Fluxo De Ocorrencia

Status oficiais:

- `REGISTRADA`
- `EM_ANALISE`
- `RESOLVIDA`
- `ENCERRADA`

Fluxo permitido:

```text
REGISTRADA -> EM_ANALISE -> RESOLVIDA -> ENCERRADA
```

Nao e permitido pular etapas. Ocorrencia encerrada nao pode ser alterada. Historico e criado automaticamente e nao possui rota de edicao.

## Endpoints Principais

- `POST /auth/login`
- `GET /auth/me`
- `GET /usuarios`
- `POST /usuarios`
- `GET /turmas`
- `POST /turmas`
- `GET /alunos`
- `POST /alunos`
- `POST /ocorrencias`
- `PATCH /ocorrencias/:id/status`
- `GET /ocorrencias/:id/historico`
- `POST /notas`
- `GET /notas/alunos/:alunoId`
- `POST /faltas`
- `GET /faltas/alunos/:alunoId`
- `GET /dashboard`
- `GET /relatorios/ocorrencias`
- `GET /auditoria`

Tabela completa: `docs/api/endpoints.md`.

## Banco De Dados

O contrato relacional esta em `database/schema.sql`. Enquanto PostgreSQL/Supabase nao estiver conectado, a API usa JSON temporario atras de repositorios em `apps/api/src/shared/database/repositories`.

## Migrar Dados Antigos

O script inicial le `backend/banco_dados.json` quando existir ou `legacy/python/backend/banco_dados.json` como fallback:

```bash
pnpm migrate:json
```

Ele gera `apps/api/data/migrated-from-legacy.json`. A migracao real para PostgreSQL deve importar esse contrato para as tabelas de `database/schema.sql`.

## Branches

Fluxo recomendado:

```text
master
  ^
develop
  ^
feature/nome-da-funcionalidade
```

Nao fazer push direto na `master`. Use `develop` para integracao e abra PR para promover codigo estavel.

## Commits

Use commits curtos e objetivos:

- `feat: adiciona fluxo de ocorrencias`
- `fix: bloqueia login apos tentativas invalidas`
- `docs: atualiza endpoints`
- `test: cobre regras de status`

## Roadmap

- Conectar PostgreSQL/Supabase.
- Criar migrations versionadas.
- Adicionar refresh token e recuperacao de senha.
- Refinar permissoes por turma/aluno.
- Criar relatorios exportaveis.
- Criar telas completas de edicao para usuarios e alunos.

## Limitacoes Conhecidas

- Persistencia JSON e temporaria para desenvolvimento.
- Edicao completa de usuarios e alunos ainda precisa de telas dedicadas.
- Exportacao de relatorios ainda e funcionalidade futura.
- Migracao de dados reais precisa validacao manual antes de producao.
- Python legado nao participa da build da API nova.
