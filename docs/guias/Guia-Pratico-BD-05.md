# Guia Passo a Passo — Issue BD-05
### Adicionar o tipo de ensino às turmas

**Projeto:** P.O.L.A.R.  
**Responsáveis:** Yuri e Pietro  
**Validador:** Pedro Lima  
**Prazo:** A definir  
**Esforço:** P (Pequeno)

**Arquivos envolvidos:**
- `database/schema.sql`
- `database/seed.ts`
- `docs/banco-de-dados/modelo-relacional.md`

> **Antes de começar:** este guia foi feito para quem está começando em Banco de Dados. A ideia é fazer uma alteração pequena e controlada na tabela `turmas`: cada turma deverá informar se pertence ao ensino **REGULAR** ou **TÉCNICO**.

---

## O que vocês vão fazer, em uma frase

Adicionar à tabela `turmas` um campo chamado `tipo_ensino`, permitindo identificar se uma turma é de ensino regular ou ensino técnico.

Hoje a tabela `turmas` já possui informações como `nome`, `ano_letivo`, `turno` e `ativa`. O novo campo será responsável especificamente pelo tipo de ensino.

---

## Como deve ficar a ideia

Exemplo:

| Turma | Ano | Turno | Tipo de ensino |
|---|---:|---|---|
| 1ºA - Informática | 2026 | Manhã | TÉCNICO |
| 2ºB - Desenvolvimento de Sistemas | 2026 | Tarde | TÉCNICO |
| 1ºA - Ensino Médio | 2026 | Manhã | REGULAR |

O banco deve aceitar somente os tipos definidos para a regra da tarefa.

---

## Parte 1 — Abrir o projeto

1. Acessem o repositório do projeto no GitHub.
2. Abram o projeto `equipe-polar/polar`.
3. Criem uma branch para a tarefa, seguindo o padrão do projeto:

```text
feature/bd-05-tipo-ensino-turma
```

4. Abram o projeto no Codespaces ou no ambiente local utilizado pelo grupo.

O projeto utiliza PostgreSQL como banco principal, e o arquivo `database/schema.sql` é a fonte da estrutura do banco. 

---

## Parte 2 — Entender a tabela `turmas`

Abram:

```text
database/schema.sql
```

Procurem a criação da tabela `turmas`.

Atualmente ela possui, entre outros, estes campos:

```sql
CREATE TABLE IF NOT EXISTS turmas (
    id CHAR(36) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    ano_letivo INTEGER NOT NULL,
    turno VARCHAR(40) NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    ...
);
```

A tarefa é acrescentar o novo campo sem remover ou alterar os campos que já existem.

---

## Parte 3 — Criar o identificador do tipo de ensino

A sugestão para manter os valores controlados é utilizar um `ENUM` do PostgreSQL.

Antes da tabela `turmas`, adicionem um tipo semelhante a:

```sql
DO $$ BEGIN
CREATE TYPE tipo_ensino_turma AS ENUM ('REGULAR', 'TECNICO');

EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

Depois, dentro da tabela `turmas`, adicionem:

```sql
tipo_ensino tipo_ensino_turma NOT NULL DEFAULT 'REGULAR',
```

A ideia fica assim:

```sql
CREATE TABLE IF NOT EXISTS turmas (
    id CHAR(36) NOT NULL,
    nome VARCHAR(120) NOT NULL,
    ano_letivo INTEGER NOT NULL,
    turno VARCHAR(40) NOT NULL,
    tipo_ensino tipo_ensino_turma NOT NULL DEFAULT 'REGULAR',
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMPTZ(3) NOT NULL,
    atualizado_em TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT pk_turmas PRIMARY KEY (id),
    CONSTRAINT uq_turmas_nome UNIQUE (nome)
);
```

> **Importante:** não criem um novo `id` para cada tipo de ensino. O `id` continua identificando a turma. O novo campo `tipo_ensino` apenas informa a categoria de ensino daquela turma.

---

## Parte 4 — Atualizar o seed

Abram:

```text
database/seed.ts
```

O seed atualmente cria três turmas de demonstração, incluindo:

```text
1ºA - Informática
2ºB - Desenvolvimento de Sistemas
3ºB - Desenvolvimento de Sistemas
```

Como o novo campo faz parte de `turmas`, os dados de demonstração também precisam representar o tipo de ensino.

A função que cria uma turma atualmente recebe:

```text
nome, turno, criadoDias
```

Ela deverá passar a receber também o tipo de ensino.

Uma ideia simples é:

```ts
function turma(
  nome: string,
  turno: string,
  tipoEnsino: "REGULAR" | "TECNICO",
  criadoDias: number
): Turma {
```

E o objeto retornado deverá possuir o novo campo:

```ts
tipoEnsino,
```

Depois, ao criar as turmas de exemplo, informem o tipo correspondente.

Por exemplo:

```ts
const turma1A = turma("1ºA - Informática", "Manhã", "TECNICO", 42);
const turma2B = turma("2ºB - Desenvolvimento de Sistemas", "Tarde", "TECNICO", 42);
const turma3B = turma("3ºB - Desenvolvimento de Sistemas", "Manhã", "TECNICO", 42);
```

> Se o código atual do projeto usar outro formato para representar `Turma`, sigam o padrão existente em vez de inventar uma estrutura paralela.

---

## Parte 5 — Conferir o modelo relacional

Abram:

```text
docs/banco-de-dados/modelo-relacional.md
```

Na parte da tabela `turmas`, adicionem o novo atributo:

```text
tipo_ensino
```

A descrição deve deixar claro que ele identifica se a turma pertence ao ensino regular ou técnico.

Por exemplo:

```text
turmas
- id
- nome
- ano_letivo
- turno
- tipo_ensino
- ativa
```

Também atualizem o dicionário de dados para mencionar que `tipo_ensino` aceita `REGULAR` ou `TECNICO`.

---

## Parte 6 — Conferir a alteração

Antes de considerar a tarefa concluída, verifiquem:

- O `schema.sql` cria o tipo `tipo_ensino_turma`.
- A tabela `turmas` possui a coluna `tipo_ensino`.
- A coluna não permite `NULL`.
- Existe um valor padrão (`REGULAR`).
- Os valores permitidos são somente `REGULAR` e `TECNICO`.
- O seed consegue criar as turmas com o novo campo.
- A documentação do modelo relacional foi atualizada.

---

## Parte 7 — Testar

Se o banco local estiver sendo usado, a documentação do projeto indica PostgreSQL e o comando para aplicar o schema:

```bash
psql postgresql://polar:polar@localhost:5432/polar -f database/schema.sql
```

Depois, executem o seed:

```bash
pnpm seed
```

Se o projeto já estiver configurado para PostgreSQL, confirmem no banco que a tabela `turmas` possui a coluna:

```text
tipo_ensino
```

E testem uma consulta:

```sql
SELECT nome, ano_letivo, turno, tipo_ensino
FROM turmas;
```

O resultado deve mostrar o tipo de ensino de cada turma.

---

## Parte 8 — Commit

Quando estiver funcionando, façam um commit pequeno e específico:

```text
feat(BD-05): adiciona tipo de ensino às turmas
```

Depois enviem a branch e abram o Pull Request para revisão do **Pedro Lima**.

---

## Critério de aceite

A BD-05 está concluída quando:

1. A tabela `turmas` possui o campo `tipo_ensino`.
2. O banco restringe o campo aos valores `REGULAR` e `TECNICO`.
3. As turmas do seed possuem um tipo de ensino definido.
4. A consulta de turmas consegue retornar o tipo de ensino.
5. A documentação `modelo-relacional.md` está atualizada.
6. O schema e o seed executam sem erro.

---

## Exemplo ou referência

A principal referência é o próprio modelo atual do projeto:

- `database/schema.sql` — fonte da estrutura do banco.
- `database/seed.ts` — dados de demonstração.
- `docs/banco-de-dados/modelo-relacional.md` — documentação do modelo relacional.

O repositório já utiliza PostgreSQL e possui a tabela `turmas`; portanto, a tarefa deve ser feita como uma extensão desse modelo, sem criar uma tabela paralela apenas para guardar o tipo de ensino.

> **Se surgir dúvida:** não alterem outras tabelas ou módulos por conta própria. Chamem o Pedro Lima para validar a decisão antes de aumentar o escopo da BD-05.
