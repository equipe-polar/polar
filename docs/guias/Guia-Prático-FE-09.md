# Guia Passo a Passo — Issue FE-09
### Painel de movimentações recentes na página inicial

**Projeto:** P.O.L.A.R.
**Responsáveis:** Antonio & Iago
**Validador:** José
**Prazo:** 4 dias
**Esforço:** M
**Arquivos envolvidos:**
- `apps/web/src/features/dashboard/` (painel da página inicial)
- Endpoint de backend para movimentações (**a definir** — ver aviso abaixo)

---

## ⚠️ Aviso importante antes de tudo: esta issue está bloqueada

A própria issue diz: **"Esta tarefa depende da criação de um endpoint no backend para fornecer os dados."** Isso significa que, hoje, **não existe ainda no servidor um lugar de onde buscar essas 5 movimentações recentes**.

**O que isso muda na prática:**
- Vocês **não conseguem terminar** essa tarefa sozinhos, porque falta a peça do backend.
- **Antes de escrever qualquer código**, é preciso descobrir com o time de backend (Max é o validador do lado backend) se:
  1. Esse endpoint já foi criado por alguém enquanto vocês não olhavam, ou
  2. Precisa entrar na fila de tarefas do backend antes da FE-09 poder avançar.

**Ação recomendada:** mandem uma mensagem pro Max/José perguntando diretamente: *"O endpoint de movimentações recentes para a FE-09 já existe? Se não, quem vai criar e qual o prazo?"* — e só depois disso decidam se seguem com este guia ou aguardam.

Se o endpoint **ainda não existe**, vocês podem adiantar a **Parte 1 a 3** deste guia (que são sobre a parte visual, usando dados fictícios/de exemplo) e parar antes da Parte 4, que depende do endpoint de verdade.

---

> **Sobre este guia:** ele assume que vocês nunca usaram Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito, **parem e chamem o Antonio/Iago/José no grupo** antes de continuar.

---

## O que vocês vão fazer, em uma frase

Criar um painel lateral na tela inicial (Dashboard) mostrando as **5 movimentações mais recentes** das ocorrências: quem alterou, qual foi a mudança de status, e a data — respeitando o que cada perfil de usuário tem permissão de ver (sem vazar informação de ocorrência que a pessoa não deveria acessar).

### Bloco pronto de implementação

Este é o esqueleto do componente visual usado antes da integração com o backend real:

```tsx
export function MovimentacoesRecentesPanel() {
  const exemploMovimentacoes = [
    { usuario: 'Ana Beatriz', statusAnterior: 'Aberta', statusNovo: 'Em andamento', data: '2026-08-10T09:00:00Z' },
    { usuario: 'José', statusAnterior: 'Em andamento', statusNovo: 'Resolvida', data: '2026-08-11T14:30:00Z' },
  ];

  return (
    <aside>
      <h3>Movimentações recentes</h3>
      <ul>
        {exemploMovimentacoes.map((item, index) => (
          <li key={index}>
            <strong>{item.usuario}</strong>
            <span>{item.statusAnterior} → {item.statusNovo}</span>
            <small>{new Date(item.data).toLocaleString()}</small>
          </li>
        ))}
      </ul>
    </aside>
  );
}
```

Depois da integração real, troque a lista do exemplo pela resposta do endpoint e mantenha a mesma renderização.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abram o navegador (Chrome ou Edge) e acessem **github.com**.
2. Façam login com a conta pessoal (colaboradora da organização `equipe-polar`).
3. Acessem **github.com/equipe-polar/polar**.
4. Cliquem no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguardem de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Entender a tela onde o painel vai entrar

1. No **Explorer** (ícone de pastas, lado esquerdo), naveguem até `apps/web/src/features/dashboard/`.
2. Abram os arquivos que encontrarem ali (provavelmente algo como `DashboardPage.tsx`) e olhem a estrutura geral: como a página principal é montada, se já existe algum "painel lateral" parecido (ex: um card de resumo, um menu lateral) para servir de referência visual.
3. Usem `Ctrl+Shift+F` e busquem por `escopoDeOcorrencias` — a issue indica esse nome como referência de como o sistema já filtra o que cada perfil pode ver. Esse termo deve aparecer em `ocorrencias.service.ts`.
4. Abram o arquivo onde `escopoDeOcorrencias` aparece e leiam a lógica geral (não precisam entender cada linha): a ideia é que, quando o endpoint novo for criado, ele **também** deve aplicar essa mesma regra de "o que cada perfil pode ver" — para não vazar dado de ocorrência entre perfis diferentes. Isso é o time de backend que garante, mas é bom vocês saberem que essa regra existe, para cobrar isso na hora de testar.

---

## Parte 3 — Montar a parte visual do painel (pode ser feita mesmo sem o endpoint pronto)

