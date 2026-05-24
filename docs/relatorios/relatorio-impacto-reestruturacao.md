# Relatorio estruturado de alteracoes e impactos

Projeto: P.O.L.A  
Origem: sistema antigo com frontend estatico, API Node.js em JavaScript e regras principais em Python  
Destino: monorepo com API principal em Node.js + TypeScript, frontend reorganizado e legado isolado

## 1. Visao geral da mudanca

O sistema antigo usava uma API Node.js/Express como camada HTTP, mas a regra de negocio principal ficava em Python. A API executava scripts Python por `child_process`, e o Python lia e gravava dados em `backend/banco_dados.json`.

O sistema atual passa a concentrar a regra principal em `apps/api`, usando Node.js + TypeScript. O frontend estatico foi movido para `apps/web/public`, a persistencia JSON ficou apenas como modo temporario atras de repositorios, e o Python foi removido do fluxo ativo.

Impacto direto:

- A API nao depende mais de Python instalado para funcionar.
- As regras de negocio ficam em uma unica linguagem.
- O sistema ficou mais simples de testar, manter e evoluir.
- O risco de erro na ponte Node -> Python foi eliminado da API ativa.

## 2. Estrutura do repositorio

### Antes

```text
api/
backend/
frontend/
database/
docs/
```

### Depois

```text
apps/
  api/
  web/
database/
docs/
legacy/
scripts/
.github/
```

Impacto direto:

- Separacao clara entre backend, frontend, banco, documentacao, scripts e legado.
- O projeto passou a ter organizacao de monorepo com pnpm workspaces.
- A estrutura ficou mais proxima de um padrao profissional de desenvolvimento.

## 3. API backend

### Antes

- API em JavaScript CommonJS dentro de `api/`.
- Controllers chamavam Python por `api/src/util/pythonBridge.js`.
- Parte das validacoes ficava na API Node e parte no Python.
- Erros dependiam do retorno dos scripts Python.

### Depois

- API em TypeScript dentro de `apps/api`.
- Modulos separados por dominio:
  - `auth`
  - `users`
  - `turmas`
  - `alunos`
  - `ocorrencias`
  - `notas`
  - `faltas`
  - `dashboard`
  - `relatorios`
  - `auditoria`
  - `notifications`
- Services concentram regra de negocio.
- Controllers lidam com HTTP.
- Repositories isolam persistencia.

Impacto direto:

- Reducao de acoplamento.
- Melhor previsibilidade das rotas.
- Codigo mais testavel.
- Menor chance de quebrar regra de negocio ao alterar uma rota.

## 4. Remocao da ponte Node -> Python

### Antes

A API chamava scripts Python com `child_process`. O fluxo era:

```text
Request HTTP -> Controller Node -> child_process -> Python -> JSON -> resposta HTTP
```

### Depois

O fluxo passou a ser:

```text
Request HTTP -> Controller TypeScript -> Service TypeScript -> Repository -> resposta HTTP
```

Impacto direto:

- Menos dependencia de ambiente.
- Menos pontos de falha.
- Melhor desempenho esperado por evitar iniciar processo externo por operacao.
- Debug mais simples.
- Testes HTTP reais ficaram viaveis sem preparar runtime Python.

## 5. Python legado

### Antes

Python era parte ativa do funcionamento.

### Depois

Python deixou de ser dependencia da API. O legado foi documentado em `legacy/python/README.md`, e foi mantido apenas um snapshot minimo de dados antigos em `legacy/python/backend/banco_dados.json`.

Impacto direto:

- O sistema novo funciona sem importar ou executar codigo Python.
- O legado fica registrado para consulta historica.
- Arquivos Python antigos com conflitos nao contaminam mais o build da API nova.

## 6. Autenticacao

### Antes

- Login dependia do backend Python.
- Havia caminho inseguro com admin padrao.
- Havia fallback inseguro para `JWT_SECRET`.

### Depois

- Login implementado em TypeScript.
- JWT assinado pela API nova.
- `JWT_SECRET` e obrigatorio.
- Se `JWT_SECRET` nao estiver configurado, a aplicacao falha ao iniciar.
- Senhas usam hash com bcryptjs.
- Usuario bootstrap, quando usado, exige troca de senha.

Impacto direto:

- A autenticacao ficou mais segura.
- O sistema nao sobe com segredo fraco por acidente.
- Reduz risco de acesso indevido por credencial padrao.

## 7. Protecao contra ataques de login

### Antes

Nao havia protecao consistente na API Node contra tentativas repetidas.

### Depois

