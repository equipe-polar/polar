# Auditoria tecnica para reestruturacao Node.js + TypeScript

Data da auditoria: 2026-05-23  
Branch analisada: `develop`  
Repositorio: `https://github.com/JoseDioG/P.O.L.A.git`

## 1. Estado atual do projeto

O projeto P.O.L.A esta dividido entre um frontend estatico em HTML/CSS/JavaScript, uma API Node.js/Express em JavaScript e um backend Python que concentra parte importante das regras de negocio. A API Node atual nao executa a regra de dominio diretamente: ela valida parcialmente a entrada, chama scripts Python por `child_process` e recebe JSON como resposta.

O repositorio tambem ja contem diretorios vazios ou parcialmente preparados para uma estrutura profissional (`apps/api`, `apps/web`, `legacy`, `scripts`, `database` e `.github`), mas a aplicacao real ainda esta nas pastas antigas `api/`, `backend/` e `frontend/`.

Persistencia atual principal: `backend/banco_dados.json`.

## 2. Lista de arquivos e pastas existentes

Pastas principais encontradas:

- `.git/`
- `.github/`
- `api/`
- `apps/api/`
- `apps/web/`
- `backend/`
- `database/`
- `docs/`
- `frontend/`
- `legacy/`
- `scripts/`

Arquivos versionados relevantes:

- `.gitignore`
- `README.md`
- `api/.env`
- `api/package.json`
- `api/package-lock.json`
- `api/server.js`
- `api/src/app.js`
- `api/src/controllers/*.js`
- `api/src/middlewares/*.js`
- `api/src/model/*.js`
- `api/src/routes/*.js`
- `api/src/util/pythonBridge.js`
- `api/utils/pythonRunner.js`
- `backend/banco_dados.json`
- `backend/main.py`
- `backend/occurence_engine.py`
- `backend/EXEMPLO_ADAPTACAO_SERVICOS.py`
- `backend/models/*.py`
- `backend/services/*.py`
- `backend/tests/test_engine.py`
- `backend/utils/*.py`
- `frontend/*.html`
- `frontend/css/styles.css`
- `frontend/js/app.js`
- `database/descartavel`
- `docs/descartavel`

Tambem ha arquivos `__pycache__` e `*.pyc` versionados dentro de `backend/`, o que nao deveria ocorrer.

## 3. Linguagens usadas atualmente

- JavaScript CommonJS na API Express.
- Python para regras de negocio, persistencia JSON, autenticacao interna e testes.
- HTML, CSS e JavaScript puro no frontend.
- JSON como persistencia local.

## 4. Problemas criticos encontrados

- Existem conflitos Git abertos com marcadores em arquivos Python.
- A API Node depende de Python por ponte `child_process`.
- A regra de negocio principal esta espalhada entre Python e JavaScript.
- `backend/banco_dados.json` e usado como persistencia principal.
- O README documenta explicitamente a arquitetura Node -> Python, que e a arquitetura que deve ser substituida.
- Existem arquivos temporarios e descartaveis versionados.
- Existem `__pycache__` e binarios `*.pyc` versionados.
- A pasta `apps/` existe, mas ainda nao contem a aplicacao principal funcional.

## 5. Problemas de seguranca

- `api/.env` esta versionado.
- O README expunha exemplo de `JWT_SECRET` e login inicial com `admin/admin123`.
- `api/src/middlewares/auth.js` define fallback inseguro: `process.env.JWT_SECRET || "polar-development-secret"`.
- O backend Python aceita fluxo legado de `admin/admin123` quando nao ha hash salvo.
- Ha risco de exposicao de hashes por modelos e normalizadores antigos (`senha_hash`, `password_hash`, `passwordHash`).
- A validacao de entrada da API Node e parcial.
- Nao ha rate limit e bloqueio consistente para login na API Node.
- Nao ha camada clara de auditoria para acoes sensiveis na API Node.
- CORS usa `*` por padrao.

## 6. Problemas de documentacao

- README esta divergente da direcao desejada do projeto.
- README ainda orienta instalar dependencias dentro de `api/` com npm.
- README documenta Python como requisito obrigatorio da API.
- README documenta `backend/banco_dados.json` como banco principal.
- Falta documentacao de arquitetura da nova direcao Node.js + TypeScript.
- Falta documentacao consolidada dos endpoints, permissoes e fluxo de ocorrencias.
- Falta documentacao de banco relacional e migracao de dados antigos.
- Falta estrategia formal de branches e contribuicao.

## 7. Problemas de arquitetura

- A API Node atual e uma fachada HTTP para scripts Python.
- A fronteira entre `sala` e `turma`, `role` e `papel`, `type` e `categoria`, `severity` e `prioridade` nao e padronizada.
- Existem duas pastas de API (`api/` antiga e `apps/api/` vazia).
- Existem duas nomenclaturas de aluno/turma em portugues e ingles.
- Regras de permissao nao estao centralizadas em uma camada reutilizavel.
- Respostas de erro nao seguem contrato unico.
- A camada de persistencia acopla regra de negocio ao arquivo JSON.

## 8. Problemas de versionamento

- Branch atual local: `develop`.
- Branches locais existentes: `develop` e `master`.
- `origin/HEAD` aponta para `origin/master`.
- `api/.env` esta rastreado pelo Git.
- Arquivos `__pycache__` e `*.pyc` estao rastreados.
- Arquivos `descartavel`, `descartavel1` e `iniciar.txt` estao rastreados.
- Nao ha template de pull request versionado.
- Nao ha workflow CI versionado funcional.

