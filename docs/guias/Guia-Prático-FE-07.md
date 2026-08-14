# Guia Passo a Passo — Issue FE-07
### Adaptar a tabela de ocorrências para telas pequenas (menores que 720px)

**Projeto:** P.O.L.A.R.
**Responsável:** Kevin
**Validador:** José
**Prazo:** 5 dias
**Esforço:** M
**Arquivos envolvidos:**
- `apps/web/src/components/ui/Table.tsx`
- `ui.css`
- Referência: `docs/frontend/guia-visual.md` (seções 6 e 7) — **leia essas seções antes de começar a mexer no código**

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o Kevin/José no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Hoje, se alguém abre a lista de ocorrências no celular (tela pequena), a tabela fica cortada e precisa arrastar pros lados para ler. Sua tarefa é fazer com que, em telas menores que 720px de largura, a tabela vire uma lista de **cards empilhados** (um bloco por ocorrência, um embaixo do outro), mantendo a tabela normal em telas grandes (computador).

### Bloco pronto de implementação

No arquivo `apps/web/src/styles/ui.css` ou no arquivo CSS da tela, adicione a regra abaixo na parte final:

```css
@media (max-width: 720px) {
  .table thead {
    display: none;
  }

  .table tbody,
  .table tr,
  .table td {
    display: block;
    width: 100%;
  }

  .table tr {
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 0.75rem;
    background: #fff;
  }

  .table td::before {
    content: attr(data-label);
    display: block;
    font-weight: 700;
    margin-bottom: 0.25rem;
    color: #374151;
  }
}
```

No `Table.tsx`, garanta que cada célula tenha o atributo `data-label` com a coluna correspondente:

```tsx
<td data-label="Aluno">{row.aluno}</td>
<td data-label="Status">{row.status}</td>
```

> Isso evita rolagem horizontal e mantém a tabela legível em telas de 375px.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Ler o guia visual do projeto ANTES de mexer em qualquer coisa

Esta tarefa é diferente das outras: ela **depende de um documento próprio do projeto** que define como a responsividade deve ser feita (cores, medidas, breakpoints). Pular essa leitura é o erro mais comum aqui.

1. No **Explorer** (ícone de pastas, lado esquerdo), naveguem até a pasta `docs/frontend/`.
2. Abram o arquivo `guia-visual.md`.
3. Leiam com atenção as **seções 6 e 7** (procure os títulos numerados "6." e "7." dentro do arquivo — use `Ctrl+F` se o arquivo for longo).
4. Anotem (num bloco de notas, papel, ou até em um comentário temporário no próprio código) quais são: a largura exata do "breakpoint" mencionado (a tarefa cita 720px, mas confirme se o guia usa esse valor ou outro), e o padrão de nomes de classes CSS usado no projeto para telas pequenas.

> **Importante:** não tenho acesso ao conteúdo desse guia visual, então não posso te dizer aqui quais são as classes CSS exatas ou os valores de espaçamento que o projeto usa. **A leitura da Parte 2 não é opcional** — é a fonte oficial dessas regras, e seguir um padrão inventado por conta própria vai gerar inconsistência visual com o resto do sistema.

---

## Parte 3 — Entender a tabela atual

1. Abram `apps/web/src/components/ui/Table.tsx`.
2. Leiam a estrutura geral: é um componente que provavelmente recebe uma lista de dados e "colunas" como informação, e desenha uma tabela HTML (`<table>`, `<tr>`, `<td>`).
3. Usem `Ctrl+Shift+F` (busca em todos os arquivos) e procurem por `Table` para ver **onde** esse componente é usado na tela de ocorrências (deve aparecer em algum arquivo dentro de `features/ocorrencias/`).

> Antes de decidir como implementar, é importante confirmar: o componente `Table.tsx` é **genérico** (usado em várias telas do sistema, não só ocorrências)? Se buscar por `<Table` e aparecer em mais de uma tela, **cuidado**: uma mudança aqui pode afetar outras partes do sistema, não só a lista de ocorrências. Se for esse o caso, avise o grupo antes de prosseguir — pode ser necessário criar uma versão específica em vez de alterar o componente genérico.

---

## Parte 4 — Estratégia de implementação

Existem duas formas comuns de resolver isso em CSS/React. Descrevo as duas para vocês (com o Kevin/José) decidirem qual seguir, já que não tenho acesso ao padrão exato do projeto definido no guia visual:

### Opção A — CSS puro (media query), sem mudar a estrutura em React
- No arquivo `ui.css`, usa-se uma regra do tipo `@media (max-width: 720px) { ... }` que troca a aparência visual da tabela via CSS (esconde a exibição em linhas/colunas tradicional e empilha os elementos como blocos).
- **Vantagem:** menos risco de quebrar a lógica em React.
- **Desvantagem:** truques de CSS para "disfarçar" uma tabela como cards às vezes ficam com HTML pouco acessível (leitores de tela podem ficar confusos).

