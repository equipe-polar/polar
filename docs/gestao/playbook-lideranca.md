# Playbook de Liderança — POLAR (3º Bimestre)

Regras operacionais do projeto, destiladas das lições dos dois primeiros bimestres. São regras de **processo**, não de pessoas — valem para qualquer líder e qualquer membro.

## 1. Fonte única de verdade

**O GitHub é a fonte única de verdade do projeto.** Issues para tarefas, PRs para entregas, `/docs` para decisões. WhatsApp serve para avisar ("subi o PR #12"), nunca para decidir. Decisão tomada em conversa e não registrada **não existe** — quem decidiu registra no mesmo dia, ou a decisão é nula.

*Por quê: o projeto já perdeu retrabalho inteiro por decisão de lousa nunca registrada — membro entregou artefato com escopo errado porque a mudança só existia em foto de quadro.*

## 2. Anatomia de uma tarefa

Uma tarefa só existe se tiver **todos** os campos:

1. **O quê** — uma frase.
2. **Critério de aceite** — verificável por terceiro ("roda sem erro", "print anexado", "build passa").
3. **Arquivos exatos** — onde mexer.
4. **Exemplo pronto** — um trecho do próprio projeto que já faz algo parecido.
5. **Validador nomeado** — quem aprova, definido no ato da atribuição.
6. **Esforço** — P ou M. Tarefa G não existe: quebre em duas.

"Faz a tela X até sexta" não é tarefa — é loteria.

## 3. Prazos

- Prazo curto (3 dias úteis no máximo), **um** por tarefa, definido junto com o membro considerando a realidade dele (trabalho, falta de equipamento).
- **Prazo dado não se cancela.** Se a semana mudou, o líder renegocia individualmente ANTES do vencimento — nunca anula em massa depois de cobrar.
- Checkpoint no meio do prazo para tarefas M: "travou em algo?" — pergunta individual, não broadcast.

*Por quê: prazos emitidos e cancelados em sequência ensinaram a equipe que prazo é decoração.*

## 4. Cobrança e reconhecimento

- **Cobrança individual, em privado, sempre.** Nunca comparar membros em público ("fulano entregou 7, você entregou 2") — isso já custou um membro ao projeto.
- **Reconhecimento em público, sempre.** Entregou com aceite batido → nome citado no grupo e no relatório da semana.
- Não entregou 2 vezes seguidas sem avisar → a tarefa é realocada **com registro na Issue** e o fato entra no relatório de contribuição — sem drama, sem sermão, é só consequência documentada.

## 5. Bloqueios materiais são dados de planejamento

Quem não tem computador/internet em casa recebe tarefas executáveis na escola (o backlog marca quais são). Isso se decide **na atribuição**, não na cobrança. Tratar bloqueio material como desculpa gera relatório de "desinteresse" falso e mata o engajamento restante.

## 6. Dependências

- Nenhuma cadeia passa por uma pessoa só. Se a tarefa B espera a A, B recebe um artefato de entrada **mockado** para trabalhar em paralelo.
- Membro sem canal de comunicação confiável não entra em cadeia de dependência de jeito nenhum.

## 7. Entrega e validação

- Entrega = **PR aberto** (ou arquivo no lugar certo + Issue atualizada, para tarefas não-código). Print no WhatsApp não é entrega.
- O validador tem 2 dias úteis para aprovar ou devolver com lista objetiva do que falta. Devolução não é reprovação pública — é comentário no PR.
- Se o validador aceitar algo errado, o erro é do validador, não do autor. Validar é trabalho, e conta como contribuição.

## 8. Estrutura congelada

**Zero reorganização de setores até a banca.** A estrutura atual (Frontend, Banco de Dados, QA, Documentação, Versionamento) é a final. Realocações pontuais são individuais, comunicadas em privado ao afetado E confirmadas por ele antes de qualquer anúncio.

*Por quê: cinco reorganizações comunicadas por tabela no grupo produziram gente trabalhando no setor errado sem saber.*

## 9. Decisão técnica

Mudança de stack, banco, arquitetura ou escopo exige **ADR escrito em `docs/arquitetura/` ANTES de executar** — contexto, decisão, alternativas, consequências. Anunciar mudança já executada é proibido; cada troca surpresa invalida o estudo de quem estava se adaptando.

## 10. Reuniões e rituais (mínimo que funciona)

- **1 checkpoint semanal de 15 min** (presencial, na aula): cada setor fala o que fechou, o que trava. Sem slides, sem relatório — a Issue é o relatório.
- Sprint/planejamento é a atualização das Issues, não um documento novo.
- Cerimônia que ninguém executa não entra no processo (retrospectivas formais, 4 modelos de relatório encaixados: abolidos).

## 11. O líder técnico não é o executor universal

Redistribuir tarefa de quem não entrega para quem entrega **sem consequência registrada** ensina que não entregar é grátis e sobrecarrega quem produz. O caminho é: realoca + registra + reflete no relatório de contribuição. E o líder só absorve tarefa se ela for de caminho crítico — bônus atrasado morre no backlog, não vira madrugada de ninguém.

## 12. Comunicação com os professores

Interface institucional única (um líder designado) com atualização curta semanal: o que está pronto (com link), o que vem, onde precisa de apoio. Problema de comprometimento é reportado com fatos e Issues, não com queixas.

## 13. Segurança operacional

- Credencial em grupo de mensagem = incidente: rotacionar na hora e registrar.
- `.env` nunca versionado; segredos só em variável de ambiente.
- Dado real de aluno é proibido em qualquer demonstração, print ou documento.

## 14. Relatório de contribuição final

Alimentado pelas Issues/PRs (autor + validador + data), gerado ao final do bimestre. Objetivo: reconhecimento justo na banca — não punição. Quem quiser melhorar a própria fatia sabe exatamente o que fazer: pegar tarefa do backlog e entregar com aceite.