## 9. Problemas de testes

- Existem testes Python em `backend/tests/test_engine.py`, mas eles pertencem ao backend legado.
- A API Node atual nao possui testes reais com Supertest.
- `api/package.json` usa `npm run check` como teste, o que apenas faz verificacao sintatica.
- Nao ha comandos padronizados de `lint`, `typecheck`, `test` e `build` no nivel raiz.
- Nao ha CI garantindo testes em push ou pull request.

## 10. Decisao tecnica sobre migrar a logica principal para Node.js + TypeScript

A decisao tecnica e migrar a logica principal para Node.js + TypeScript dentro de `apps/api`. A ponte Node -> Python sera removida da API ativa.

Motivos:

- Reduzir complexidade operacional.
- Eliminar falhas de serializacao e execucao entre processos.
- Centralizar autenticacao, autorizacao, validacao e regras de negocio.
- Permitir testes de integracao HTTP reais na API.
- Aproveitar tipos, enums e contratos explicitos em TypeScript.
- Preparar uma camada de repositorio que possa trocar JSON temporario por PostgreSQL/Supabase.

## 11. O que sera mantido

- Frontend estatico existente como base em `apps/web/public`.
- Regras de dominio ja identificadas: papeis oficiais, status oficiais, fluxo de status e historico automatico.
- Persistencia JSON apenas como modo temporario de desenvolvimento, atras de repositorios.
- Codigo Python selecionado apenas como referencia historica em `legacy/python`.
- Testes essenciais, agora migrados para a API Node/TypeScript.

## 12. O que sera removido

- API ativa em JavaScript que chama Python por `child_process`.
- `api/.env` versionado.
- Fallback inseguro de `JWT_SECRET`.
- Arquivos temporarios e descartaveis da estrutura ativa.
- `__pycache__` e `*.pyc` versionados da estrutura ativa.
- Uso de `backend/banco_dados.json` como dependencia direta da API ativa.

Remocoes serao registradas no relatorio final de reestruturacao.

## 13. O que sera migrado

- Auth para `apps/api/src/modules/auth`.
- Users para `apps/api/src/modules/users`.
- Turmas, substituindo a nomenclatura antiga `salas`.
- Alunos.
- Ocorrencias.
- Historico de ocorrencias.
- Notas.
- Faltas.
- Dashboard.
- Relatorios.
- Auditoria.
- Notificacoes, pois ja existe funcionalidade relacionada no Python e no frontend.

## 14. O que ficara como legado temporario

- Codigo Python antigo movido para `legacy/python` quando util como referencia.
- Documentacao em `legacy/python/README.md` explicara que a API nova nao depende mais desse codigo.
- O legado nao participara de `pnpm build`, `pnpm test`, `pnpm lint` ou `pnpm typecheck`.

## 15. Plano de execucao

1. Criar estrutura profissional com workspaces pnpm.
2. Migrar frontend estatico para `apps/web/public`.
3. Criar API TypeScript em `apps/api`.
4. Criar tipos, enums e permissoes oficiais.
5. Criar camada de erros, validacao, autenticacao e autorizacao.
6. Criar repositorios com JSON temporario de desenvolvimento.
7. Criar schema SQL para PostgreSQL/Supabase.
8. Criar script inicial de migracao de JSON legado para contrato novo.
9. Remover API ativa antiga com ponte Node -> Python.
10. Mover Python antigo para legado temporario documentado.
11. Adicionar testes de unidade e integracao com Vitest e Supertest.
12. Atualizar README e documentos tecnicos.
13. Adicionar CI GitHub Actions.
14. Validar `pnpm lint`, `pnpm typecheck`, `pnpm test` e `pnpm build`.

## Verificacoes obrigatorias

- Conflitos Git abertos: encontrados em `backend/services/aluno_service.py`, `backend/services/auth_service.py`, `backend/services/falta_service.py`, `backend/services/nota_service.py`, `backend/services/ocorrencia_service.py`, `backend/services/sala_service.py`, `backend/utils/db.py` e `backend/utils/validators.py`.
- Mistura Python e Node sem fronteira clara: encontrada.
- Uso de `child_process` ou ponte Node -> Python: encontrado em `api/src/util/pythonBridge.js` e `api/utils/pythonRunner.js`.
- Banco JSON local como persistencia principal: encontrado em `backend/banco_dados.json`.
- README incompleto ou divergente: encontrado.
- Status documentados diferentes dos status reais: ha divergencia visual com `EM_ANALISE` versus textos com acento (`EM_ANÁLISE`) no frontend; a API deve padronizar `EM_ANALISE`.
- `.env` versionado ou segredos expostos: `api/.env` esta versionado.
- `JWT_SECRET` com fallback inseguro: encontrado em `api/src/middlewares/auth.js`.
- Usuario admin padrao inseguro: encontrado no JSON legado e no Python.
- Falta de testes reais na API Node: encontrada.
- Falta de validacao forte de entrada: encontrada.
- Rotas sem autorizacao clara: encontrada em varios controllers/rotas atuais.
- Diferencas de nomes (`sala/turma`, `papel/role`, `categoria/type`, `prioridade/severity`): encontradas.
- Falta de padronizacao de erros: encontrada.
- Falta de CI: encontrada.
- Falta de documentacao para rodar o projeto novo: encontrada.
