# Guia Passo a Passo — Issue FE-02
### Modal de confirmação antes de inativar alunos, turmas e usuários

**Projeto:** P.O.L.A.R.
**Responsável:** Igor
**Validador:** José
**Prazo:** 3 dias
**Esforço:** M
**Arquivos envolvidos:**
- `apps/web/src/components/ui/Modal.tsx`
- Páginas de alunos, turmas e usuários
**Referência de padrão já existente:** modal já usado em `UsuariosPage.tsx`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o Igor/José no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Hoje, clicar em "inativar" um aluno, turma ou usuário provavelmente já executa a ação na hora, sem confirmação. Sua tarefa é colocar um **modal de confirmação** (uma janelinha que pergunta "tem certeza?") antes de qualquer inativação acontecer de verdade, em três lugares: alunos, turmas e usuários.

Esta é uma tarefa que se repete **três vezes** (mesma lógica, três telas diferentes) — depois de entender o primeiro caso, os outros dois ficam mais rápidos.

### Bloco pronto de implementação

A lógica correta é: o clique em inativar abre o modal, e a ação real só acontece no `Confirmar`. Faça isso no arquivo da tela que tiver o botão de inativar.

```tsx
const [modalAberto, setModalAberto] = useState(false);

const confirmarInativacao = async () => {
  await inativarAluno(alunoSelecionado.id);
  setModalAberto(false);
};

return (
  <>
    <Button onClick={() => setModalAberto(true)}>Inativar</Button>

    <Modal
      isOpen={modalAberto}
      title="Confirmar inativação"
      onClose={() => setModalAberto(false)}
      onConfirm={confirmarInativacao}
      confirmLabel="Confirmar"
      cancelLabel="Cancelar"
    >
      <p>Tem certeza que deseja inativar este aluno? Essa ação pode ser revertida depois.</p>
    </Modal>
  </>
);
```

Se o componente `Modal` do projeto tiver props diferentes, mantenha a mesma ideia: `isOpen`, `onClose`, `onConfirm`, `title` e `children`.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Estudar o modal que já existe (não criar um novo do zero)

A issue é clara: **reaproveitar** o modal já usado em `UsuariosPage.tsx`, não inventar um componente novo.

1. Do lado esquerdo, clique no ícone de lupa (**Search**) ou `Ctrl+Shift+F`.
2. Digite: `UsuariosPage`
3. Abram o arquivo encontrado.
4. Usem `Ctrl+F` dentro do arquivo e busquem por `Modal` — deve aparecer tanto o `import` do componente `Modal` no topo do arquivo, quanto o(s) lugar(es) onde ele é usado.
5. Encontrem especificamente o trecho onde o modal é usado para confirmar uma **inativação** (pode ser que o `UsuariosPage.tsx` já tenha exatamente esse caso pronto, já que a issue cita ele como exemplo). Anotem/observem:
   - Como o modal é aberto (normalmente um estado tipo `const [modalAberto, setModalAberto] = useState(false)`).
   - Que texto/pergunta aparece dentro do modal.
   - O que acontece quando a pessoa clica em "Confirmar" e o que acontece quando clica em "Cancelar".

6. Abram também `apps/web/src/components/ui/Modal.tsx` só para ver rapidamente quais informações esse componente espera receber (ex: um texto, uma função para quando confirmar, uma função para quando cancelar/fechar).

> **Importante:** não tenho acesso ao conteúdo atual desses arquivos, então não posso indicar o nome exato das props do `Modal` nem o texto usado hoje em `UsuariosPage.tsx`. **Este passo de leitura não é opcional** — é a base para repetir o mesmo padrão nas outras telas.

---

## Parte 3 — Aplicar em uma primeira tela (recomendo começar por Alunos)

1. Encontrem o arquivo da página de alunos (`Ctrl+Shift+F` → busquem por `AlunosPage`).
2. Localizem o botão ou ação que hoje **inativa** um aluno diretamente (busquem por termos como `inativar`, `desativar` ou `status` dentro do arquivo).
3. A mudança que vocês vão fazer segue esta lógica, em três partes:
   - **Antes:** o clique no botão de inativar já executa a inativação na hora.
   - **Depois:** o clique no botão de inativar só **abre o modal**; a inativação de verdade só acontece se a pessoa clicar em "Confirmar" dentro do modal.
4. Para isso, sigam o mesmo padrão de estado (`useState`) que vocês viram em `UsuariosPage.tsx` na Parte 2: uma variável para controlar se o modal está aberto, e a função de inativar só é chamada dentro do "Confirmar" do modal.
5. Copiem a estrutura do `<Modal ...>` de `UsuariosPage.tsx`, colem no arquivo de alunos, e adaptem o texto para fazer sentido (ex: "Tem certeza que deseja inativar este aluno? Esta ação pode ser revertida depois, mas o aluno deixará de aparecer nas listas ativas." — ajustem conforme o texto real usado como referência).
6. Salvem: `Ctrl+S`.

---

## Parte 4 — Testar a primeira tela antes de repetir nas outras

**Não pulem direto para as próximas duas telas sem testar esta primeiro** — é mais fácil corrigir um erro agora do que depois de repeti-lo três vezes.

1. Se o projeto tiver como rodar localmente (perguntem o comando ao Igor/José, provavelmente `pnpm --filter web dev`), rodem e abram a tela de alunos no navegador.
2. Cliquem no botão de inativar um aluno de teste (não usem um aluno real/importante para testar).
3. Confirmem que:
   - [ ] O aluno **não** foi inativado ainda (o modal apareceu, mas nada mudou de verdade)
   - [ ] Clicar em **"Cancelar"** fecha o modal e **não inativa** ninguém
   - [ ] Clicar em **"Confirmar"** inativa o aluno normalmente, como acontecia antes desta mudança

---

## Parte 5 — Repetir em Turmas e em Usuários

Depois que a Parte 3 e 4 funcionarem bem para alunos, repitam **exatamente o mesmo raciocínio** nas outras duas telas:

1. Encontrem a página de turmas (`TurmasPage`) e apliquem a mesma lógica: botão de inativar abre o modal, a inativação só ocorre no "Confirmar".
2. Encontrem a página de usuários (`UsuariosPage` — a própria referência). Verifiquem se ela **já tem** o modal de confirmação para inativação implementado (é possível que sim, já que é citada como exemplo). Se já tiver, **não precisam mexer nela**, só confirmem que está funcionando como esperado. Se não tiver (por exemplo, se o modal existente ali for usado só para outra coisa), apliquem a mesma lógica das outras duas telas.
3. Testem cada uma seguindo os mesmos passos da Parte 4.

---

## Parte 6 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Aperte Enter e aguardem.

> Se der erro em vermelho, revisem com calma se os imports do componente `Modal` foram adicionados corretamente em cada arquivo alterado, e se as chaves `{ }` dos blocos de código estão todas fechadas. Se não resolverem em 15 minutos, print do erro para o grupo.

---

## Parte 7 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Passem o mouse sobre o nome do projeto e clique no **"+"** para marcar todos os arquivos alterados.
3. Mensagem de commit:

```
feat(FE-02): adiciona confirmacao antes de inativar alunos, turmas e usuarios
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-02-confirmar-inativacao`

---

## Parte 8 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-02: adiciona confirmacao antes de inativar alunos, turmas e usuarios`
4. Descrição: listem as três telas alteradas e confirmem que testaram cancelar e confirmar em cada uma.
5. Em **"Reviewers"**, selecionem **José**.
6. Cliquem em **"Create pull request"**.
