# RELATÓRIO BD-04
## BD-04 – VERIFICAÇÃO PRÁTICA DA NORMALIZAÇÃO
**Projeto POLAR**  
**Ano:** 2026  
**Autores:** Pietro e Kevin  

---

### 1. Objetivo
Validar, no banco de dados do projeto POLAR, a aplicação dos princípios de normalização, verificando a Primeira, Segunda e Terceira Forma Normal (1FN, 2FN e 3FN).

### 2. 1ª Forma Normal (1FN)
A 1FN exige que os campos possuam valores atômicos, sem listas ou informações multivaloradas. No POLAR, o histórico das ocorrências foi separado na tabela `ocorrencia_historico`, permitindo que cada evento seja armazenado individualmente.

### 3. 2ª Forma Normal (2FN)
A 2FN evita dependências parciais. Na tabela `faltas`, a combinação `aluno_id` e `data` identifica uma falta, enquanto os dados próprios do aluno permanecem na tabela `alunos`.

### 4. 3ª Forma Normal (3FN)
A 3FN evita dependências transitivas. No modelo, informações como `turno` e `ano_letivo` ficam em `turmas`, enquanto `alunos` possui apenas a referência `turma_id`. Da mesma forma, informações dos usuários permanecem em `users`.

### 5. Desnormalização consciente
O campo `ocorrencias.categoria` é armazenado como texto para preservar o valor histórico da categoria no momento do registro. Essa decisão é intencional e está documentada no projeto.

### 6. Conclusão
A seguinte atividade foi realizada usando o site Supabase. Foram utilizados conceitos da 1FN, 2FN e 3FN para ser realizado esses dados. Caso necessário, estou disposto a responder qualquer dúvida. 

### 7. Imagens do processo da atividade
*(As imagens originais do relatório não puderam ser extraídas diretamente para o arquivo de texto)*
