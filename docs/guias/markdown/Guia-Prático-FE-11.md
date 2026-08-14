# Guia Passo a Passo — Issue FE-11
### Lista de tipos de ocorrência padronizados no formulário

**Projeto:** P.O.L.A.R.
**Responsável:** Emylly
**Validador:** José
**Prazo:** A definir
**Esforço:** M
**Arquivos envolvidos:**
- `database/schema.sql`
- `apps/api/src/modules/ocorrencias/`
- `apps/web/src/features/ocorrencias/`
- `apps/web/src/services/domain.ts`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o José no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Hoje, ao registrar uma ocorrência, a pessoa provavelmente só digita um texto livre descrevendo o que aconteceu. A tarefa é adicionar uma **lista de tipos comuns** (ex: "Atraso", "Indisciplina em sala", "Conflito entre alunos" — os tipos reais devem ser definidos com a coordenação, ver aviso abaixo) que a pessoa pode **selecionar**, mantendo a possibilidade de complementar com texto livre, e sem impedir o registro de um caso que não esteja na lista.

### Bloco pronto de implementação

No `domain.ts` centralize os valores permitidos:

```ts
export const TIPOS_OCORRENCIA = [
  'Atraso',
  'Indisciplina em sala',
  'Conflito entre alunos',
  'Outro',
] as const;
```

No formulário de ocorrência, insira o campo select e mantenha a descrição livre:

```tsx
<select name="tipoOcorrencia" value={form.tipoOcorrencia} onChange={handleChange}>
  {TIPOS_OCORRENCIA.map((tipo) => (
    <option key={tipo} value={tipo}>{tipo}</option>
  ))}
</select>
```

No banco e no backend, o valor deve ser persistido:

```sql
ALTER TABLE ocorrencias
  ADD COLUMN tipo_ocorrencia VARCHAR(80);
```

```ts
await db.query(
  `INSERT INTO ocorrencias (descricao, tipo_ocorrencia) VALUES ($1, $2)`,
  [payload.descricao, payload.tipoOcorrencia]
);
```

> Se a opção for `Outro`, a descrição deve continuar obrigatória para complementar a informação.

---

## ⚠️ Aviso: a lista de tipos precisa ser definida antes de codar

A issue não diz **quais** são os tipos de ocorrência — isso é uma decisão de conteúdo, não técnica, e cabe à coordenação da escola aprovar. **Não inventem a lista sozinhos.**

**Ação recomendada:** antes da Parte 3 deste guia, peçam ao José (ou a quem estiver responsável por esse contato) a lista oficial de tipos aprovados pela coordenação. Enquanto isso não chegar, é possível adiantar as Partes 1 e 2 (preparar ambiente e entender a estrutura atual).

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Entender como o formulário funciona hoje

1. No **Explorer**, use `Ctrl+Shift+F` e busque por `descricao` — deve levar ao formulário de registro de ocorrência dentro de `apps/web/src/features/ocorrencias/`.
2. Abram o arquivo encontrado e identifiquem o campo de texto livre onde a descrição é digitada hoje.
3. Abram `apps/web/src/services/domain.ts` — esse arquivo, pelo nome, provavelmente já guarda listas de opções fixas usadas em outros formulários do sistema (ex: lista de prioridades, lista de status). Usem `Ctrl+F` e busquem por algo como `const` seguido de um nome no plural, para achar exemplos desse padrão.
4. Se encontrarem um exemplo de lista fixa parecida (ex: uma lista de status ou prioridades), **esse é o padrão a seguir** para criar a lista de tipos de ocorrência.

> **Importante:** não tenho acesso ao conteúdo atual de `domain.ts`, então não posso indicar o nome exato de uma lista existente para vocês copiarem. Este passo de leitura não é opcional.

---

## Parte 3 — Adicionar a lista de tipos em `domain.ts`

**Só façam este passo depois de ter a lista oficial aprovada pela coordenação (ver aviso no início).**

1. Abram `apps/web/src/services/domain.ts`.
2. Seguindo o mesmo padrão de outra lista fixa já existente (identificado na Parte 2), criem uma nova lista com os tipos de ocorrência aprovados. Um formato comum seria parecido com:

```ts
export const TIPOS_OCORRENCIA = [
  "Atraso",
  "Indisciplina em sala",
  "Conflito entre alunos",
  "Outro",
] as const;
```

> **O conteúdo acima é só um exemplo de formato — substituam pelos tipos reais aprovados pela coordenação.** Incluir uma opção tipo "Outro" é importante: é ela que vai permitir à pessoa registrar um caso fora da lista, complementando com o texto livre.

3. Salvem: `Ctrl+S`.

---

## Parte 4 — Adicionar o campo de seleção no formulário

1. No arquivo do formulário de ocorrência (identificado na Parte 2), adicionem um campo do tipo "select" (lista suspensa) ou botões de opção, usando a lista `TIPOS_OCORRENCIA` criada na Parte 3.
2. Importem essa lista no topo do arquivo:

```ts
import { TIPOS_OCORRENCIA } from "../../services/domain";
```

> Ajustem o caminho do import (`../../services/domain`) de acordo com onde o arquivo do formulário está em relação a `domain.ts` — comparem com outro import já existente no mesmo arquivo que aponte para `services/`.

3. O campo de texto livre (descrição) deve **continuar existindo**, para a pessoa complementar a informação — não é para substituir um pelo outro.
4. Se o tipo selecionado for "Outro" (ou o que a coordenação definir como opção de escape), considerem exigir que o texto livre não fique vazio nesse caso — mas **confirmem essa regra com o grupo antes de implementar**, já que não está explícita no critério de aceite.

---

## Parte 5 — Persistir o tipo escolhido (banco de dados e backend)

O critério de aceite exige que a opção escolhida seja **salva** e **exibida depois** no detalhe da ocorrência. Isso envolve três camadas:

### 5.1 — Banco de dados
1. Abram `database/schema.sql`.
2. Usem `Ctrl+F` e busquem pela tabela de ocorrências (provavelmente `ocorrencias` ou parecido).
3. Verifiquem se já existe uma coluna para guardar o tipo. Se não existir, será necessário adicionar uma nova coluna (ex: `tipo` ou `tipo_ocorrencia`, do tipo texto).

> **Alterar o banco de dados é uma parte sensível.** Se não tiverem confiança para isso, **chamem alguém do time de Banco de dados (ver lista-membros) para revisar ou fazer esta parte específica junto com vocês**, antes de aplicar a mudança.

### 5.2 — Backend
1. Abram a pasta `apps/api/src/modules/ocorrencias/`.
2. Localizem onde uma nova ocorrência é criada/salva (busquem por `create` ou `criar` com `Ctrl+Shift+F`).
3. Garantam que o campo do tipo (vindo do formulário) é recebido e salvo junto com os outros dados da ocorrência.

### 5.3 — Exibição no detalhe
1. Localizem a tela de detalhe da ocorrência (já usada em outras issues, ex: `DetalheOcorrenciaPage.tsx`).
2. Adicionem a exibição do tipo escolhido junto com as demais informações já mostradas ali.

---

## Parte 6 — Testar

1. Se o projeto tiver como rodar localmente, testem registrar uma ocorrência escolhendo um tipo da lista, e confirmem que ele aparece corretamente no detalhe depois.
2. Testem também registrar uma ocorrência usando a opção "Outro" (ou equivalente) com texto livre complementar, e confirmem que isso é aceito normalmente, sem burlar nenhuma validação já existente no formulário.

---

## Parte 7 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Se mexeram no backend, rodem também o build correspondente (perguntem ao grupo o comando exato, provavelmente `pnpm --filter api build`).

> Se der erro, revisem com calma os imports e os nomes de campos usados entre frontend e backend — precisam ser exatamente iguais dos dois lados. Se não resolverem em 20 minutos, print do erro para o grupo.

---

## Parte 8 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados (frontend, backend e o `schema.sql`, se alterado).
3. Mensagem de commit:

```
feat(FE-11): adiciona lista de tipos de ocorrencia no formulario
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-11-tipos-ocorrencia`

---

## Parte 9 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-11: adiciona lista de tipos de ocorrencia no formulario`
4. Descrição: listem a lista de tipos usada (e confirmem que veio da coordenação), e quais camadas (banco, backend, frontend) foram alteradas.
5. Em **"Reviewers"**, selecionem **José**.
6. Cliquem em **"Create pull request"**.
