# Endpoints Da API

Todas as rotas são em português (decisão registrada do projeto; os aliases legados em inglês foram removidos na v3). Erros seguem o contrato único `{ "error": { "code", "message" } }`.

| Metodo | Rota | Descricao | Permissao | Body esperado | Resposta |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/login` | Autentica usuario | Publico (rate-limit + bloqueio por tentativas) | `email`, `senha` | `token`, `user` |
| GET | `/auth/me` | Usuario autenticado | Autenticado | - | `user` |
| POST | `/auth/alterar-senha` | Troca senha (politica: 8–72, sem espacos nas bordas) | Autenticado | `senhaAtual`, `novaSenha` | `204` |
| GET | `/usuarios` | Lista usuarios sem hash | `GERENCIAR_USUARIOS` | - | `data[]` |
| POST | `/usuarios` | Cria usuario | `GERENCIAR_USUARIOS` | `nome`, `email`, `papel`, `senha` | `data` |
| PATCH | `/usuarios/:id` | Atualiza usuario (inclui inativar) | `GERENCIAR_USUARIOS` | campos parciais | `data` |
| GET | `/turmas` | Lista turmas | `CONSULTAR_ALUNOS` | - | `data[]` |
| POST | `/turmas` | Cria turma | `GERENCIAR_TURMAS` | `nome`, `anoLetivo`, `turno` | `data` |
| PATCH | `/turmas/:id` | Edita turma | `GERENCIAR_TURMAS` | campos parciais | `data` |
| DELETE | `/turmas/:id` | **Inativa** turma sem alunos ativos (nunca exclui) | `GERENCIAR_TURMAS` | - | `204` |
| GET | `/alunos` | Lista alunos | `CONSULTAR_ALUNOS` | - | `data[]` |
| GET | `/alunos/:id` | Busca aluno | `CONSULTAR_ALUNOS` | - | `data` |
| POST | `/alunos` | Cria aluno | `GERENCIAR_ALUNOS` | `nome`, `matricula`, `turmaId` | `data` |
| PATCH | `/alunos/:id` | Edita aluno | `GERENCIAR_ALUNOS` | campos parciais | `data` |
| DELETE | `/alunos/:id` | **Inativa** aluno preservando historico | `GERENCIAR_ALUNOS` | - | `data` |
| GET | `/ocorrencias` | Lista (professor: **so as proprias**; demais: todas) | `CONSULTAR_OCORRENCIAS` | - | `data[]` |
| GET | `/ocorrencias/:id` | Detalhe (professor: so as proprias → `403`) | `CONSULTAR_OCORRENCIAS` | - | `data` |
| POST | `/ocorrencias` | Registra ocorrencia (nasce `REGISTRADA`; autor/data do backend) | `REGISTRAR_OCORRENCIA` | `alunoId`, `categoria`, `prioridade`, `descricao`, `local?`, `testemunhas?` | `data` |
| PATCH | `/ocorrencias/:id` | Edita: **so o autor, so em `REGISTRADA`**, gera historico | `REGISTRAR_OCORRENCIA` | campos parciais | `data` |
| PATCH | `/ocorrencias/:id/status` | Avanca status (papel da etapa) | Papel da etapa | `status`, `observacao?` (gravada no historico) | `data` |
| GET | `/ocorrencias/:id/historico` | Historico append-only | `CONSULTAR_HISTORICO` | - | `data[]` |
| PUT/PATCH | `/ocorrencias/:id/historico/:historicoId` | Bloqueado sempre | Autenticado | qualquer | `405` |
| POST | `/notas` | Registra nota (0–10) | `REGISTRAR_NOTAS` | `alunoId`, `disciplina`, `valor`, `etapa`, `data` | `data` |
| GET | `/notas/alunos/:alunoId` | Notas do aluno | `CONSULTAR_ALUNOS` | - | `data[]` |
| POST | `/faltas` | Registra falta (unica por aluno/dia) | `REGISTRAR_FALTAS` | `alunoId`, `data`, `justificativa?` | `data` |
| GET | `/faltas/alunos/:alunoId` | Faltas do aluno | `CONSULTAR_ALUNOS` | - | `data[]` |
| GET | `/dashboard` | Totais por status/prioridade/categoria | `CONSULTAR_OCORRENCIAS` | - | totais |
| GET | `/relatorios/ocorrencias` | Relatorio agregado | `CONSULTAR_RELATORIOS` | - | agregacoes |
| GET | `/relatorios/alunos/:id` | Relatorio do aluno (reincidencia) | `CONSULTAR_RELATORIOS` | - | aluno + ocorrencias |
| GET | `/auditoria` | Logs de auditoria | `ACESSAR_AUDITORIA` | - | `data[]` |
| GET | `/notificacoes` | Lista notificacoes | `CONSULTAR_OCORRENCIAS` | - | `data[]` |
| POST | `/notificacoes` | Cria notificacao | `GERENCIAR_NOTIFICACOES` | `titulo`, `mensagem` | `data` |
| GET | `/health` | Health check (deploy/keepalive) | Publico | - | `status`, `timestamp` |
| GET | `/api` | Identificacao da API | Publico | - | `name`, `version` |

## Codigos de erro relevantes

| Codigo HTTP | Quando |
| --- | --- |
| `400` | Validacao Zod falhou (campo ausente, descricao curta, caracteres de controle) |
| `401` | Sem token ou token invalido/expirado |
| `403` | Papel sem permissao; professor acessando ocorrencia alheia; transicao por papel errado |
| `404` | Recurso inexistente |
| `405` | Tentativa de editar historico |
| `409` | Transicao invalida (pular etapa), ocorrencia encerrada, duplicata em janela curta, e-mail/matricula ja usados |
| `423` | Usuario bloqueado temporariamente por tentativas invalidas |
| `429` | Rate-limit de login excedido |