- Rate limit para login.
- Bloqueio temporario do usuario apos multiplas tentativas invalidas.
- Logs de auditoria para sucesso e falha de login.

Impacto direto:

- Dificulta ataques de forca bruta.
- Melhora rastreabilidade de tentativas suspeitas.

## 8. Autorizacao e permissoes

### Antes

Permissoes eram espalhadas ou pouco claras entre Node e Python.

### Depois

Permissoes ficam centralizadas em `apps/api/src/shared/permissions/permissions.ts`.

Papeis oficiais:

- `PROFESSOR`
- `COORDENADOR`
- `DIRETOR`
- `ADM`

Impacto direto:

- Cada rota passa a declarar permissao necessaria.
- Professor nao consegue executar operacoes administrativas.
- Coordenador e diretor ficam limitados as etapas corretas do fluxo de ocorrencia.
- ADM concentra gestao administrativa.

## 9. Ocorrencias

### Antes

Ocorrencias eram manipuladas pelo backend Python e persistidas no JSON antigo. Havia risco de regras ficarem divergentes entre documentacao, frontend e backend.

### Depois

Ocorrencias foram migradas para TypeScript com regras explicitas:

- Ocorrencia exige aluno valido.
- Exige categoria.
- Exige prioridade.
- Exige descricao.
- Nasce como `REGISTRADA`.
- Cria historico automaticamente.
- Bloqueia duplicidade em janela curta.

Impacto direto:

- Menos ocorrencias invalidas no sistema.
- Menos spam ou duplicidade acidental.
- Melhor integridade do historico.

## 10. Fluxo de status

### Antes

O fluxo existia no Python, mas a API Node nao era dona da regra.

### Depois

Fluxo oficial implementado na API TypeScript:

```text
REGISTRADA -> EM_ANALISE -> RESOLVIDA -> ENCERRADA
```

Regras:

- Professor nao altera status.
- Coordenador muda para `EM_ANALISE`.
- Coordenador muda para `RESOLVIDA`.
- Diretor muda para `ENCERRADA`.
- Status nao pode pular etapas.
- Ocorrencia encerrada nao pode ser alterada.

Impacto direto:

- O ciclo institucional da ocorrencia ficou protegido.
- A API impede alteracoes fora do processo oficial.
- Reduz risco de encerramento indevido ou resolucao sem analise.

## 11. Historico de ocorrencias

### Antes

O historico existia no legado, mas dependia de dados e funcoes Python.

### Depois

Historico foi separado em entidade propria:

- `OcorrenciaHistorico` no dominio TypeScript.
- `ocorrencia_historico` no schema SQL.
- Rota de consulta.
- Edicao manual bloqueada.

Impacto direto:

- Auditoria do ciclo da ocorrencia ficou mais confiavel.
- Historico nao pode ser editado manualmente por rota comum.
- Cada mudanca de status cria registro automatico.

## 12. Usuarios

### Antes

Usuarios vinham do JSON legado e podiam conter campos sensiveis em modelos antigos.

### Depois

- `UsersService` controla criacao e atualizacao.
- Listagens retornam usuario publico.
- Hashes de senha nao sao expostos.
- Criacao de usuario exige ADM.

Impacto direto:

- Menor risco de vazamento de senha/hash.
- Melhor controle administrativo.

## 13. Turmas

### Antes

O sistema usava nomenclatura misturada entre `sala`, `class` e `turma`.

### Depois

O dominio interno padroniza `turma`.

Impacto direto:

- Menos ambiguidade no codigo.
- Regras de aluno vinculado a turma ficaram mais claras.
- Remocao de turma com aluno vinculado e bloqueada.

## 14. Alunos

### Antes

Alunos eram salvos no JSON legado com campos misturados em portugues e ingles.

### Depois

- Aluno pertence a uma turma valida.
- Aluno pode ser desativado sem apagar historico.
- Criacao e manutencao de alunos exige permissao administrativa.

Impacto direto:

- Evita aluno sem turma.
- Preserva ocorrencias antigas.
- Reduz perda de historico institucional.

## 15. Notas

### Antes

Notas existiam no legado Python.

### Depois

Modulo `notas` foi criado em TypeScript:

- registra nota por aluno
- valida valor entre 0 e 10
- consulta notas por aluno

Impacto direto:

- API passa a tratar notas como funcionalidade testada.
- Evita valores invalidos.

## 16. Faltas

### Antes

Faltas existiam no legado Python.

### Depois

Modulo `faltas` foi criado em TypeScript:

- registra falta por aluno
- valida data
- consulta faltas por aluno

Impacto direto:

- Controle de faltas integrado a API nova.
- Menos risco de registros com data invalida.

