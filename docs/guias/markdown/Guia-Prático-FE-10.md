# Guia Passo a Passo — Issue FE-10
### Gráficos nos relatórios (evolução de ocorrências)

**Projeto:** P.O.L.A.R.
**Responsável:** Ikaro
**Validador:** José
**Prazo:** A definir
**Esforço:** G (grande — a maior desta leva de guias até agora)
**Arquivos envolvidos:**
- `apps/api/src/modules/relatorios/`
- `apps/web/src/features/relatorios/RelatoriosPage.tsx`
- `apps/web/src/services/school.service.ts`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o José no grupo** antes de continuar.
>
> **Aviso de tamanho:** esta é uma issue **G (grande)**, com uma parte de backend e uma de frontend. Se for a primeira tarefa de alguém no projeto, recomendo fortemente começar por uma issue P ou M antes desta (ex: FE-01, FE-06). Se mesmo assim for esta a designada, planeje mais dias do que o normal e não hesite em pedir ajuda cedo.

---

## O que você vai fazer, em uma frase

Hoje os relatórios do sistema mostram só números/tabelas. A tarefa é adicionar **gráficos** mostrando a evolução das ocorrências por aluno, por turma e por período — mantendo, ao lado de cada gráfico, uma versão em texto ou tabela equivalente (para quem usa leitor de tela ou não consegue ver bem o gráfico).

### Bloco pronto de implementação

No `RelatoriosPage.tsx`, o gráfico deve receber os mesmos dados da tabela para garantir consistência.

```tsx
const dadosTurma = [
  { nome: '3A', total: 12 },
  { nome: '3B', total: 8 },
  { nome: '4C', total: 15 },
];

<ResponsiveContainer width="100%" height={250}>
  <BarChart data={dadosTurma}>
    <XAxis dataKey="nome" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="total" fill="#3b82f6" />
  </BarChart>
</ResponsiveContainer>
```

```tsx
const dadosPeriodo = [
  { periodo: 'Jan', total: 5 },
  { periodo: 'Fev', total: 7 },
  { periodo: 'Mar', total: 9 },
];

<ResponsiveContainer width="100%" height={250}>
  <LineChart data={dadosPeriodo}>
    <XAxis dataKey="periodo" />
    <YAxis />
    <Tooltip />
    <Line dataKey="total" stroke="#22c55e" strokeWidth={2} />
  </LineChart>
</ResponsiveContainer>
```

> A tabela textual continua ao lado do gráfico; o gráfico nunca substitui a informação legível em texto.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Entender o que já existe hoje na tela de relatórios

1. No **Explorer**, abram `apps/web/src/features/relatorios/RelatoriosPage.tsx`.
2. Leiam a estrutura: como os dados são buscados (procurem por chamadas a funções vindas de `school.service.ts`, geralmente algo como `buscarRelatorio(...)` ou parecido — busquem com `Ctrl+F` por `relatorio`), e como esses dados são mostrados hoje (tabela? números soltos?).
3. Abram também `apps/web/src/services/school.service.ts` e localizem, com `Ctrl+F`, a(s) função(ões) usadas por essa tela.
4. Anotem: quais campos os dados já trazem hoje (ex: quantidade de ocorrências por turma, por período, etc.)? Isso é importante porque vai definir se dá para montar os gráficos só com o que já existe, ou se vai precisar de dados novos vindos do backend.

> **Importante:** não tenho acesso ao conteúdo atual desses arquivos. Este passo de leitura **não é opcional** — sem saber o formato real dos dados, é impossível montar o gráfico direito.

---

## Parte 3 — Backend: garantir que os dados para o gráfico existem

Verifiquem, junto com o Max (validador do backend), se o endpoint de relatórios já devolve os dados agrupados da forma que os gráficos precisam:

- Quantidade de ocorrências **por turma** (para o gráfico de distribuição)
- Quantidade de ocorrências **por período** — ex: por mês ou por bimestre (para o gráfico de evolução)

