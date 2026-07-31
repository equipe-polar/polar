# Guia de evolução técnica do POLAR

Documento de handoff. Foi escrito para ser o **ponto de partida de um chat novo** dedicado às próximas alterações do sistema, sem precisar reexplicar o projeto do zero.

Leitura inicial recomendada, nesta ordem: este arquivo, depois `README.md`, depois `docs/arquitetura/arquitetura.md`. Com esses três, dá para começar a trabalhar.

Levantamento feito em 30/07/2026, com o repositório na branch `master`, commit `1db277a`. Todas as afirmações abaixo foram verificadas diretamente no código, não na documentação.

---

## 1. Aviso importante sobre a documentação antiga

O arquivo `docs/relatorios/auditoria-tecnica-reestruturacao.md` (datado de 23/05/2026) descreve uma arquitetura que **não existe mais**. Ele fala de uma API Node que chamava scripts Python por `child_process`, de `backend/banco_dados.json` como persistência principal, de `JWT_SECRET` com fallback inseguro e de `.env` versionado. Nada disso é verdade hoje — tudo foi resolvido na reconstrução v3 (commits `16b3b5f` e `a0ff74e`).

Aquele relatório é **documento histórico**, útil para entender de onde o projeto veio, e não retrato do estado atual. Vale o mesmo alerta para qualquer análise que descreva o projeto como "só JSON", "sem helmet" ou "com rotas duplicadas em inglês": está desatualizada.

Também importante: a pasta local foi renomeada de `P.O.L.A` para `polar`, e o repositório oficial agora é `https://github.com/origines-polar/polar.git`. Caminhos antigos não resolvem.

---

## 2. O que o sistema é hoje

O POLAR é um sistema escolar para registro, acompanhamento e auditoria de ocorrências disciplinares. O valor central dele não é o CRUD — é a **rastreabilidade**: toda ocorrência caminha por um fluxo de estados fixo, cada transição exige um papel específico, e cada passo gera histórico imutável e log de auditoria.

É um monorepo pnpm com dois workspaces. `apps/api` é a API em Express + TypeScript, organizada por módulo no padrão `routes → controller → service → repository`, com os tipos de domínio centralizados em `apps/api/src/shared/domain.ts`. `apps/web` é o frontend React + TypeScript + Vite, organizado por feature, com 12 telas.

A persistência tem dois providers selecionados por `DATABASE_PROVIDER`: MySQL 8 (oficial, obrigatório em produção) e JSON (apenas desenvolvimento rápido e testes). O deploy é um serviço único — em produção a própria API serve o build do React, então frontend e backend compartilham origem e URL.

As pastas `legacy/` e `legado/` são arquivo morto de versões anteriores e não participam de build, teste ou lint.

---

## 3. O que já está resolvido — não refazer

Esta seção existe para evitar retrabalho. Cada item abaixo foi conferido no código e **já está correto**:

**Segurança de borda.** `helmet()` está aplicado, o CORS trabalha com allowlist explícita a partir de `CORS_ORIGIN` (não é `*`), e o body tem limite de 1 MB — `apps/api/src/app.ts:42-55`.

**Configuração com fail-fast.** A aplicação se recusa a subir em estado inseguro: `JWT_SECRET` precisa ter no mínimo 32 caracteres, produção exige `DATABASE_PROVIDER=mysql`, `DATABASE_URL` é obrigatório quando o provider é MySQL, e senha bootstrap `admin123` é bloqueada em produção — `apps/api/src/shared/config.ts:44-54`.

**Padronização PT-BR concluída.** Os aliases de rota em inglês (`/occurrences`, `/students`, `/users`) foram removidos; só existem as rotas em português — `apps/api/src/app.ts:100-112`.

**Transações reais no MySQL.** `updateWithHistorico` abre transação, faz `SELECT ... FOR UPDATE` para travar a linha, atualiza e grava o histórico atomicamente — `apps/api/src/shared/database/mysql/ocorrencia.repository.mysql.ts:163-200`. O helper `withTransaction` com commit/rollback/release está em `mysql-client.ts:21-34`.

**Sem SQL injection.** Toda query da camada MySQL usa placeholders `?` com parâmetros vinculados. Não há concatenação de string em SQL em nenhum repositório.

**Contrato único entre os dois providers.** `OcorrenciaRepository` é uma interface TypeScript implementada tanto pela versão JSON quanto pela MySQL — `apps/api/src/shared/database/repositories/ocorrencia.repository.ts:12-25`. **Este é o padrão a reusar** em qualquer método novo de repositório: adicione à interface primeiro, e as duas implementações são obrigadas a acompanhar. Foi isso que manteve os dois providers em paridade.

**Escopo de dados por papel nas ocorrências.** Professor lê apenas o que ele mesmo registrou, tanto na listagem quanto no acesso direto por id — `apps/api/src/modules/ocorrencias/ocorrencias.service.ts:48-64`.