## 17. Dashboard e relatorios

### Antes

Relatorios dependiam do backend antigo.

### Depois

Foram criados:

- dashboard com totais de ocorrencias
- ocorrencias por status
- ocorrencias por prioridade
- ocorrencias por categoria
- relatorio por aluno

Impacto direto:

- Gestao escolar consegue consultar indicadores diretamente pela API nova.
- Dados de ocorrencia ficam agregados de forma padronizada.

## 18. Auditoria

### Antes

Nao havia camada centralizada de auditoria na API Node.

### Depois

Foi criado modulo de auditoria e repositorio de logs.

Acoes auditadas incluem:

- login com sucesso
- login com falha
- criacao de usuario
- alteracao de usuario
- criacao de turma
- alteracao de turma
- criacao de aluno
- alteracao/desativacao de aluno
- criacao e mudanca de status de ocorrencia
- registro de nota
- registro de falta
- criacao de notificacao

Impacto direto:

- Melhor rastreabilidade.
- Mais capacidade de investigar acoes sensiveis.

## 19. Banco de dados e persistencia

### Antes

Persistencia principal:

```text
backend/banco_dados.json
```

### Depois

Persistencia temporaria ainda pode ser JSON, mas atras de repositories.

Contrato relacional criado em:

```text
database/schema.sql
```

Tabelas previstas:

- `users`
- `turmas`
- `alunos`
- `ocorrencias`
- `ocorrencia_historico`
- `notas`
- `faltas`
- `categorias_ocorrencia`
- `user_permissions`
- `audit_logs`
- `notifications`

Impacto direto:

- O sistema ficou preparado para PostgreSQL/Supabase.
- A troca de JSON para banco real sera menos invasiva.
- Regras deixam de depender diretamente de arquivo local.

## 20. Migracao de dados

### Antes

Nao havia script novo padronizado para migrar o JSON legado para o contrato atual.

### Depois

Foi criado:

```text
scripts/migrate-json-to-db.ts
```

Impacto direto:

- Dados antigos podem ser convertidos para o formato novo inicial.
- A migracao futura para PostgreSQL fica mais organizada.
- Campos antigos como `sala`, `class`, `type`, `severity`, `role` sao normalizados para os conceitos novos.

## 21. Validacao de entrada

### Antes

Validacao era parcial e distribuida.

### Depois

Schemas Zod validam entradas de:

- login
- usuarios
- turmas
- alunos
- ocorrencias
- status
- notas
- faltas
- notificacoes

Impacto direto:

- Menos dados quebrados entram no sistema.
- Erros de entrada ficam mais previsiveis.
- Reduz risco de falha interna por payload malformado.

## 22. Padronizacao de erros

### Antes

Erros vinham de varias fontes e formatos.

### Depois

Criada camada de erros:

- `AppError`
- `BAD_REQUEST`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `VALIDATION_ERROR`

Impacto direto:

- Frontend e testes podem tratar erro de forma mais previsivel.
- Melhora manutencao e debugging.

## 23. Segurança

Mudancas principais:

- `.env` real removido do versionamento.
- `.env.example` criado.
- `.gitignore` reforcado.
- `JWT_SECRET` obrigatorio.
- Hash de senha nao retorna em listagens.
- Login com rate limit.
- Usuario bloqueia apos tentativas invalidas.
- Admin padrao inseguro bloqueado em producao.
- Auditoria criada para acoes sensiveis.

Impacto direto:

- Menor risco de vazamento de segredo.
- Menor risco de acesso indevido.
- Melhor conformidade com boas praticas de backend.

## 24. Testes

### Antes

Havia testes Python, mas nao testes reais da API Node.

### Depois

Foram criados testes de integracao com Vitest e Supertest.

Cobertura criada:

- login valido
- login invalido
- usuario inexistente
- senha incorreta
- bloqueio por tentativas invalidas
- token ausente
- token invalido
- criacao de usuario por ADM
- bloqueio de usuario comum criando usuario
- listagem sem vazamento de hash
- criacao e edicao de turma
- bloqueio de remocao de turma com aluno
- criacao de aluno
- aluno com turma valida
- preservacao de historico ao desativar aluno
- criacao de ocorrencia
- validacao de ocorrencia
- bloqueio de status por professor
- bloqueio de salto de status
- fluxo coordenador/diretor
- historico automatico
- bloqueio de edicao manual de historico
- bloqueio de ocorrencia duplicada
- notas
- faltas
- dashboard

Impacto direto:

- Mudancas futuras tem mais protecao contra regressao.
- Regras principais ficaram executaveis e verificaveis automaticamente.