Vocês podem adiantar o "esqueleto" visual usando dados de exemplo (fake), trocando depois pelos dados reais.

1. Dentro de `apps/web/src/features/dashboard/`, criem um novo arquivo: `MovimentacoesRecentesPanel.tsx` (clique com botão direito na pasta → **"New File"**).
2. Nesse arquivo, montem um componente simples que:
   - Recebe uma lista de movimentações como informação de entrada (por enquanto, criem uma lista de exemplo direto no código, com 5 itens fictícios, só para visualizar).
   - Para cada movimentação, mostra: nome de quem alterou, a mudança de status (ex: "Aberta → Em andamento"), e a data.
3. Um exemplo de dado fictício para usar enquanto o endpoint não existe (**apaguem isso depois, é só para teste visual**):

```tsx
const exemploMovimentacoes = [
  { usuario: "Ana Beatriz", statusAnterior: "Aberta", statusNovo: "Em andamento", data: "2026-08-10T09:00:00Z" },
  { usuario: "José", statusAnterior: "Em andamento", statusNovo: "Resolvida", data: "2026-08-11T14:30:00Z" },
];
```

4. Encaixem esse componente novo dentro da tela principal do dashboard (o arquivo que vocês abriram na Parte 2), como um painel lateral — usem a mesma estrutura visual de algum outro card/painel que já exista na tela, para manter o padrão visual do sistema.
5. Salvem os arquivos: `Ctrl+S`.

> **Não gastem tempo demais deixando isso bonito ainda** — o objetivo desta parte é só ter a estrutura pronta para plugar os dados reais assim que o endpoint existir.

---

## Parte 4 — Conectar com o endpoint real (só depois que ele existir)

**Não façam esta parte até confirmarem com o backend que o endpoint existe.**

Quando confirmado, vocês vão precisar saber, com o backend:
- Qual é o **caminho** do endpoint (ex: `/api/ocorrencias/movimentacoes-recentes`)
- Qual é o **formato exato** dos dados que ele devolve (nomes dos campos)

Com essa informação em mãos:

1. Abram `apps/web/src/services/school.service.ts` (mesmo arquivo usado em outras issues de tela).
2. Usem `Ctrl+F` para ver como outras funções desse arquivo já buscam dados do backend — copiem esse padrão para escrever uma função nova que busca as movimentações recentes.
3. No componente `MovimentacoesRecentesPanel.tsx`, troquem a lista fictícia da Parte 3 pela chamada real a essa nova função.

> Como ainda não existe o endpoint, **não posso descrever o código exato desta parte agora**. Assim que o time de backend confirmar o formato, voltem a chamar o grupo (ou peçam para eu atualizar este guia) para detalhar esse passo com precisão.

---

## Parte 5 — Testar sem vazar dados entre perfis

Este é o ponto mais delicado da issue: o critério de aceite exige **"sem vazamento de informações entre perfis"**.

1. Se possível, testem logados com pelo menos dois perfis diferentes (ex: professor e coordenação) usando credenciais de teste (peçam ao grupo se não tiverem).
2. Confirmem que, em cada perfil, o painel mostra **apenas** movimentações de ocorrências que aquele perfil poderia ver na lista normal de ocorrências — nunca mais do que isso.
3. Se não tiverem como testar com múltiplos perfis, **documentem isso claramente na descrição do Pull Request**, avisando o José que esse teste específico ainda precisa ser feito por alguém com acesso aos perfis de teste.

---

## Parte 6 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Aperte Enter e aguardem. Se der erro, revisem com calma o componente novo criado. Se não resolver em 15 minutos, print do erro para o grupo.

---

## Parte 7 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Passem o mouse sobre o nome do projeto e cliquem no **"+"** para marcar os arquivos alterados/criados.
3. Mensagem de commit (ajustem conforme até onde chegaram):

```
feat(FE-09): painel de movimentacoes recentes no dashboard
```

4. Cliquem em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: cliquem em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-09-painel-movimentacoes`

---

## Parte 8 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-09: painel de movimentacoes recentes no dashboard`
4. **Na descrição, sejam bem claros sobre o status**: se o endpoint real já foi integrado ou se o PR ainda usa dados fictícios aguardando o backend. Marquem como **"rascunho" (Draft pull request)** se ainda não estiver completo — há uma opção para isso na hora de criar o PR.
5. Em **"Reviewers"**, selecionem **José**.
6. Cliquem em **"Create pull request"** (ou **"Create draft pull request"**, se ainda não estiver pronto).

---

**Resumo do que fazer agora:** falem com o Max/José sobre o endpoint **antes** de tudo. Enquanto isso, podem adiantar a Parte 3 (visual com dados fictícios) sem risco de retrabalho.
