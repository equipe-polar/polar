# Normalização do modelo do POLAR (1FN → 3FN)

Este documento demonstra, com o modelo real do sistema, as formas normais estudadas em Database Modeling and Development.

## Ponto de partida (como NÃO modelar)

Uma "tabela única" de ocorrências, como seria num caderno ou planilha:

| ocorrencia | aluno | turma | turno | professor | email_professor | status | historico |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Atraso... | João Não-Silva | 3ºB - DS | Manhã | Carlos Andrade | professor@... | RESOLVIDA | "10/07 registrada; 11/07 análise; 12/07 resolvida" |

Problemas: dados repetidos (turma/turno em toda linha), campo multivalorado (`historico`), atualização inconsistente (renomear a turma exige alterar N linhas), impossibilidade de consultar o histórico com SQL.

## 1FN — atomicidade

**Regra**: todo campo contém um único valor atômico; nada de listas dentro de células.

**Aplicação**: o campo `historico` multivalorado vira a tabela `ocorrencia_historico`, uma linha por evento, com FK para a ocorrência. Testemunhas/local viram campos próprios da ocorrência.

## 2FN — dependência total da chave

**Regra**: (para chaves compostas) nenhum atributo depende de só uma parte da chave.

**Aplicação**: `faltas` tem unicidade composta `(aluno_id, data)`, mas os atributos (`justificativa`, `registrada_por_id`) dependem da combinação inteira — nenhum campo de aluno mora em `faltas`. Dados do aluno moram só em `alunos`.

## 3FN — sem dependência transitiva

**Regra**: nenhum atributo não-chave depende de outro atributo não-chave.

**Aplicação**:
- `turno` e `ano_letivo` dependem da **turma**, não do aluno → moram em `turmas`; `alunos` guarda só `turma_id`.
- `email` e `papel` dependem do **usuário**, não da ocorrência → `ocorrencias` guarda só `criado_por_id`.
- A ocorrência **não** guarda `turma_id`: a turma deriva do aluno (`ocorrencias.aluno_id → alunos.turma_id`), eliminando o risco de divergência apontado na revisão técnica do projeto (aluno mudar de turma deixaria duas verdades no banco).

## Desnormalização consciente (e justificada)

`ocorrencias.categoria` é texto, não FK para `categorias_ocorrencia`. Motivo: valor histórico — se a escola renomear ou desativar uma categoria, as ocorrências antigas preservam o texto original da época do registro. É uma exceção deliberada de snapshot, documentada, não um esquecimento.

## Verificação prática

```sql
-- Reincidência por aluno (só é possível porque o histórico é tabela própria - 1FN):
SELECT a.nome, COUNT(o.id) AS total_ocorrencias
  FROM alunos a
  JOIN ocorrencias o ON o.aluno_id = a.id
 GROUP BY a.id, a.nome
 ORDER BY total_ocorrencias DESC;

-- Renomear turma atualiza UMA linha (3FN):
UPDATE turmas SET nome = '3ºC - Desenvolvimento de Sistemas' WHERE id = :id;
```