**Máquina de estados fechada.** `REGISTRADA → EM_ANALISE → RESOLVIDA → ENCERRADA`, sem pular etapas, encerrada é imutável, e cada transição exige o papel certo (coordenador analisa e resolve, diretor encerra) — `ocorrencias.service.ts:192-253`. A edição de ocorrência é restrita ao autor e só enquanto REGISTRADA, e ainda assim gera histórico — `ocorrencias.service.ts:134-190`.

**Encerramento limpo.** `SIGTERM`/`SIGINT` fecham o servidor e o pool de conexões — `apps/api/src/server.ts:11-22`.

**Schema relacional sério.** MySQL 8 com InnoDB, `utf8mb4` (acentuação PT-BR nas categorias), chaves estrangeiras em todas as relações, índices nos campos de busca e `DATETIME(3)` em UTC com o backend como única autoridade de data — `database/schema.sql`.

**Infra de entrega.** CI roda lint, typecheck, test e build (`.github/workflows/ci.yml`); há `Dockerfile`, `render.yaml` e `docs/deploy/render.md` para deploy real.

---

## 4. Onda 1 — o que fechar até a apresentação

Itens de baixo risco, alto retorno demonstrável e que cabem no tempo curto.

### 4.1. O dashboard fura a regra de escopo por papel

Este é o achado mais relevante da onda 1, porque contradiz uma regra que o próprio projeto declara.

`DashboardService` recebe apenas o repositório e chama `this.ocorrencias.list()` — a listagem global, sem filtro — em `apps/api/src/modules/dashboard/dashboard.service.ts:7`. A rota exige a permissão `CONSULTAR_OCORRENCIAS` (`dashboard.routes.ts:15-16`), e `PROFESSOR` **possui** essa permissão (`permissions.ts:26`).

O resultado é incoerente: o professor não consegue listar as ocorrências dos colegas, mas o dashboard entrega a ele os números agregados de toda a escola — total, distribuição por status, por prioridade e por categoria. O escopo que existe em `ocorrencias.service.ts:48-64` simplesmente não foi aplicado aqui.

Direção: `DashboardService.resumo()` deve receber o `actor` e reusar a mesma decisão de escopo do `OcorrenciasService` — professor vê o agregado do que ele registrou, coordenação/direção/ADM veem o global. Vale conferir se `RelatoriosService` tem o mesmo furo (hoje ele está protegido por acidente: `CONSULTAR_RELATORIOS` não pertence ao professor, mas a proteção é da permissão, não do serviço).

### 4.2. Contrato de resposta inconsistente entre dashboard e relatórios

`relatorios.service.ts` devolve as chaves `byStatus`, `byPriority` e `byCategory` — em inglês. `dashboard.service.ts` devolve `ocorrenciasPorStatus`, `ocorrenciasPorPrioridade` e `ocorrenciasPorCategoria` — em português. São os mesmos dados, com dois vocabulários.

A padronização PT-BR foi aplicada nas rotas mas não chegou aos payloads. Direção: unificar em PT-BR e ajustar os consumidores em `apps/web/src/features/relatorios/`.

### 4.3. Andaime morto do sistema de permissões granulares

Três peças de uma funcionalidade que não existe estão espalhadas pelo código: a tabela `user_permissions` no schema (`database/schema.sql:130-137`), a interface `UserPermission` no domínio (`apps/api/src/shared/domain.ts:120`, mais o campo em `DatabaseState` na linha 156) e a permissão `GERENCIAR_PERMISSOES` no enum (`permissions.ts:14`).

Nenhuma das três é usada por qualquer repositório, serviço ou rota. O sistema promete permissão granular por usuário e entrega apenas RBAC por papel. Para quem lê o código pela primeira vez, isso parece funcionalidade existente.

Direção para a onda 1: remover as três peças. Elas voltam quando houver implementação de verdade — e o schema é fácil de reintroduzir depois.

### 4.4. Lixo de build a um `git add` de entrar no repositório

Existem oito arquivos `.js` compilados convivendo com os `.ts` originais dentro de `apps/api/tests/integration/`. Eles aparecem como untracked no `git status`, e `git check-ignore` confirma que **não são cobertos pelo `.gitignore`** — um `git add .` distraído os commita. São provável resíduo do ajuste de `rootDir` do commit `c7ae65e`.

Some-se a isso o `logo.png` de 1,5 MB solto na raiz do projeto, também untracked.

Direção: apagar os `.js`, acrescentar o padrão ao `.gitignore` (`apps/api/tests/**/*.js`) e mover o logo para `apps/web/src/assets/`.

### 4.5. Cobertura de teste desbalanceada

A API tem 27 casos de integração distribuídos em 7 arquivos, incluindo um teste de contrato dos repositórios MySQL — o que é bom e incomum. O frontend tem 5 arquivos de teste para 12 telas.

