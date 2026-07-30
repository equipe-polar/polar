# Endpoints Da API

Todas as rotas vivem sob o prefixo **`/api`** e são em português (decisão registrada do projeto; os aliases legados em inglês foram removidos na v3). Erros seguem o contrato único `{ "error": { "code", "message" } }`.

O prefixo existe porque a API e o SPA compartilham origem: sem ele, `/alunos` seria ao mesmo tempo uma rota do React e um endpoint da API. Ver [decisão de arquitetura](../arquitetura/decisao-postgres.md).

| Metodo | Rota | Descricao | Permissao | Body esperado | Resposta |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/auth/login` | Autentica usuario | Publico (rate-limit + bloqueio por tentativas) | `email`, `senha` | `token`, `user` |
| GET | `/api/auth/me` | Usuario autenticado | Autenticado | - | `user` |
| POST | `/api/auth/alterar-senha` | Troca senha (politica: 8–72, sem espacos nas bordas) | Autenticado | `senhaAtual`, `novaSenha` | `204` |
| GET | `/api/usuarios` | Lista usuarios sem hash | `GERENCIAR_USUARIOS` | - | `data[]` |
| POST | `/api/usuarios` | Cria usuario | `GERENCIAR_USUARIOS` | `nome`, `email`, `papel`, `senha` | `data` |
| PATCH | `/api/usuarios/:id` | Atualiza usuario (inclui inativar) | `GERENCIAR_USUARIOS` | campos parciais | `data` |
| GET | `/api/turmas` | Lista turmas | `CONSULTAR_ALUNOS` | - | `data[]` |
| POST | `/api/turmas` | Cria turma | `GERENCIAR_TURMAS` | `nome`, `anoLetivo`, `turno` | `data` |
| PATCH | `/api/turmas/:id` | Edita turma | `GERENCIAR_TURMAS` | campos parciais | `data` |
| DELETE | `/api/turmas/:id` | **Inativa** turma sem alunos ativos (nunca exclui) | `GERENCIAR_TURMAS` | - | `204` |
| GET | `/api/alunos` | Lista alunos | `CONSULTAR_ALUNOS` | - | `data[]` |
| GET | `/api/alunos/:id` | Busca aluno | `CONSULTAR_ALUNOS` | - | `data` |
| POST | `/api/alunos` | Cria aluno | `GERENCIAR_ALUNOS` | `nome`, `matricula`, `turmaId` | `data` |
| PATCH | `/api/alunos/:id` | Edita aluno | `GERENCIAR_ALUNOS` | campos parciais | `data` |
| DELETE | `/api/alunos/:id` | **Inativa** aluno preservando historico | `GERENCIAR_ALUNOS` | - | `data` |
| GET | `/api/ocorrencias` | Lista com escopo por papel: professor ve **so as proprias**, aluno ve **nenhuma**, demais veem todas | `CONSULTAR_OCORRENCIAS` | - | `data[]` |
| GET | `/api/ocorrencias/:id` | Detalhe (fora do escopo do papel → `403`) | `CONSULTAR_OCORRENCIAS` | - | `data` |
| POST | `/api/ocorrencias` | Registra ocorrencia (nasce `REGISTRADA`; autor/data do backend) | `REGISTRAR_OCORRENCIA` | `alunoId`, `categoria`, `prioridade`, `descricao`, `local?`, `testemunhas?` | `data` |
| PATCH | `/api/ocorrencias/:id` | Edita: **so o autor, so em `REGISTRADA`**, gera historico | `REGISTRAR_OCORRENCIA` | campos parciais | `data` |
| PATCH | `/api/ocorrencias/:id/status` | Avanca status (papel da etapa) | Papel da etapa | `status`, `observacao?` (gravada no historico) | `data` |
| GET | `/api/ocorrencias/:id/historico` | Historico append-only | `CONSULTAR_HISTORICO` | - | `data[]` |
| PUT/PATCH | `/api/ocorrencias/:id/historico/:historicoId` | Bloqueado sempre | Autenticado | qualquer | `405` |
| POST | `/api/notas` | Registra nota (0–10) | `REGISTRAR_NOTAS` | `alunoId`, `disciplina`, `valor`, `etapa`, `data` | `data` |
| GET | `/api/notas/alunos/:alunoId` | Notas do aluno | `CONSULTAR_ALUNOS` | - | `data[]` |
| POST | `/api/faltas` | Registra falta (unica por aluno/dia) | `REGISTRAR_FALTAS` | `alunoId`, `data`, `justificativa?` | `data` |
| GET | `/api/faltas/alunos/:alunoId` | Faltas do aluno | `CONSULTAR_ALUNOS` | - | `data[]` |
| GET | `/api/dashboard` | Totais por status/prioridade/categoria, **no mesmo escopo por papel da listagem** | `CONSULTAR_OCORRENCIAS` | - | totais |
| GET | `/api/relatorios/ocorrencias` | Relatorio agregado | `CONSULTAR_RELATORIOS` | - | agregacoes |
| GET | `/api/relatorios/alunos/:id` | Relatorio do aluno (reincidencia) | `CONSULTAR_RELATORIOS` | - | aluno + ocorrencias |
| GET | `/api/auditoria` | Logs de auditoria | `ACESSAR_AUDITORIA` | - | `data[]` |
| GET | `/api/notificacoes` | Lista notificacoes | `CONSULTAR_OCORRENCIAS` | - | `data[]` |
| POST | `/api/notificacoes` | Cria notificacao | `GERENCIAR_NOTIFICACOES` | `titulo`, `mensagem` | `data` |
| GET | `/api/health` | Health check (tambem responde em `/health`) | Publico | - | `status`, `timestamp` |
| GET | `/api` | Identificacao da API | Publico | - | `name`, `version` |

## Codigos de erro relevantes

| Codigo HTTP | Quando |
| --- | --- |
| `400` | Validacao Zod falhou (campo ausente, descricao curta, caracteres de controle) |
| `401` | Sem token ou token invalido/expirado |
| `403` | Papel sem permissao; leitura fora do escopo do papel (professor em ocorrencia alheia, aluno em qualquer uma); transicao por papel errado |
| `404` | Recurso inexistente |
| `405` | Tentativa de editar historico |
| `409` | Transicao invalida (pular etapa), ocorrencia encerrada, duplicata em janela curta, e-mail/matricula ja usados |
| `423` | Usuario bloqueado temporariamente por tentativas invalidas |
| `429` | Rate-limit de login excedido |
