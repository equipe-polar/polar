Segue a conversão do documento para **Markdown (.md)**, mantendo a organização e a formatação adequada. O conteúdo foi extraído do arquivo `.docx` enviado. 

````md
# BD-02 – Papel de Aplicação com Privilégios Mínimos (P)

**Responsável:** Kevin

**Data:** 06/08/2026

---

# Testes

## Teste 1 – Criação das duas roles

**Comando:**

```sql
DO $$
BEGIN
    CREATE ROLE polar_app WITH LOGIN PASSWORD 'Njr10#Brasil';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT, INSERT, UPDATE ON
    users,
    alunos,
    turmas,
    ocorrencias
TO polar_app;

GRANT SELECT, INSERT ON
    notas,
    faltas,
    audit_logs,
    ocorrencia_historico
TO polar_app;

GRANT SELECT ON
    categorias_ocorrencia
TO polar_app;

DO $$
BEGIN
    CREATE ROLE polar_leitura WITH LOGIN PASSWORD 'VamoNeymar!10';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

GRANT SELECT ON
    users,
    alunos,
    turmas,
    ocorrencias,
    ocorrencia_historico,
    notas,
    faltas,
    audit_logs,
    categorias_ocorrencia
TO polar_leitura;
```

### Evidência

> docs/banco-de-dados/relatorios/imagens/evidencia-bd-02(1).png

---

## Teste 2 – Confirmar que `polar_app` consegue ler dados normalmente

**Comando:**

```sql
SET ROLE polar_app;

SELECT *
FROM alunos
LIMIT 1;
```

### Evidência

> docs/banco-de-dados/relatorios/imagens/evidencia-bd-02(2).png

---

## Teste 3 – Confirmar que `polar_app` não consegue apagar tabelas

**Comando:**

```sql
SET ROLE polar_app;

DROP TABLE alunos;
```

### Evidência

> docs/banco-de-dados/relatorios/imagens/evidencia-bd-02(3).png

---

## Teste 4 – Confirmar que `polar_app` não consegue apagar registros

**Comando:**

```sql
SET ROLE polar_app;

DELETE FROM alunos
WHERE id = 'teste';
```

### Evidência

> docs/banco-de-dados/relatorios/imagens/evidencia-bd-02(4).png

---

# Conclusão

Os testes demonstraram que as permissões atribuídas às roles foram aplicadas corretamente.

- A role **`polar_app`** consegue executar operações permitidas (`SELECT`, `INSERT` e `UPDATE`) conforme definido.
- A role **`polar_leitura`** possui acesso apenas para leitura (`SELECT`).
- Operações destrutivas, como `DROP TABLE` e `DELETE`, são bloqueadas para `polar_app`, garantindo o princípio do menor privilégio e aumentando a segurança do banco de dados.
````
