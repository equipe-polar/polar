# Guia Passo a Passo — Issue FE-13
### Indicador visual de histórico de ocorrências na lista de alunos

**Projeto:** P.O.L.A.R.
**Responsável:** José
**Validador:** José
**Prazo:** A definir
**Esforço:** M
**Arquivos envolvidos:**
- `apps/api/src/modules/alunos/`
- `apps/api/src/modules/ocorrencias/`
- `apps/web/src/features/alunos/AlunosPage.tsx`
- `apps/web/src/services/school.service.ts`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o José no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Na lista de alunos, mostrar um indicador (verde/amarelo/vermelho) resumindo o histórico de ocorrências de cada aluno: **verde** = nenhuma ocorrência, **amarelo** = poucas, **vermelho** = muitas ou casos graves. Um aluno sem nenhuma ocorrência aparece **sempre verde**.

### Bloco pronto de implementação

A regra deve ficar centralizada em uma função utilitária do frontend:

```ts
export function calcularIndicadorAluno(totalOcorrencias: number, temOcorrenciaGrave: boolean) {
  if (totalOcorrencias === 0) {
    return { cor: 'verde', texto: 'Sem ocorrências' };
  }

  if (temOcorrenciaGrave || totalOcorrencias >= 4) {
    return { cor: 'vermelho', texto: 'Atenção' };
  }

  return { cor: 'amarelo', texto: 'Poucas ocorrências' };
}
```

Uso na lista de alunos:

```tsx
const indicador = calcularIndicadorAluno(aluno.totalOcorrencias, aluno.temOcorrenciaGrave);

<span className={`status-dot ${indicador.cor}`}>{indicador.texto}</span>
```

```css
.status-dot.verde { background: var(--cor-verde); }
.status-dot.amarelo { background: var(--cor-amarelo); }
.status-dot.vermelho { background: var(--cor-vermelho); }
```

> Os limiares exatos devem ser aprovados pela coordenação antes da implementação; a lógica acima é um esqueleto funcional, não a regra oficial.

---

## ⚠️ Aviso: os limites (quantos é "poucas" e quantos é "muitas") precisam ser definidos antes de codar

A issue é clara: **"Os limiares devem ser definidos e documentados pela coordenação."** Isso não é uma decisão técnica de vocês — é conteúdo pedagógico que precisa de aprovação.

**Ação recomendada:** antes da Parte 4 deste guia, peçam ao José os limiares oficiais (ex: "0 ocorrências = verde", "1 a 3 = amarelo", "4 ou mais, ou qualquer ocorrência grave = vermelho" — **isto é só um exemplo**, não usem sem confirmação). Enquanto isso não chega, adiantem as Partes 1 a 3.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Entender a lista de alunos hoje

1. No **Explorer**, abram `apps/web/src/features/alunos/AlunosPage.tsx`.
2. Vejam como a lista de alunos é montada hoje (provavelmente uma tabela, com uma linha por aluno).
3. Abram `apps/web/src/services/school.service.ts` e usem `Ctrl+F` para buscar pela função que traz os dados dos alunos para essa tela (busquem por `alunos` ou `listarAlunos`).
4. Verifiquem: os dados que já chegam para essa tela incluem alguma contagem ou resumo de ocorrências por aluno? Se sim, a Parte 3 fica mais simples. Se não, será necessário buscar esse dado a mais.

> Não tenho acesso ao conteúdo atual desses arquivos — este passo de leitura é essencial antes de decidir o caminho técnico.

---

## Parte 3 — Backend: calcular o indicador por aluno

O indicador **não deve ser calculado "adivinhando" no frontend** — o ideal é que o backend já devolva, para cada aluno, a contagem de ocorrências (e se alguma é grave), para o frontend só decidir a cor.

