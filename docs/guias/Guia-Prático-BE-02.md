# Guia Passo a Passo — Issue BE-02
### Classificação por bimestre nas ocorrências

**Projeto:** P.O.L.A.R.
**Responsável:** Pedro B. & Pedro L.
**Validador:** Max
**Prazo:** A definir
**Esforço:** M
**Arquivos envolvidos:**
- `database/schema.sql`
- `apps/api/src/modules/ocorrencias/`
- `apps/api/src/modules/relatorios/`
- `apps/web/src/features/ocorrencias/`
- `apps/web/src/features/relatorios/RelatoriosPage.tsx`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o Max no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Fazer com que toda ocorrência seja associada a um bimestre (1º, 2º, 3º ou 4º), e permitir filtrar as listagens e relatórios por bimestre — de forma que, ao filtrar por um bimestre, **apareçam só** as ocorrências daquele período.

### Bloco pronto de implementação

A alteração do banco vai na tabela `ocorrencias` em `database/schema.sql` e o mesmo campo deve ser usado no backend e no frontend.

```sql
-- database/schema.sql
ALTER TABLE ocorrencias
  ADD COLUMN bimestre INTEGER NOT NULL DEFAULT 1 CHECK (bimestre BETWEEN 1 AND 4);
```

```ts
// apps/api/src/modules/ocorrencias/ocorrencias.service.ts
export async function criarOcorrencia(payload: {
  descricao: string;
  turmaId: number;
  bimestre: number;
}) {
  const bimestre = Number(payload.bimestre);

  if (![1, 2, 3, 4].includes(bimestre)) {
    throw new Error('Bimestre inválido. Use 1, 2, 3 ou 4.');
  }

  return db.query(
    `INSERT INTO ocorrencias (descricao, turma_id, bimestre, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [payload.descricao, payload.turmaId, bimestre]
  );
}
```

```ts
// apps/api/src/modules/ocorrencias/ocorrencias.routes.ts
router.get('/ocorrencias', async (req, res) => {
  const { bimestre } = req.query;

  const rows = await db.query(
    `SELECT * FROM ocorrencias
     WHERE ($1::int IS NULL OR bimestre = $1::int)`,
    [bimestre ? Number(bimestre) : null]
  );

  return res.json(rows.rows);
});
```

```ts
// apps/web/src/features/ocorrencias/RegistroOcorrenciaForm.tsx
<select name="bimestre" value={form.bimestre} onChange={handleChange}>
  <option value="">Selecione o bimestre</option>
  <option value="1">1º Bimestre</option>
  <option value="2">2º Bimestre</option>
  <option value="3">3º Bimestre</option>
  <option value="4">4º Bimestre</option>
