# BD-01 – Consultas de Relatório Comentadas

**Responsáveis:** Daniel e Felipe

---

# 1. O que foi desenvolvido

Foi desenvolvido um arquivo SQL chamado `consultas-relatorio.sql`, dentro da pasta `database` do projeto. O objetivo foi criar consultas para gerar relatórios utilizando os dados armazenados no PostgreSQL.

Foram utilizadas consultas com comandos como `SELECT`, `GROUP BY`, `ORDER BY`, `COUNT()`, `AVG()`, `LIMIT` e `JOIN`. Esses comandos permitem buscar, agrupar, contar, calcular médias, organizar resultados e juntar informações de tabelas diferentes.

---

# 2. Consultas desenvolvidas

- **Ocorrências por status** – conta quantas ocorrências existem em cada status.
- **Ocorrências por categoria** – mostra a quantidade de ocorrências de cada categoria.
- **Ocorrências por turma** – relaciona ocorrências, alunos e turmas para fazer a contagem.
- **Top 5 alunos por reincidência** – mostra os cinco alunos com mais ocorrências.
- **Ocorrências por autor** – mostra quantas ocorrências foram cadastradas por cada autor.
- **Média de notas por turma** – calcula a média das notas dos alunos de cada turma.

---

# 3. Código desenvolvido

```sql
-- 1. Quantidade de ocorrências por status
SELECT status, COUNT(*) AS total
FROM ocorrencias
GROUP BY status
ORDER BY total DESC;

-- 2. Quantidade de ocorrências por categoria
SELECT categoria, COUNT(*) AS total
FROM ocorrencias
GROUP BY categoria
ORDER BY total DESC;

-- 3. Quantidade de ocorrências por turma
SELECT t.nome AS turma, COUNT(o.id) AS total
FROM ocorrencias o
JOIN alunos a ON o.aluno_id = a.id
JOIN turmas t ON a.turma_id = t.id
GROUP BY t.nome
ORDER BY total DESC;

-- 4. Cinco alunos com mais ocorrências
SELECT a.nome, COUNT(o.id) AS total
FROM alunos a
JOIN ocorrencias o ON o.aluno_id = a.id
GROUP BY a.id, a.nome
ORDER BY total DESC
LIMIT 5;

-- 5. Quantidade de ocorrências por autor
SELECT u.nome AS autor, COUNT(o.id) AS total
FROM users u
JOIN ocorrencias o ON o.criado_por_id = u.id
GROUP BY u.id, u.nome
ORDER BY total DESC;

-- 6. Média de notas por turma
SELECT t.nome AS turma, AVG(n.valor) AS media
FROM notas n
JOIN alunos a ON n.aluno_id = a.id
JOIN turmas t ON a.turma_id = t.id
GROUP BY t.nome
ORDER BY media DESC;
```

---

# 4. Evidência / imagem

> docs/banco-de-dados/relatorios/imagens/evidencia-bd-01.png.

---

# 5. Como foi realizado

1. Foi estudada a estrutura das tabelas do banco de dados.
2. Foi criado o arquivo `database/consultas-relatorio.sql`.
3. As consultas solicitadas foram escritas utilizando SQL.
4. Foram utilizados `JOIN`s quando as informações estavam em tabelas diferentes.
5. As consultas foram organizadas e comentadas para facilitar o entendimento.
6. Os resultados devem ser testados no SQL Editor do Supabase para confirmar que estão corretos.

---

# 6. Conclusão

A atividade permitiu praticar consultas SQL e entender como os dados de diferentes tabelas podem ser utilizados para gerar relatórios. Também foi possível compreender a importância de comandos de agrupamento, contagem, média, relacionamentos entre tabelas e índices para o desempenho do banco.