1. No **Explorer**, abram a pasta `apps/api/src/modules/relatorios/`.
2. Leiam os arquivos ali para entender o que o endpoint já devolve hoje.
3. **Se os dados já vierem agrupados** dessa forma → podem pular para a Parte 4.
4. **Se não vierem** → é necessário alterar o backend para agrupar e devolver esses dados prontos. Isso é uma parte mais avançada; se não tiverem confiança para mexer no backend, **conversem com o grupo antes** para decidir se um colega de backend ajuda nessa parte específica, dividindo a issue em duas frentes.

---

## Parte 4 — Escolher e instalar a biblioteca de gráficos

Bibliotecas de gráfico comuns em projetos React incluem `recharts`, `chart.js` e `victory`. **Antes de escolher uma, confiram se o projeto já usa alguma** (evita duplicar dependências):

1. No **Explorer**, abram o arquivo `apps/web/package.json`.
2. Usem `Ctrl+F` e busquem por `chart`, `recharts` ou `victory`.
3. **Se já existir uma biblioteca de gráficos instalada** → usem ela, sigam para a Parte 5.
4. **Se não existir nenhuma** → conversem com o grupo antes de instalar uma nova dependência (adicionar bibliotecas ao projeto costuma ser uma decisão que vale alinhar, para não haver duas pessoas trazendo bibliotecas diferentes para o mesmo tipo de problema).

---

## Parte 5 — Montar o gráfico de distribuição por turma

1. Em `RelatoriosPage.tsx`, localizem onde os dados de "ocorrências por turma" já aparecem em formato de tabela (identificado na Parte 2).
2. Adicionem, ao lado ou acima dessa tabela (sem removê-la — ela vira a "alternativa textual" exigida pelo critério de aceite), um componente de gráfico de barras, usando a biblioteca definida na Parte 4.
3. Os dados que alimentam o gráfico devem ser **os mesmos** que alimentam a tabela — não criem uma segunda fonte de dados, para garantir que gráfico e tabela sempre mostrem o mesmo valor.
4. Testem visualmente que o gráfico aparece corretamente com pelo menos 2-3 turmas de dados de exemplo.

---

## Parte 6 — Montar o gráfico de evolução por período

1. Repitam o raciocínio da Parte 5, agora para os dados de "ocorrências por período" (ex: por mês ou bimestre), usando um gráfico de linha ou de barras ao longo do tempo.
2. De novo, mantenham a versão em tabela/texto já existente, sem removê-la.

---

## Parte 7 — Conferir se os valores batem com os filtros aplicados

O critério de aceite exige que os **valores exibidos correspondam aos dados filtrados** (ex: se a pessoa filtrar por um período específico, o gráfico tem que refletir só aquele período, não todos os dados).

1. Testem aplicando um filtro na tela de relatórios (ex: escolher um período específico, se essa opção já existir).
2. Confirmem que tanto a tabela quanto o gráfico mudam juntos, de forma consistente.
3. Se a tela ainda não tiver filtros implementados, verifiquem com o grupo se isso já é escopo de outra issue (não dupliquem trabalho).

---

## Parte 8 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Se mexeram no backend também, rodem também (perguntem ao grupo se o comando é este ou parecido):

```
pnpm --filter api build
```

4. Aperte Enter e aguardem cada um.

> Erros aqui são normais em issues grandes — não se cobrem demais. Se travarem em algo específico por mais de 20-30 minutos, chamem o grupo com prints do erro e do trecho de código relacionado.

---

## Parte 9 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados (frontend e, se for o caso, backend).
3. Mensagem de commit:

```
feat(FE-10): adiciona graficos de distribuicao e evolucao nos relatorios
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-10-graficos-relatorios`

---

## Parte 10 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-10: adiciona graficos de distribuicao e evolucao nos relatorios`
4. Descrição: expliquem quais dados o backend já fornecia e quais precisaram de ajuste, qual biblioteca de gráfico foi usada, e confirmem que a alternativa em tabela/texto foi mantida.
5. Em **"Reviewers"**, selecionem **José** (e considerem pedir revisão também do Max, já que a issue envolve backend).
6. Cliquem em **"Create pull request"**.

---

**Por ser uma issue G:** considerem dividir o Pull Request em partes menores se possível (ex: um PR só para o gráfico por turma, outro para o gráfico por período), o que facilita a revisão do José e reduz o risco de um erro grande passar despercebido.
