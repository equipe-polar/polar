# Deploy na Vercel

Roteiro para publicar o POLAR na conta dedicada do projeto. Cerca de 5 minutos, custo zero no plano Hobby.

Antes de começar, o banco precisa existir: veja [`supabase.md`](supabase.md).

---

## Como o deploy funciona

```
[Navegador]
    |
    |-- GET /ocorrencias/abc  --> CDN da Vercel  --> apps/web/dist/index.html  (React assume)
    |-- GET /api/ocorrencias  --> Função Node    --> Express               --> Supabase (Postgres)
```

Duas mudanças em relação ao Render:

**A API mora sob `/api`.** Antes os routers ficavam na raiz (`/alunos`, `/turmas`, `/usuarios`), colidindo por nome com as rotas do React, e a desambiguação era um truque: um `GET` com `Accept: text/html` recebia o `index.html` antes de as rotas da API rodarem. Roteamento de CDN é por caminho e não consegue replicar esse discriminador. Com o prefixo, o SPA é servido estaticamente do CDN e a API deixa de disputar caminho com ele.

**Não há hibernação.** O plano gratuito do Render dormia após 15 minutos e voltava em ~50 s. Por isso existia um workflow de keepalive pingando `/health` — ele foi removido, não tem mais função.

O `Dockerfile` continua no repositório e continua funcionando: `apps/api/src/server.ts` sobe um servidor único que serve a API e o SPA na mesma origem. É a rota de fuga caso a Vercel não sirva.

## 1. Importar o repositório

**Add New** → **Project** → importe `origines-polar/polar`.

A Vercel lê o `vercel.json` da raiz e não precisa de configuração manual de build:

| Campo | Valor (já vem do `vercel.json`) |
|---|---|
| Framework Preset | Other |
| Build Command | `pnpm build` |
| Install Command | `pnpm install --frozen-lockfile --prod=false` |
| Output Directory | `apps/web/dist` |

> `--prod=false` é necessário: `typescript` e `vite` são devDependencies, e sem elas o build não roda.

## 2. Variáveis de ambiente

Em **Settings** → **Environment Variables**, para os ambientes **Production** e **Preview**:

| Variável | Valor | Observação |
|---|---|---|
| `NODE_ENV` | `production` | a config recusa subir sem `DATABASE_PROVIDER=postgres` em produção |
| `DATABASE_PROVIDER` | `postgres` | |
| `DATABASE_URL` | connection string do **transaction pooler** (porta 6543) | ver `supabase.md` §3 |
| `DATABASE_SSL` | `true` | |
| `JWT_SECRET` | segredo forte, **mínimo 32 caracteres** | no Render era gerado automaticamente; aqui é manual |
| `JWT_EXPIRES_IN` | `8h` | |
| `CORS_ORIGIN` | a URL pública do projeto, ex. `https://polar.vercel.app` | |
| `BOOTSTRAP_ADMIN_PASSWORD` | *deixe vazio* | com o seed aplicado não tem função, e vazia ela evita uma consulta ao banco a cada cold start |

Gerar um `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> O `JWT_SECRET` muda em relação ao Render, então todos os tokens já emitidos deixam de valer. Sem impacto: a base de usuários é nova.

## 3. Deploy

**Deploy**. O primeiro build leva 2 a 3 minutos. A partir daí todo push para `master` publica em produção, e todo pull request ganha uma URL de preview.

Depois do deploy, volte ao Supabase e ajuste `CORS_ORIGIN` para a URL real, se ela for diferente do que você preencheu.

## 4. Prova real

```bash
curl https://SEU-PROJETO.vercel.app/api/health
# {"status":"ok","timestamp":"..."}
```

E no navegador:

1. Abra a raiz — deve carregar a tela de login do React.
2. Entre com `adm@escola.polar` e a senha padrão.
3. Confira o dashboard: 12 ocorrências.
4. Saia e entre com `professor@escola.polar`. O dashboard deve mostrar **apenas** as ocorrências que o professor registrou — se ele mostrar 12, o escopo por papel regrediu.
5. Abra uma ocorrência e dê **F5** na URL profunda (`/ocorrencias/<id>`). Tem que recarregar o React, não devolver JSON nem 404 — é o rewrite do SPA funcionando.
6. Redeploy pelo painel e repita o login: os dados continuam lá, porque o estado vive no Supabase e não no sistema de arquivos.

## Limitações conhecidas do serverless

**Rate limit de login não é distribuído.** `apps/api/src/shared/middlewares/login-rate-limit.ts` guarda as tentativas num `Map` na memória do processo. Com N instâncias efêmeras, cada uma tem a própria contagem e todas zeram a cada deploy. O mecanismo confiável é o bloqueio por tentativas de `auth.service.ts` (5 tentativas, 15 minutos), que persiste no banco e continua valendo. Consolidar os dois é trabalho de outra onda.

**Cold start.** A primeira requisição depois de um período ocioso paga a inicialização da função e a abertura da conexão. É bem mais rápido que os ~50 s do Render, mas não é zero.

**Sem migrations versionadas.** `database/schema.sql` cria o banco do zero com `IF NOT EXISTS`. Não há caminho seguro para evoluir o schema de um banco que já tem dados — hoje uma mudança de coluna é feita à mão no SQL Editor.

## Problemas comuns

| Sintoma | Causa | Solução |
|---|---|---|
| Build falha em `tsc: not found` | devDependencies não instaladas | confirme `--prod=false` no install command |
| `JWT_SECRET deve ter pelo menos 32 caracteres` | segredo curto | gere um novo com o comando acima |
| `Producao exige DATABASE_PROVIDER=postgres` | variável ausente ou errada | defina `DATABASE_PROVIDER=postgres` |
| Rota do React dá 404 | rewrite não aplicado | confirme que o `vercel.json` está na raiz e foi lido pelo build |
| `/api/...` devolve o HTML do SPA | ordem dos rewrites invertida | a regra `/api/(.*)` tem que vir antes da catch-all |
| `too many connections` | usando a porta 5432 | troque para o transaction pooler (6543) |
