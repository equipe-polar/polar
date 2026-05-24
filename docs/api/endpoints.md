# Endpoints Da API

| Metodo | Rota | Descricao | Permissao | Body esperado | Resposta esperada |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/login` | Autentica usuario | Publico | `email` ou `username`, `senha` ou `password` | `token`, `user` |
| GET | `/auth/me` | Retorna usuario autenticado | Autenticado | - | `user` |
| POST | `/auth/alterar-senha` | Troca senha | Autenticado | `senhaAtual`, `novaSenha` | `204` |
| GET | `/usuarios` | Lista usuarios sem hash | `GERENCIAR_USUARIOS` | - | `data[]` |
| POST | `/usuarios` | Cria usuario | `GERENCIAR_USUARIOS` | `nome`, `email`, `papel`, `senha` | `data` |
| PATCH | `/usuarios/:id` | Atualiza usuario | `GERENCIAR_USUARIOS` | campos parciais | `data` |
| GET | `/turmas` | Lista turmas | `CONSULTAR_ALUNOS` | - | `data[]` |
| POST | `/turmas` | Cria turma | `GERENCIAR_TURMAS` | `nome`, `anoLetivo`, `turno` | `data` |
| PATCH | `/turmas/:id` | Edita turma | `GERENCIAR_TURMAS` | campos parciais | `data` |
| DELETE | `/turmas/:id` | Remove turma sem alunos | `GERENCIAR_TURMAS` | - | `204` |
| GET | `/alunos` | Lista alunos | `CONSULTAR_ALUNOS` | - | `data[]` |
| GET | `/alunos/:id` | Busca aluno | `CONSULTAR_ALUNOS` | - | `data` |
| POST | `/alunos` | Cria aluno | `GERENCIAR_ALUNOS` | `nome`, `matricula`, `turmaId` | `data` |
| PATCH | `/alunos/:id` | Edita aluno | `GERENCIAR_ALUNOS` | campos parciais | `data` |
| DELETE | `/alunos/:id` | Desativa aluno preservando historico | `GERENCIAR_ALUNOS` | - | `data` |
| GET | `/ocorrencias` | Lista ocorrencias | `CONSULTAR_OCORRENCIAS` | - | `data[]` |
| GET | `/ocorrencias/:id` | Busca ocorrencia | `CONSULTAR_OCORRENCIAS` | - | `data` |
| POST | `/ocorrencias` | Registra ocorrencia | `REGISTRAR_OCORRENCIA` | `alunoId`, `categoria`, `prioridade`, `descricao`, `local`, `testemunhas` | `data` |
| PATCH | `/ocorrencias/:id` | Edita dados da ocorrencia aberta | `REGISTRAR_OCORRENCIA` | campos parciais | `data` |
| PATCH | `/ocorrencias/:id/status` | Avanca status | Papel da etapa | `status` | `data` |
| GET | `/ocorrencias/:id/historico` | Lista historico | `CONSULTAR_HISTORICO` | - | `data[]` |
| PUT | `/ocorrencias/:id/historico/:historicoId` | Bloqueia edicao manual | Autenticado | qualquer | `405` |
| POST | `/notas` | Registra nota | `REGISTRAR_NOTAS` | `alunoId`, `disciplina`, `valor`, `etapa`, `data` | `data` |
| GET | `/notas/alunos/:alunoId` | Lista notas do aluno | `CONSULTAR_ALUNOS` | - | `data[]` |
| POST | `/faltas` | Registra falta | `REGISTRAR_FALTAS` | `alunoId`, `data`, `justificativa` | `data` |
| GET | `/faltas/alunos/:alunoId` | Lista faltas do aluno | `CONSULTAR_ALUNOS` | - | `data[]` |
| GET | `/dashboard` | Resumo operacional | `CONSULTAR_OCORRENCIAS` | - | totais |
| GET | `/relatorios/ocorrencias` | Relatorio de ocorrencias | `CONSULTAR_RELATORIOS` | - | agregacoes |
| GET | `/relatorios/alunos/:id` | Relatorio do aluno | `CONSULTAR_RELATORIOS` | - | aluno e ocorrencias |
| GET | `/auditoria` | Lista logs de auditoria | `ACESSAR_AUDITORIA` | - | `data[]` |
| GET | `/notificacoes` | Lista notificacoes | `CONSULTAR_OCORRENCIAS` | - | `data[]` |
| POST | `/notificacoes` | Cria notificacao | `GERENCIAR_NOTIFICACOES` | `titulo`, `mensagem` | `data` |

Aliases legados mantidos temporariamente: `/users`, `/students`, `/occurrences`, `/reports`, `/notifications`.