O ponto mais valioso a cobrir não é quantidade, e sim a **matriz negativa de permissão**: o que cada papel *não* pode fazer. Isso é exatamente o diferencial do projeto e é o tipo de teste que sustenta a defesa numa apresentação. Um bom alvo imediato é o próprio furo do item 4.1 — escrever o teste que prova o escopo do dashboard antes de corrigi-lo.

---

## 5. Onda 2 — o que seria necessário para virar produto real

Itens estruturais. Não cabem na onda 1 porque mexem em schema, em contrato de API ou no modelo de sessão — mudanças que exigem tempo de estabilização que a apresentação não tem.

**Ausência total de paginação.** Nenhuma listagem do sistema tem `LIMIT`/`OFFSET`. O caso mais grave é `AuditoriaService.list()` (`apps/api/src/modules/auditoria/auditoria.service.ts:7-9`), que devolve o log de auditoria inteiro numa única resposta — é problema de performance e de exposição de dados ao mesmo tempo. Vale igualmente para ocorrências, alunos e usuários.

**Agregação feita em memória, com o MySQL disponível.** `dashboard.service.ts` e `relatorios.service.ts` baixam **todas** as ocorrências para o Node e contam com `for`. O caso mais claro é `RelatoriosService.aluno()`, que carrega a tabela inteira só para filtrar por `alunoId` em JavaScript. Com banco relacional isso é desperdício direto. Direção: mover para `SELECT status, COUNT(*) ... GROUP BY` nos repositórios MySQL, sempre adicionando o método à interface compartilhada primeiro (ver seção 3).

**Sem multi-tenant.** Não existe `escola_id` em lugar nenhum — nem no schema, nem no domínio, nem nas queries. Todo sistema escolar de mercado é multi-escola desde o schema. Se o POLAR for atender mais de uma escola, isso precisa ser decidido **antes** de existirem dados reais; introduzir depois é migração cara e arriscada.

**Sessão sem revogação.** JWT de 8 horas, sem refresh token e sem lista de revogação. Desativar um usuário no sistema não derruba a sessão dele — o token continua válido até expirar. Para um sistema com dados de menores, é uma lacuna concreta.

**JWT em `localStorage`.** O token é guardado e lido de `localStorage` em `apps/web/src/services/api.ts:19-29`, o que o expõe a XSS. A direção usual é cookie `httpOnly` + `SameSite`, mas isso implica mexer em CORS e no envio de credenciais — daí não caber na onda 1. O tratamento de 401/403 do client já está bem feito (`api.ts:44-57`) e serve de base.

**Política de senha fraca.** `apps/api/src/shared/validation/senha.ts` exige apenas 8 caracteres, sem nenhum requisito de composição. As proteções de borda (bloqueio por tentativas, rate limit) são boas, mas a senha em si é frágil.

**Rate limit não distribuído.** `login-rate-limit.ts` guarda as tentativas num `Map` em memória do processo: zera a cada deploy e não funciona com mais de uma instância. O bloqueio por tentativas por usuário em `auth.service.ts` persiste no banco e é o mecanismo confiável — os dois coexistem sem se comunicar. Consolidar.

**Sem migrations versionadas.** Só existe `database/schema.sql` com `CREATE TABLE IF NOT EXISTS`. Funciona para criar o banco do zero; não há caminho seguro para evoluir o schema de um banco que já tem dados em produção.

**Notas e faltas sem escopo por papel.** Diferentemente de ocorrências, `notas.service.ts` não recebe `actor` nem filtra por professor ou turma — `create` recebe apenas `professorId` para gravar, e `listByAluno` não verifica vínculo. Qualquer usuário com `CONSULTAR_ALUNOS` lê as notas de qualquer aluno.

---

## 6. O que não mexer

Decisões já tomadas e justificadas. Não são candidatas a refatoração:

- **Nomenclatura PT-BR** em rotas, domínio e schema. É decisão registrada do projeto; a onda 1 corrige o que ficou fora dela, não o contrário.
- **Provider duplo JSON/MySQL.** O JSON não é dívida — é o que permite rodar testes de integração sem banco e desenvolver sem infraestrutura. A interface compartilhada mantém os dois honestos.
- **Estágio único no `Dockerfile`.** A escolha é deliberada e está justificada em comentário no próprio arquivo: multi-stage com pnpm e symlinks é a principal fonte de build quebrado, e o tamanho da imagem é irrelevante no plano gratuito.
- **API servindo o SPA em produção.** Um serviço, uma URL, mesma origem — simplifica CORS e deploy. A lógica de `Accept: text/html` em `app.ts:86-98` faz o F5 numa rota do React funcionar.

---

## 7. Sugestão de primeira mensagem no chat novo

> Leia `docs/guia-evolucao-tecnica.md`. Quero atacar a Onda 1, começando pelo item 4.1 (dashboard sem escopo por papel). Antes de corrigir, escreva o teste de integração que prova o furo.
