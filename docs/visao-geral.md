# POLAR — Visão Geral do Produto

> Documento canônico do produto. Em caso de divergência com documentos anteriores (PM-GPO, Acta, glossários de abril), **este documento prevalece**.

## 1. O problema

Nas escolas públicas de ensino médio/técnico, o registro de ocorrências disciplinares e pedagógicas é informal e disperso: papel, conversa de corredor, mensagem avulsa. As consequências, levantadas com a coordenação escolar (cliente real, representado pelo professor Gabriel):

1. **Perda de informação** entre o professor que presencia o fato e a coordenação que precisa agir.
2. **Ausência de histórico por aluno** — impossível identificar reincidência.
3. **Falta de visibilidade da etapa** — não se sabe em que pé está cada caso nem quem é o responsável no momento.
4. **Ausência de rastreabilidade** — não se sabe quem fez o quê, quando.

## 2. A solução

O POLAR digitaliza o processo institucional de ocorrências em um fluxo único que não pode ser burlado:

```text
PROFESSOR registra → COORDENAÇÃO analisa e resolve → DIREÇÃO encerra
```

Cada ação gera um registro de **histórico imutável** (append-only). O valor central do sistema é o **histórico permanente por aluno**, que permite à gestão identificar reincidência e agir com base em dados.

O nome evoluiu ao longo do projeto: PM-GPO → Acta → P.O.L.A → **POLAR** (nome oficial atual).

## 3. Papéis

| Papel | Pode | Não pode |
| --- | --- | --- |
| `PROFESSOR` | Registrar ocorrência; consultar/editar **as próprias** (edição só em `REGISTRADA`); registrar notas e faltas | Alterar status; ver ocorrências de outros professores |
| `COORDENADOR` | Ver todas; `REGISTRADA→EM_ANALISE`; `EM_ANALISE→RESOLVIDA` (com observação); relatórios operacionais | Encerrar; pular etapas; editar histórico |
| `DIRETOR` | Ver todas; `RESOLVIDA→ENCERRADA` (com observação); relatórios gerais | Analisar/resolver; editar histórico |
| `ADM` | Gerir usuários, turmas, alunos, configurações e auditoria | Alterar status de ocorrência; editar ocorrência de terceiros |
| `ALUNO` | Autenticar; conta somente leitura | Registrar ou alterar ocorrência; ver ocorrência alguma (ver nota) |

**Sobre o papel `ALUNO`.** A conta existe e autentica, mas o modelo ainda não liga um `Usuario` a um registro de `Aluno`. Sem esse vínculo não há como decidir *quais* ocorrências são "as dele", e a regra do sistema é negar por padrão: listagem vazia e dashboard zerado. `Aluno` continua sendo entidade de dados — a conta de papel `ALUNO` é uma coisa, o registro do estudante é outra.

## 4. Escopo

### Obrigatório (MVP — critério de reprovação se falhar)

- Autenticação JWT com senha em hash (bcrypt) e papéis.
- RBAC aplicado **no backend** (a UI apenas oculta; o servidor bloqueia).
- Cadastro/listagem de usuários, turmas e alunos (sem auto-cadastro).
- Registro de ocorrência (aluno, categoria, prioridade `BAIXA|MEDIA|ALTA`, descrição ≥ 10 caracteres); autor e data derivados no backend; status inicial `REGISTRADA`.
- Máquina de estados com exatamente 4 estados e 3 transições, cada uma restrita a um papel.
- Histórico automático append-only, sem rota de edição/exclusão (tentativa → `405`).
- Ocorrência `ENCERRADA` é somente leitura.
- Histórico permanente por aluno (tela de reincidência).
- **Persistência real em PostgreSQL** — dados sobrevivem a restart (teste T10).
- Validação de entrada (Zod) com suporte pleno a acentuação PT-BR.

### Desejável (entregue como bônus)

Dashboard de indicadores, filtros combinados, notas e faltas, notificações internas, relatórios, auditoria de ações, observação/encaminhamento nas transições, deploy público.

### Fora de escopo

App mobile nativo; multi-escola; integração com sistemas externos (SEDUC etc.); comunicação com pais (e-mail/SMS); dashboards analíticos complexos/BI; IA embarcada; aluno como usuário.

Princípio de controle: **"se não ajuda diretamente a registrar ou acompanhar ocorrências, não entra no MVP."**

## 5. Critério de aceite (roteiro dos 6 passos)

> Se qualquer etapa falhar, o MVP não está concluído.

1. Professor faz login.
2. Professor registra ocorrência.
3. Coordenação visualiza a ocorrência.
4. Coordenação altera o status (análise → resolvida, com observação).
5. Direção encerra.
6. O histórico mostra todas as ações, com autores e datas corretos.

## 6. Definition of Done

Uma funcionalidade só está pronta quando: **(1)** funciona pela interface, **(2)** persiste no banco, **(3)** respeita permissões e **(4)** aparece corretamente nas listagens.

## 7. Vocabulário obrigatório

- **Ocorrência** — nunca "chamado", "ticket" ou "tarefa" (sistema institucional, não help desk).
- **Resolvida ≠ Encerrada** — encerramento é ato institucional formal, exclusivo da direção.
- **4 estados oficiais**: `REGISTRADA`, `EM_ANALISE`, `RESOLVIDA`, `ENCERRADA` (não existe "Em atendimento").
