# Guia Passo a Passo — Issue FE-01
### Estado vazio nas páginas de Alunos e Turmas

**Projeto:** P.O.L.A.R.
**Responsável:** Cristhiano
**Validador:** Max
**Prazo:** 5 dias
**Esforço:** P
**Arquivos a alterar:**
- `apps/web/src/features/alunos/AlunosPage.tsx`
- `apps/web/src/features/turmas/TurmasPage.tsx`
**Referência de padrão já existente:** `OcorrenciasListPage.tsx`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o Cristhiano/Max no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Quando a lista de alunos (ou turmas) está vazia — seja porque ainda não tem nenhum registro, seja porque uma busca não encontrou nada — a tela hoje provavelmente fica só em branco ou mostra uma tabela sem linhas. Sua tarefa é mostrar, nesses casos, uma mensagem com ícone explicando a situação, igual ao que já existe em `OcorrenciasListPage.tsx`.

### Bloco pronto de implementação

Insira isso no ponto exato da renderização da tabela, no arquivo `apps/web/src/features/alunos/AlunosPage.tsx` e no `TurmasPage.tsx`:

```tsx
{alunos.length === 0 ? (
  <EmptyState
    title="Nenhum aluno cadastrado ainda"
    description="Cadastre o primeiro aluno para começar a gestão."
  />
) : (
  <Table rows={alunos} columns={colunasAlunos} />
)}
```

```tsx
{turmas.length === 0 ? (
  <EmptyState
    title="Nenhuma turma cadastrada ainda"
    description="Crie a primeira turma para iniciar o ano letivo."
  />
) : (
  <Table rows={turmas} columns={colunasTurmas} />
)}
```

Se o projeto não tiver um `EmptyState`, use este padrão mínimo direto no JSX:

```tsx
{alunos.length === 0 && (
  <div className="empty-state">
    <span aria-hidden="true">📭</span>
    <p>Nenhum aluno encontrado para esta busca.</p>
  </div>
)}
```

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta pessoal (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Estudar o padrão que já existe

A issue já aponta a referência exata: o estado vazio de `OcorrenciasListPage.tsx` deve ser **copiado e adaptado**, não reinventado.

1. Do lado esquerdo, clique no ícone de lupa (**Search**) ou `Ctrl+Shift+F`.
2. Digite: `OcorrenciasListPage`
3. Abram o arquivo encontrado.
4. Dentro dele, usem `Ctrl+F` e busquem por termos como `vazio`, `Empty`, `nenhum` ou `sem resultados` — um desses deve levar ao trecho que mostra a mensagem com ícone quando a lista está vazia.
5. Anotem (ou deixem a aba aberta) exatamente:
   - O nome do componente usado (ex: pode ser um componente próprio tipo `<EmptyState />`, ou pode ser JSX simples escrito direto ali).
   - Em que condição ele aparece (normalmente algo como: "se a lista tiver 0 itens, mostra a mensagem; senão, mostra a tabela").

> **Importante:** não tenho acesso ao conteúdo atual de `OcorrenciasListPage.tsx`, então não posso te dizer o nome exato do componente ou o texto usado. **Este passo de leitura não é opcional** — é a fonte do padrão que vocês precisam repetir nas outras duas telas.

---

## Parte 3 — Aplicar em AlunosPage.tsx

1. Abram `apps/web/src/features/alunos/AlunosPage.tsx`.
2. Localizem o trecho onde a lista de alunos é desenhada na tela (geralmente algo como `alunos.map(...)` dentro de uma tabela).
3. Ao redor desse trecho, deve existir (ou vocês vão precisar criar) uma condição do tipo: **"se a lista de alunos tiver 0 itens, mostra o estado vazio; senão, mostra a lista normalmente"**.
4. Copiem a estrutura do componente de estado vazio identificado na Parte 2 e colem aqui, ajustando apenas o texto da mensagem para fazer sentido no contexto de alunos. Pensem em dois casos diferentes de texto:
   - **Lista realmente sem nenhum aluno cadastrado** (ex: "Nenhum aluno cadastrado ainda")
   - **Busca sem resultado** (ex: "Nenhum aluno encontrado para esta busca")

> Se `OcorrenciasListPage.tsx` já tiver essa distinção entre os dois casos, sigam o mesmo padrão. Se ela só tiver uma mensagem genérica, é aceitável repetir esse mesmo padrão simples aqui — não é necessário inventar uma funcionalidade que não existe na referência.

5. Salvem: `Ctrl+S`.

---

## Parte 4 — Aplicar em TurmasPage.tsx

Repitam exatamente o mesmo raciocínio da Parte 3, agora no arquivo `apps/web/src/features/turmas/TurmasPage.tsx`:

1. Abram o arquivo.
2. Localizem onde a lista de turmas é desenhada.
3. Apliquem a mesma condição e o mesmo componente de estado vazio, com textos adaptados para turmas (ex: "Nenhuma turma cadastrada ainda" / "Nenhuma turma encontrada para esta busca").
4. Salvem: `Ctrl+S`.

---

## Parte 5 — Testar visualmente

O critério de aceite pede dois cenários por página — lista sem registros e busca sem resultado. Testem os dois:

1. Se o projeto tiver um jeito de rodar localmente (perguntem ao Cristhiano/Max o comando, provavelmente `pnpm --filter web dev`), rodem esse comando no terminal do Codespace e abram a tela pelo navegador.
2. Na tela de Alunos, façam uma busca por algo que certamente não existe (ex: "zzzzz123") e confirmem que aparece a mensagem de estado vazio, não uma tabela em branco.
3. Repitam na tela de Turmas.
4. Se possível, testem também o caso de **lista realmente vazia** (perguntem ao grupo se existe um ambiente de teste sem nenhum dado cadastrado, ou se dá para simular isso de outra forma sem apagar dados reais).

---

## Parte 6 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Aperte Enter e aguardem.

> Se aparecer erro em vermelho, revisem com calma se o componente de estado vazio foi importado corretamente no topo dos dois arquivos alterados (import faltando é a causa mais comum desse tipo de erro). Se não resolverem em 15 minutos, print do erro para o grupo.

---

## Parte 7 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Passem o mouse sobre o nome do projeto e clique no **"+"** para marcar `AlunosPage.tsx` e `TurmasPage.tsx`.
3. Mensagem de commit:

```
feat(FE-01): adiciona estado vazio nas listas de alunos e turmas
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-01-estado-vazio`

---

## Parte 8 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-01: adiciona estado vazio nas listas de alunos e turmas`
4. Descrição: mencionem que o padrão foi copiado de `OcorrenciasListPage.tsx`.
5. Em **"Reviewers"**, selecionem **Max** (é ele o validador desta issue, diferente das outras que usaram José).
6. Cliquem em **"Create pull request"**.