1. No **Explorer**, abram `apps/api/src/modules/alunos/` e `apps/api/src/modules/ocorrencias/`.
2. Verifiquem se já existe alguma função que relaciona aluno com suas ocorrências (busquem por `ocorrencias` dentro da pasta de alunos, com `Ctrl+Shift+F`).
3. **Se já existir uma forma de contar ocorrências por aluno** → sigam para a Parte 4, ajustando o que for necessário para incluir isso na resposta da lista de alunos.
4. **Se não existir** → será necessário adicionar essa lógica no backend (contar quantas ocorrências cada aluno tem, e verificar se alguma tem gravidade alta). Esta é uma parte mais avançada de banco/backend — se não tiverem confiança, **chamem alguém do time de backend ou banco de dados (ver lista-membros) para ajudar nesta parte específica.**

> **Cuidado com performance:** calcular isso "aluno por aluno" de forma repetida pode deixar a lista lenta se houver muitos alunos. Se o grupo tiver alguém com mais experiência em banco de dados, vale pedir revisão dessa parte antes de finalizar.

---

## Parte 4 — Aplicar os limiares aprovados pela coordenação

**Só façam este passo com os limiares já confirmados (ver aviso no início).**

Assim como na FE-12 (cores de gravidade), a boa prática é centralizar essa regra em um lugar só, por exemplo em `apps/web/src/services/domain.ts` (verifiquem se esse arquivo já existe e já tem outros mapeamentos parecidos, como o de gravidade da FE-12).

1. Criem (ou reaproveitem, se outra issue já tiver criado algo parecido) uma função que recebe a contagem de ocorrências de um aluno e devolve a cor + texto correspondente, seguindo os limiares aprovados. Formato de exemplo:

```ts
function calcularIndicadorAluno(totalOcorrencias: number, temOcorrenciaGrave: boolean) {
  if (totalOcorrencias === 0) return { cor: "verde", texto: "Sem ocorrências" };
  if (temOcorrenciaGrave) return { cor: "vermelho", texto: "Ocorrência grave registrada" };
  // ...os limiares intermediários (ex: quantidade "poucas" vs "muitas") entram aqui,
  // com os valores exatos aprovados pela coordenação.
}
```

> **O código acima é só um esqueleto de exemplo** — os números e regras exatas dependem do que a coordenação definir. Não preencham os limiares "no chute".

2. Se houver um mapeamento de cor já criado na FE-12, **reaproveitem as mesmas variáveis de cor** do `tokens.css`, para manter consistência visual entre as duas issues.

---

## Parte 5 — Exibir o indicador na lista de alunos

1. Em `AlunosPage.tsx`, adicionem, para cada linha de aluno, o indicador visual (ex: uma bolinha colorida) **junto com o texto** (ex: "Sem ocorrências", "Poucas ocorrências", "Muitas ocorrências / grave") — nunca só a cor sozinha, para acessibilidade.
2. Confirmem visualmente que um aluno sem nenhuma ocorrência aparece sempre em **verde**.

---

## Parte 6 — Testar

1. Se o projeto tiver como rodar localmente, testem com pelo menos três alunos de exemplo: um sem ocorrências, um com poucas, um com muitas/graves.
2. Confirmem que a cor e o texto batem com os limiares definidos pela coordenação.
3. Confirmem que um aluno sem nenhuma ocorrência aparece sempre verde, mesmo depois de recarregar a página.

---

## Parte 7 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Se mexeram no backend, rodem também o build correspondente (perguntem ao grupo o comando exato).

> Se der erro, revisem com calma os nomes de campos entre frontend e backend (precisam bater exatamente). Se não resolverem em 20 minutos, print do erro para o grupo.

---

## Parte 8 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados (frontend e backend).
3. Mensagem de commit:

```
feat(FE-13): adiciona indicador de historico de ocorrencias na lista de alunos
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-13-indicador-historico-aluno`

---

## Parte 9 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-13: adiciona indicador de historico de ocorrencias na lista de alunos`
4. Descrição: informem quais limiares foram usados e que foram aprovados pela coordenação (citem quem confirmou).
5. Em **"Reviewers"**, selecionem **José**.
6. Cliquem em **"Create pull request"**.