## 25. Documentacao

Documentos criados ou atualizados:

- `README.md`
- `CONTRIBUTING.md`
- `docs/arquitetura/decisao-migracao-node-typescript.md`
- `docs/api/endpoints.md`
- `docs/fluxos/fluxo-ocorrencias.md`
- `docs/banco-de-dados/modelo-relacional.md`
- `docs/relatorios/auditoria-tecnica-reestruturacao.md`
- `docs/relatorios/reestruturacao-node-typescript.md`

Impacto direto:

- Desenvolvedores conseguem instalar, configurar, testar e entender o projeto.
- O fluxo de branches e PR ficou documentado.
- Endpoints e regras de negocio ficaram mais claros.

## 26. CI/CD

### Antes

Nao havia workflow CI funcional.

### Depois

Criado:

```text
.github/workflows/ci.yml
```

O CI roda:

- install
- lint
- typecheck
- test
- build

Impacto direto:

- Pull requests podem ser validados automaticamente.
- Reduz chance de codigo quebrado entrar em `develop` ou `master`.

## 27. Frontend

### Antes

Frontend ficava em `frontend/` e depois havia sido preservado como HTML/CSS/JS estatico em `apps/web/public`.

### Depois

Frontend ativo foi migrado para React + TypeScript + Vite:

```text
apps/web/src/
```

O HTML antigo foi movido para:

```text
legacy/frontend-html/
```

Impacto direto:

- O frontend deixou de ser HTML solto como entrega final.
- As telas agora usam componentes reutilizaveis.
- Rotas e permissoes passaram a ser tratadas no app React.
- `VITE_API_URL` define a API consumida.
- O visual ficou institucional e proprio do P.O.L.A.
- O HTML antigo ficou apenas como prototipo.

## 27.1 Telas React criadas

- Login.
- Dashboard.
- Lista de ocorrencias.
- Nova ocorrencia.
- Detalhe da ocorrencia.
- Gestao de alunos.
- Perfil/historico do aluno.
- Gestao de turmas.
- Gestao de usuarios.
- Relatorios.
- Configuracoes.
- Acesso negado.
- Pagina nao encontrada.

Impacto direto:

- O usuario passa a navegar por uma SPA com React Router.
- Menus e acoes sao filtrados por permissao.
- O layout escolar institucional fica consistente entre telas.

## 28. Funcionamento atual do sistema

Com a nova estrutura, o funcionamento esperado e:

1. A API inicia em Node.js + TypeScript.
2. O ambiente e validado.
3. Requests entram por rotas Express.
4. Middlewares autenticam e autorizam.
5. Controllers validam entrada.
6. Services executam regra de negocio.
7. Repositories persistem em JSON temporario.
8. Respostas nao vazam dados sensiveis.
9. Testes garantem o fluxo principal.

## 29. Comandos atuais

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm migrate:json
```

Impacto direto:

- A rotina de desenvolvimento ficou padronizada.
- Um novo desenvolvedor tem comandos claros para validar o projeto.

## 30. Impacto geral direto

| Area | Impacto direto |
| --- | --- |
| Manutencao | Menos linguagens no fluxo principal e melhor separacao por modulo |
| Segurança | JWT obrigatorio, sem `.env` real, hash protegido e login com bloqueio |
| Testabilidade | API agora tem testes reais de integracao |
| Arquitetura | Services, controllers, repositories e dominios separados |
| Banco | Preparado para PostgreSQL/Supabase |
| Operacao | API nao depende mais de Python instalado |
| Auditoria | Acoes sensiveis passam a gerar logs |
| Ocorrencias | Fluxo institucional protegido por regra de negocio |
| Frontend | Telas preservadas em estrutura `apps/web` |
| CI | Validacao automatica em push e pull request |

## 31. Limitacoes que permanecem

- Persistencia JSON ainda e temporaria.
- PostgreSQL/Supabase ainda precisa ser conectado.
- Frontend ainda e estatico e precisa ser ajustado gradualmente aos endpoints finais em portugues.
- Dados reais do legado precisam validacao manual antes de migracao definitiva.
- `master` ainda precisa receber a reestruturacao via PR/merge.

## 32. Resultado final

O sistema deixou de ser uma integracao Node -> Python com persistencia JSON direta e passou a ser uma API TypeScript modular, testavel, documentada e preparada para banco relacional.

O funcionamento direto foi simplificado: a aplicacao agora roda como um backend Node.js principal, com regras de negocio centralizadas, validacao forte, autorizacao por papel, auditoria e testes automatizados.