### Opção B — Renderização condicional em React
- Dentro de `Table.tsx`, detecta-se a largura da tela (existe um hook ou lógica parecida em algum lugar do projeto — busquem por `innerWidth`, `matchMedia` ou `useMediaQuery` com `Ctrl+Shift+F` antes de escrever um novo) e, se for menor que 720px, o componente desenha uma lista de `<div>` (cards) em vez da `<table>`.
- **Vantagem:** mais controle sobre o que aparece em cada formato.
- **Desvantagem:** mais código novo, mais chance de erro para quem está começando agora.

> **Recomendação para quem tem menos prática:** comece pela **Opção A** (CSS), que costuma dar certo com menos código. Se o guia visual (Parte 2) já indicar um jeito específico de fazer isso, siga o que estiver lá em vez desta recomendação genérica.

---

## Parte 5 — Implementando a Opção A (CSS)

1. Abram `ui.css`.
2. Ao final do arquivo (ou perto de outras regras de tabela, se existirem), adicionem uma regra de media query. O formato geral é:

```css
@media (max-width: 720px) {
  /* regras que só valem quando a tela é menor que 720px */
}
```

3. Dentro dessa regra, vocês vão precisar:
   - Esconder o cabeçalho da tabela (a linha com os nomes das colunas) — geralmente com `display: none` na classe do `<thead>`.
   - Fazer cada linha (`<tr>`) da tabela se comportar como um bloco (`display: block`), com uma borda ou sombra separando uma da outra, para parecer um "card".
   - Fazer cada célula (`<td>`) virar uma linha própria dentro do card (`display: block`), e usar o atributo `data-label` (se o `Table.tsx` já tiver algo assim) ou criar um jeito de mostrar o nome da coluna ao lado do valor, já que o cabeçalho foi escondido.

> As classes CSS exatas (nomes) dependem de como `Table.tsx` já está escrito — vejam os nomes de `className` usados dentro do componente (Parte 3) e usem os mesmos nomes nas regras novas do CSS, não invente nomes novos sem necessidade.

4. Se, ao seguir esse caminho, perceberem que a tabela não tem como mostrar o nome da coluna junto ao valor (porque o HTML não guarda essa informação em lugar nenhum), pode ser necessário um ajuste pequeno em `Table.tsx` para adicionar o atributo `data-label` em cada célula. Se travarem nesse ponto, chamem o grupo mostrando exatamente o que já tentaram.

5. Salvem os arquivos: `Ctrl+S`.

---

## Parte 6 — Testar em telas pequenas de verdade

Esta issue tem um jeito específico de testar, direto no navegador, sem precisar de celular:

1. Se o projeto tiver um jeito de rodar localmente (perguntem ao José/Max o comando, provavelmente algo como `pnpm --filter web dev`), rodem esse comando no terminal do Codespace.
2. Vai aparecer um endereço tipo `localhost:xxxx` — o Codespace normalmente mostra um aviso ou um ícone para "abrir no navegador".
3. Com a tela do sistema aberta, aperte `F12` para abrir as **Ferramentas do Desenvolvedor** do navegador.
4. No canto superior esquerdo dessas ferramentas, clique no ícone parecido com um celular/tablet (**"Toggle device toolbar"**).
5. No topo, vai aparecer um campo de largura em pixels. Digite **375** (simula um celular comum).
6. Abram a tela de lista de ocorrências e confiram:
   - [ ] Não tem rolagem horizontal (não precisa arrastar pros lados)
   - [ ] Cada ocorrência aparece como um bloco/card, não como linha cortada de tabela
   - [ ] As informações principais da ocorrência continuam visíveis e legíveis
7. Agora mudem a largura para **1024** ou mais (simulando desktop) e confirmem que a tabela **volta ao normal**, sem nenhuma diferença visual em relação a como era antes da mudança.

---

## Parte 7 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Aperte Enter e aguarde.

> Se der erro em vermelho, revise com calma o CSS adicionado — erros de sintaxe CSS (chave `{ }` faltando, ponto e vírgula esquecido) são a causa mais comum. Se não resolver em 15 minutos, print do erro para o grupo.

---

## Parte 8 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Passem o mouse sobre o nome do projeto e clique no **"+"** para marcar os arquivos alterados.
3. Mensagem de commit:

```
feat(FE-07): tabela de ocorrencias responsiva abaixo de 720px
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-07-tabela-responsiva`

---

## Parte 9 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-07: tabela de ocorrencias responsiva abaixo de 720px`
4. Descrição: mencionem qual opção (A ou B) foi usada e se seguiram alguma regra específica do `guia-visual.md`.
5. Em **"Reviewers"**, selecionem **José**.
6. Cliquem em **"Create pull request"**.

---

**Lembrete:** o critério de aceite exige testar numa tela de **375px** especificamente — não pulem a Parte 6, é a forma de garantir que a issue realmente foi resolvida como pedido.
