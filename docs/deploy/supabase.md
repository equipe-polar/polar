# Banco de dados no Supabase (PostgreSQL)

Roteiro para criar o banco do POLAR do zero na conta dedicada do projeto. Leva cerca de 10 minutos e não custa nada no plano gratuito.

O deploy da aplicação está em [`vercel.md`](vercel.md). Faça este primeiro: a Vercel precisa da connection string que sai daqui.

---

## 1. Criar o projeto

No painel do Supabase, **New project**:

| Campo | Valor |
|---|---|
| Name | `polar` |
| Database Password | a senha padrão do projeto — **guarde**, ela não é exibida de novo |
| Region | `South America (São Paulo)` |
| Plan | Free |

A criação leva 1 a 2 minutos.

## 2. Aplicar o schema

**SQL Editor** → **New query**. Cole o conteúdo inteiro de `database/schema.sql` e rode.

O arquivo é idempotente (`CREATE TABLE IF NOT EXISTS`, `CREATE TYPE` dentro de bloco `DO`, `ON CONFLICT` no INSERT das categorias), então rodar duas vezes não quebra nada.

Ao final você deve ter 9 tabelas em **Table Editor**: `users`, `turmas`, `alunos`, `categorias_ocorrencia`, `ocorrencias`, `ocorrencia_historico`, `notas`, `faltas`, `audit_logs`.

## 3. Pegar a connection string

**Project Settings** → **Database** → **Connection string** → aba **URI**.

O Supabase oferece três modos. **Use o Transaction pooler**, porta `6543`:

```
postgresql://postgres.<ref>:<SENHA>@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
```

Por quê: a Vercel cria uma instância por invocação, e cada instância abriria a própria conexão. A conexão direta (porta `5432`) tem um limite baixo de conexões simultâneas e é o jeito mais rápido de derrubar a aplicação sob uso normal. O transaction pooler (pgbouncer) existe exatamente para esse cenário — e `createPostgresPool` já detecta a Vercel e limita o pool a 1 conexão por instância.

Substitua `<SENHA>` pela senha do passo 1. Se a senha tiver caracteres especiais (`@`, `#`, `/`), faça percent-encoding — `@` vira `%40`.

## 4. Popular o banco

Da raiz do repositório, com as dependências instaladas (`pnpm install`):

```bash
DATABASE_PROVIDER=postgres \
DATABASE_URL='postgresql://postgres.<ref>:<SENHA>@...pooler.supabase.com:6543/postgres' \
DATABASE_SSL=true \
SEED_SENHA_PADRAO='<senha das contas de teste>' \
pnpm seed
```

O seed cria as cinco contas de controle, 3 turmas, 15 alunos e 12 ocorrências distribuídas nos quatro estados, com histórico coerente, notas e faltas. Ele é idempotente: se `adm@escola.polar` já existir, não faz nada.

As 12 ocorrências ficam divididas entre dois autores — 6 do professor e 6 do ADM. É de propósito: permite demonstrar ao vivo que o professor enxerga 6 e a coordenação enxerga 12, na listagem **e** no dashboard.

### Contas criadas

| E-mail | Papel | O que enxerga |
|---|---|---|
| `professor@escola.polar` | PROFESSOR | apenas as ocorrências que ele registrou |
| `coordenacao@escola.polar` | COORDENADOR | tudo; analisa e resolve |
| `direcao@escola.polar` | DIRETOR | tudo; encerra |
| `adm@escola.polar` | ADM | tudo; gerencia usuários, turmas e alunos |
| `aluno@escola.polar` | ALUNO | nada, por ora — ver observação abaixo |

Todas compartilham a senha de `SEED_SENHA_PADRAO` e entram direto, sem tela de troca de senha.

> **Sobre o papel ALUNO.** Ele existe e loga, mas o modelo de dados ainda não liga um `Usuario` a um registro de `Aluno`. Sem esse vínculo não há como decidir *quais* ocorrências são "as dele", e a regra do sistema é negar por padrão: a listagem volta vazia e o dashboard zerado. Quando o vínculo existir, o único ponto a mudar é `escopoDeOcorrencias()` em `apps/api/src/modules/ocorrencias/ocorrencias.service.ts`.

## 5. Reset das contas

Para apagar todos os usuários e recriar apenas as cinco contas fixas:

```bash
DATABASE_URL='...' DATABASE_SSL=true SEED_SENHA_PADRAO='...' pnpm reset:usuarios
```

**Isso apaga junto ocorrências, histórico, notas, faltas, notificações e auditoria** — tudo que referencia `users` por chave estrangeira. É uma ferramenta de reset de base de teste, não de manutenção de produção.

Depois do reset, `pnpm seed` não roda: o guard do seed é a existência de `adm@escola.polar`, que o reset acabou de recriar. É o comportamento certo — o reset serve para quando você quer só as contas limpas. Para voltar a ter também os dados de demonstração, limpe tudo e rode o seed:

```sql
TRUNCATE audit_logs, faltas, notas, ocorrencia_historico,
         ocorrencias, alunos, turmas, users RESTART IDENTITY CASCADE;
```

## 6. Conferir

**Table Editor** → `users` deve ter exatamente 5 linhas, e a coluna `papel` deve mostrar um papel diferente em cada uma.

---

## Desenvolvimento local

Não é preciso Supabase para desenvolver. Duas opções:

**Provider JSON** — sem banco nenhum, para iterar rápido:

```bash
DATABASE_PROVIDER=json pnpm dev
```

**Postgres em Docker** — quando o assunto for SQL de verdade:

```bash
docker run --name polar-pg -e POSTGRES_PASSWORD=polar -e POSTGRES_USER=polar \
  -e POSTGRES_DB=polar -p 5432:5432 -d postgres:16
psql postgresql://polar:polar@localhost:5432/polar -f database/schema.sql
```

## Teste de contrato

`apps/api/tests/integration/postgres-repositories.contract.test.ts` é a prova real de que a camada de dados funciona contra um Postgres de verdade. Ele só roda com `TEST_DATABASE_URL` definida, e **trunca o banco apontado** — use um banco descartável, nunca o de produção:

```bash
TEST_DATABASE_URL=postgresql://polar:polar@localhost:5432/polar_test pnpm --filter @pola/api test
```

Cobre acentuação PT-BR, integridade de boolean e data, `NUMERIC` voltando como `number`, atomicidade de status + histórico e detecção de duplicata.

## Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| `relation "users" does not exist` (`42P01`) | schema não aplicado | rode o passo 2 |
| `password authentication failed` | senha errada ou sem percent-encoding | reescreva a senha na URL, `@` → `%40` |
| `too many connections` | usando a porta 5432 em vez do pooler | troque para a connection string do transaction pooler (6543) |
| `self signed certificate` | `DATABASE_SSL` ausente | defina `DATABASE_SSL=true` |
| `Seed ja aplicado` | `adm@escola.polar` já existe | esperado; use `pnpm reset:usuarios` se quiser recomeçar |
