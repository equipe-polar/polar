# Modelo Relacional

O contrato SQL esta em `database/schema.sql`.

## Tabelas

- `users`: usuarios, papel, senha hash, bloqueio de login e flags de seguranca.
- `turmas`: turmas escolares.
- `alunos`: alunos vinculados a turmas.
- `categorias_ocorrencia`: catalogo de categorias.
- `ocorrencias`: registro principal da ocorrencia.
- `ocorrencia_historico`: historico automatico e imutavel.
- `notas`: notas por aluno.
- `faltas`: faltas por aluno e data.
- `user_permissions`: permissoes adicionais por usuario.
- `audit_logs`: auditoria de acoes sensiveis.
- `notifications`: notificacoes internas.

## Relacionamentos

- `alunos.turma_id -> turmas.id`
- `ocorrencias.aluno_id -> alunos.id`
- `ocorrencias.criado_por_id -> users.id`
- `ocorrencia_historico.ocorrencia_id -> ocorrencias.id`
- `ocorrencia_historico.usuario_id -> users.id`
- `notas.aluno_id -> alunos.id`
- `notas.professor_id -> users.id`
- `faltas.aluno_id -> alunos.id`
- `faltas.registrada_por_id -> users.id`
- `notifications.ocorrencia_id -> ocorrencias.id`
- `notifications.destinatario_id -> users.id`

## Regras De Integridade

- Papel limitado a `PROFESSOR`, `COORDENADOR`, `DIRETOR`, `ADM`.
- Status limitado a `REGISTRADA`, `EM_ANALISE`, `RESOLVIDA`, `ENCERRADA`.
- Prioridade limitada a `BAIXA`, `MEDIA`, `ALTA`.
- Ocorrencia guarda `local` e `testemunhas` como contexto operacional do registro.
- Nota entre 0 e 10.
- Falta unica por aluno e data.
- Historico sempre vinculado a uma ocorrencia.