</select>
```

> O campo `bimestre` precisa bater exatamente em banco, backend e frontend. Se o nome tiver qualquer diferença, o filtro deixa de funcionar.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Decidir: bimestre é salvo, ou calculado a partir da data?

Existem duas formas de resolver esta issue, e é importante decidir **antes** de mexer no código:

- **Opção A — Salvar o bimestre como um campo próprio** no momento em que a ocorrência é criada (ex: uma coluna `bimestre` na tabela).
- **Opção B — Calcular o bimestre automaticamente** a partir da data de criação da ocorrência, sem guardar um campo extra (ex: uma função que, dado um mês, devolve se é 1º, 2º, 3º ou 4º bimestre).

> Isto **não está definido pela issue**, e depende de uma decisão de negócio: os bimestres da escola têm datas de início/fim fixas todo ano, ou podem mudar (ex: por causa de feriados, calendário letivo)? **Se puderem mudar de ano para ano, a Opção A é mais segura** (o bimestre fica registrado como estava no momento, mesmo que as datas do calendário mudem depois). Se forem sempre fixas, a Opção B evita duplicar dado.
>
> **Confirmem essa decisão com o Max antes de seguir** — ela muda todo o resto do guia.

Este guia segue pela **Opção A** (campo salvo), por ser a mais segura e mais simples de implementar para quem está começando agora. Se o grupo decidir pela Opção B, avisem para eu adaptar o guia.

---

## Parte 3 — Banco de dados: adicionar a coluna de bimestre

1. No **Explorer**, abram `database/schema.sql`.
2. Usem `Ctrl+F` e busquem pela tabela de ocorrências (provavelmente `ocorrencias`).
3. Adicionem uma nova coluna, seguindo o padrão de outras colunas já existentes na mesma tabela (mesmo estilo de nomenclatura). Um exemplo de formato (ajustem o tipo de dado conforme o padrão do restante do arquivo):

```sql
bimestre INTEGER NOT NULL CHECK (bimestre IN (1, 2, 3, 4)),
```

> A cláusula `CHECK (bimestre IN (1, 2, 3, 4))` é importante: ela garante, direto no banco, que ninguém consiga salvar um valor inválido (ex: bimestre 5). Se o restante do arquivo não usar esse estilo de `CHECK`, adaptem para o padrão do projeto, mas mantenham a ideia de restringir os valores possíveis.

4. **Se já existirem ocorrências salvas no banco antes desta mudança**, uma coluna `NOT NULL` sem valor padrão vai dar erro ao ser aplicada. Conversem com alguém do time de Banco de Dados sobre como preencher retroativamente essas ocorrências antigas (ex: calculando o bimestre a partir da data de criação de cada uma) — **não decidam isso sozinhos sem confirmar o impacto**.

---

## Parte 4 — Backend: receber e salvar o bimestre

1. No **Explorer**, naveguem até `apps/api/src/modules/ocorrencias/`.
2. Localizem onde uma nova ocorrência é criada (busquem por `create` ou `criar` com `Ctrl+Shift+F`).
3. Garantam que o valor de bimestre é recebido junto com os outros dados da ocorrência e salvo na nova coluna criada na Parte 3.
4. Validem no backend também (não confiem só na validação do banco): o bimestre recebido precisa ser 1, 2, 3 ou 4 — se vier outro valor, a criação deve ser recusada com uma mensagem de erro clara.

---

## Parte 5 — Backend: permitir filtrar por bimestre

1. Localizem, em `apps/api/src/modules/ocorrencias/` e `apps/api/src/modules/relatorios/`, os endpoints que já listam ocorrências (busquem por `listar` ou `find` com `Ctrl+Shift+F`).
2. Verifiquem se esses endpoints já aceitam algum parâmetro de filtro (ex: por turma, por período) — se sim, sigam o mesmo padrão para adicionar um filtro por `bimestre`.
3. A lógica geral: se o parâmetro de bimestre for enviado na consulta, a busca no banco deve trazer **apenas** as ocorrências com aquele valor de bimestre — nada a mais.

---

## Parte 6 — Frontend: adicionar o campo no formulário de ocorrência

1. Em `apps/web/src/features/ocorrencias/`, localizem o formulário de registro de ocorrência.
2. Adicionem um campo de seleção (1º, 2º, 3º ou 4º bimestre) — pode ser preenchido automaticamente com base na data atual (se a Parte 2 permitir esse cálculo automático como sugestão inicial), mas deve continuar sendo **editável** pela pessoa, a não ser que o grupo decida o contrário.

---

## Parte 7 — Frontend: adicionar o filtro nas listagens e relatórios

1. Em `apps/web/src/features/ocorrencias/` e em `apps/web/src/features/relatorios/RelatoriosPage.tsx`, localizem onde outros filtros já existem hoje (ex: filtro por turma, por período) — sigam exatamente o mesmo padrão visual e de código para adicionar o novo filtro de bimestre.
2. Conectem esse filtro com o parâmetro criado no backend na Parte 5.

---

## Parte 8 — Testar

1. Se o projeto tiver como rodar localmente, registrem (ou usem dados de teste já existentes) ocorrências em bimestres diferentes.
2. Apliquem o filtro por um bimestre específico e confirmem que **só** aparecem ocorrências daquele bimestre — nenhuma de outro período deve aparecer junto.
3. Testem também tentar registrar uma ocorrência com um valor de bimestre inválido (se o formulário permitir manipular isso, ex: via ferramentas do desenvolvedor) e confirmem que o backend recusa.

---

## Parte 9 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. E também (perguntem ao grupo se o comando é este):

```
pnpm --filter api build
```

> Se der erro, revisem os nomes de campos entre frontend, backend e banco — precisam bater exatamente nos três lugares. Se não resolverem em 20 minutos, print do erro para o grupo.

---

## Parte 10 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados (banco, backend e frontend).
3. Mensagem de commit:

```
feat(BE-02): adiciona bimestre nas ocorrencias e filtro por bimestre
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `be-02-bimestre-ocorrencias`

---

## Parte 11 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `BE-02: adiciona bimestre nas ocorrencias e filtro por bimestre`
4. Descrição: confirmem qual opção (A ou B da Parte 2) foi usada e, se havia ocorrências antigas no banco, como foram tratadas.
5. Em **"Reviewers"**, selecionem **Max**.
6. Cliquem em **"Create pull request"**.
