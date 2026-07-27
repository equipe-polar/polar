# Deploy do POLAR — Render + MySQL gratuito

O POLAR roda em **1 serviço só**: a API Express serve o build do React. O banco MySQL fica em um provedor gratuito separado. Custo total: **R$ 0**.

## Visão geral

```text
[Navegador] --HTTPS--> [Render Web Service (Docker)] --SSL--> [MySQL na nuvem]
                        API Express + build do React          TiDB Serverless ou Aiven
```

## Parte 1 — Criar o banco MySQL gratuito

Escolha UMA das opções (as duas são MySQL-compatíveis, gratuitas e sem cartão de crédito):

### Opção A: TiDB Cloud Serverless (recomendada)

1. Crie conta em <https://tidbcloud.com> (login com GitHub).
2. Crie um cluster **Serverless** (região mais próxima: `us-east-1`).
3. Em **Connect**, escolha `General` e anote host, porta, usuário e senha.
4. Crie o banco: no SQL Editor do painel, rode `CREATE DATABASE polar;`
5. Monte a URL: `mysql://USUARIO:SENHA@HOST:4000/polar`
6. TiDB exige TLS: use `DATABASE_SSL=true`.

### Opção B: Aiven for MySQL

1. Crie conta em <https://aiven.io> (plano Free).
2. Crie um serviço **MySQL Free**.
3. Copie a **Service URI** (formato `mysql://...`). O banco padrão é `defaultdb`.
4. Use `DATABASE_SSL=true`.

### Aplicar o schema e o seed

Com a URL em mãos, na sua máquina (precisa do cliente `mysql` ou use o SQL Editor do painel):

```bash
mysql --host=HOST --port=PORTA --user=USUARIO --password --ssl-mode=REQUIRED polar < database/schema.sql
```

Depois, na raiz do repositório (cria usuários de demonstração, turmas, alunos e ocorrências):

```bash
DATABASE_PROVIDER=mysql DATABASE_URL="mysql://USUARIO:SENHA@HOST:PORTA/polar" DATABASE_SSL=true SEED_SENHA_PADRAO="EscolhaUmaSenhaForte1!" pnpm seed
```

> No Windows PowerShell: defina as variáveis com `$env:DATABASE_PROVIDER="mysql"` etc. antes de rodar `pnpm seed`.

## Parte 2 — Criar o serviço no Render

1. Crie conta em <https://render.com> (login com GitHub).
2. **New > Blueprint** e selecione o repositório `P.O.L.A` — o Render lê o `render.yaml` da raiz.
3. Preencha as variáveis marcadas como `sync: false`:
   - `DATABASE_URL`: a URL do MySQL da Parte 1
   - `CORS_ORIGIN`: a URL pública do serviço (ex: `https://polar.onrender.com`) — dá para ajustar depois do primeiro deploy
   - `BOOTSTRAP_ADMIN_EMAIL`: e-mail do administrador inicial
   - `BOOTSTRAP_ADMIN_PASSWORD`: senha forte (será exigida troca no primeiro login)
4. Deploy. O primeiro build demora ~5 minutos.
5. Teste: `https://SEU-SERVICO.onrender.com/health` deve responder `{"status":"ok"}`.

## Parte 3 — Anti-hibernação (GitHub Actions)

O plano free do Render hiberna após ~15 min sem tráfego (primeiro acesso depois disso demora ~50s).
O workflow [.github/workflows/keepalive.yml](../../.github/workflows/keepalive.yml) faz ping no `/health` a cada 10 minutos em horário escolar.

Configuração (1 minuto):

1. No GitHub: **Settings > Secrets and variables > Actions > Variables > New repository variable**
2. Nome: `POLAR_HEALTH_URL` — Valor: `https://SEU-SERVICO.onrender.com/health`

## Parte 4 — Smoke test (roteiro de 6 passos)

Na URL pública, repita o critério de aceite oficial com os usuários do seed:

1. Login como `professor@escola.demo` → registrar ocorrência para um aluno.
2. A ocorrência aparece na lista do professor com status `REGISTRADA`.
3. Login como `coordenacao@escola.demo` → ver a ocorrência → **Colocar em análise** → **Marcar resolvida** (com observação).
4. Login como `direcao@escola.demo` → **Encerrar** (com observação).
5. Abrir o detalhe → histórico mostra as 4 etapas com autores e observações.
6. Reiniciar o serviço no painel do Render → os dados continuam lá (persistência real, teste T10).

## Rodar localmente com MySQL (Docker)

```bash
docker run --name polar-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=polar -p 3306:3306 -d mysql:8
docker exec -i polar-mysql mysql -uroot -proot polar < database/schema.sql
```

`apps/api/.env`:

```env
DATABASE_PROVIDER=mysql
DATABASE_URL=mysql://root:root@localhost:3306/polar
DATABASE_SSL=false
SEED_SENHA_PADRAO=SenhaDemo1!
```

```bash
pnpm seed
pnpm dev
```

## Solução de problemas

| Sintoma | Causa provável | Correção |
| --- | --- | --- |
| `DATABASE_URL e obrigatorio` no boot | Variável não chegou ao serviço | Conferir env vars no painel do Render |
| `ER_NO_SUCH_TABLE` | Schema não aplicado | Rodar `database/schema.sql` no banco |
| Erro de TLS/SSL na conexão | `DATABASE_SSL` errado | `true` para TiDB/Aiven; `false` para MySQL local |
| Primeiro acesso lento (~50s) | Serviço hibernou | Conferir a variável `POLAR_HEALTH_URL` do keepalive |
| Login recusa `admin` | Bootstrap só roda com banco vazio | Usar os usuários do seed ou conferir `BOOTSTRAP_ADMIN_*` |
