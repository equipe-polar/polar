# Telas do frontend React

| Tela | Rota | Objetivo | Permissao |
| --- | --- | --- | --- |
| Login | `/login` | Autenticar usuario | Publico |
| Dashboard | `/` | Resumo operacional | `dashboard:view` |
| Lista de ocorrencias | `/ocorrencias` | Consultar e filtrar ocorrencias | `ocorrencias:view` |
| Nova ocorrencia | `/ocorrencias/nova` | Registrar ocorrencia | `ocorrencias:create` |
| Detalhe da ocorrencia | `/ocorrencias/:id` | Ver dados, status, descricao e historico | `ocorrencias:view` |
| Gestao de alunos | `/alunos` | Buscar alunos e acessar historico | `alunos:view` |
| Perfil do aluno | `/alunos/:id` | Ver ocorrencias, notas e faltas | `alunos:view` |
| Gestao de turmas | `/turmas` | Listar turmas e permitir edicao por perfil | `turmas:view` |
| Gestao de usuarios | `/usuarios` | Criar e acompanhar usuarios | `usuarios:manage` |
| Relatorios | `/relatorios` | Consultar indicadores e filtros | `relatorios:view` |
| Configuracoes | `/configuracoes` | Dados institucionais e preferencias | `configuracoes:manage` |
| Acesso negado | `/acesso-negado` | Informar falta de permissao | Autenticado |
| Nao encontrada | `/404` | Informar rota inexistente | Autenticado |

## Permissoes aplicadas no frontend

O frontend esconde menus e acoes conforme o papel do usuario por meio de `canAccess(userRole, permission)`. A seguranca real permanece no backend.

## Observacao sobre dados

As telas principais consomem a API Node/TypeScript via `src/services/api.ts` e `src/services/school.service.ts`.

`VITE_API_URL` define o endereco do backend. Os testes do frontend usam `fetch` mockado apenas no ambiente Vitest; a aplicacao em desenvolvimento e producao nao usa fallback local de dados.
