# Modelo Relacional do POLAR (MySQL 8)

Fonte da verdade: [database/schema.sql](../../database/schema.sql). Charset `utf8mb4` / collation `utf8mb4_unicode_ci` em todas as tabelas (acentuação PT-BR é requisito de negócio).

## DER

```mermaid
erDiagram
    users ||--o{ ocorrencias : "registra (criado_por_id)"
    users ||--o{ ocorrencia_historico : "executa (usuario_id)"
    users ||--o{ notas : "lanca (professor_id)"
    users ||--o{ faltas : "registra (registrada_por_id)"
    users ||--o{ audit_logs : "gera"
    users ||--o{ notifications : "recebe"
    users ||--o{ user_permissions : "possui"
    turmas ||--o{ alunos : "agrupa"
    alunos ||--o{ ocorrencias : "sofre"
    alunos ||--o{ notas : "possui"
    alunos ||--o{ faltas : "possui"
    ocorrencias ||--o{ ocorrencia_historico : "gera (append-only)"
    ocorrencias ||--o{ notifications : "origina"

    users {
        char36 id PK
        varchar nome
        varchar email UK
        enum papel "PROFESSOR|COORDENADOR|DIRETOR|ADM"
        varchar senha_hash "bcrypt"
        tinyint ativo
        tinyint precisa_trocar_senha
        int tentativas_login_invalidas
        datetime bloqueado_ate
        datetime ultimo_login_em
    }
    turmas {
        char36 id PK
        varchar nome UK
        int ano_letivo
        varchar turno
        tinyint ativa
    }
    alunos {
        char36 id PK
        varchar nome
        varchar matricula UK
        char36 turma_id FK
        varchar responsavel_nome
        varchar responsavel_contato
        tinyint ativo
    }
    ocorrencias {
        char36 id PK
        char36 aluno_id FK
        varchar categoria
        enum prioridade "BAIXA|MEDIA|ALTA"
        text descricao
        enum status "REGISTRADA|EM_ANALISE|RESOLVIDA|ENCERRADA"
        char36 criado_por_id FK
    }
    ocorrencia_historico {
        char36 id PK
        char36 ocorrencia_id FK
        enum status
        varchar acao
        text observacao "encaminhamento opcional"
        char36 usuario_id FK
        datetime criado_em
    }
    notas {
        char36 id PK
        char36 aluno_id FK
        varchar disciplina
        decimal valor "CHECK 0..10"
        varchar etapa
        char36 professor_id FK
        date data
    }
    faltas {
        char36 id PK
        char36 aluno_id FK
        date data "UNIQUE(aluno_id, data)"
        text justificativa
        char36 registrada_por_id FK
    }
    audit_logs {
        char36 id PK
        char36 usuario_id FK
        varchar acao
        varchar entidade
        char36 entidade_id
        json metadata
    }
    notifications {
        char36 id PK
        varchar titulo
        text mensagem
        char36 destinatario_id FK
        char36 ocorrencia_id FK
        tinyint lida
        char36 criado_por_id FK
    }
```

(Tabela auxiliar `categorias_ocorrencia` — id, nome único, ativa — alimenta o formulário; a ocorrência guarda o nome da categoria como texto para preservar o valor histórico mesmo se a categoria for renomeada depois.)

## Dicionário de dados (resumo por tabela)

| Tabela | Papel no domínio | Chaves e restrições |
| --- | --- | --- |
| `users` | Contas que autenticam (aluno NUNCA está aqui) | PK `id`; UNIQUE `email`; `papel` ENUM; senha só em hash |
| `turmas` | Agrupamento institucional | PK `id`; UNIQUE `nome`; inativação lógica (`ativa`) |
| `alunos` | Entidade de dados (não autentica) | PK `id`; UNIQUE `matricula`; FK `turma_id`; inativação lógica |
| `categorias_ocorrencia` | Tipos oficiais de ocorrência | PK `id`; UNIQUE `nome`; desativa sem excluir |
| `ocorrencias` | Núcleo do domínio | FKs `aluno_id`, `criado_por_id`; ENUMs de status/prioridade; sem DELETE |
| `ocorrencia_historico` | Trilha imutável | FKs; **append-only: só INSERT em todas as camadas** |
| `notas` | Módulo acadêmico (bônus) | FK aluno/professor; CHECK `valor` 0–10 |
| `faltas` | Módulo acadêmico (bônus) | UNIQUE `(aluno_id, data)` impede falta duplicada no dia |
| `user_permissions` | Permissões extras por usuário | UNIQUE `(usuario_id, permissao)` |
| `audit_logs` | Auditoria de ações sensíveis | `metadata` JSON; índice por entidade |
| `notifications` | Avisos internos (sino) | FKs opcionais para destinatário/ocorrência |

## Índices

- `ocorrencias`: `status`, `aluno_id`, `criado_por_id`, `criado_em` — cobrem a lista filtrada, o histórico por aluno (reincidência), a visão "minhas ocorrências" do professor e a ordenação temporal.
- `ocorrencia_historico`: `ocorrencia_id` — timeline do detalhe.
- `audit_logs`: `(entidade, entidade_id)` e `criado_em`.

## Regras de integridade que o banco garante

1. FKs impedem ocorrência sem aluno, aluno sem turma, histórico sem ocorrência.
2. ENUMs impedem status/papel/prioridade fora do domínio (defesa em profundidade — o backend valida antes).
3. UNIQUEs impedem e-mail, matrícula e nome de turma duplicados, e falta duplicada por dia.
4. CHECK impede nota fora de 0–10.
5. Datas em `DATETIME(3)` UTC geradas pelo backend — o banco nunca inventa data de negócio.
