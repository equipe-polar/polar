# Guia Passo a Passo — Issue FE-04
### Exibir nome do usuário no histórico da ocorrência (em vez do usuarioId)

**Projeto:** P.O.L.A.R.
**Responsável:** Daniel
**Validador:** José
**Prazo:** 5 dias
**Esforço:** M
**Arquivos a alterar:**
- `apps/web/src/features/ocorrencias/DetalheOcorrenciaPage.tsx`
- `apps/web/src/services/school.service.ts`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se em algum passo a tela aparecer diferente do descrito aqui, **pare e chame o Daniel/José no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Hoje o histórico da ocorrência mostra um código como `usuarioId: 4f2a...` no lugar de quem fez a ação. Sua tarefa é trocar isso pelo **nome da pessoa** — e, quando o perfil de quem está vendo a tela não puder ver nomes de usuários (ex: professor), mostrar o **nome do papel** (ex: "Coordenação") no lugar.

### Bloco pronto de implementação

No detalhe da ocorrência, substitua o `usuarioId` por um valor como `usuarioNome` e aplique fallback de papel no componente.

```tsx
const nomeResponsavel = item.usuarioNome ?? rotuloDePapel(item.papelUsuario ?? 'coordenacao');

return (
  <li>
    <strong>{nomeResponsavel}</strong>
    <span>{item.data}</span>
    <span>{item.status}</span>
  </li>
);
```

```ts
// helper opcional
export function rotuloDePapel(papel?: string) {
  const mapa: Record<string, string> = {
    coordenacao: 'Coordenação',
    professor: 'Professor',
    direcao: 'Direção',
    paet: 'PAET',
  };

  return mapa[papel ?? ''] ?? 'Usuário';
}
```

> A regra de decisão é: se o nome do usuário estiver disponível, mostre o nome; se não, use o papel por extenso. Nunca deixe a tela quebrar por `undefined`.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta pessoal (já colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** perto do topo da página.
5. No menu que abrir, clique na aba **"Codespaces"**.
6. Clique em **"Create codespace on master"**.
7. Aguarde de 1 a 3 minutos, sem fechar a aba, até o VS Code abrir dentro do navegador.

> **Se falhar:** confirme que está logado com a conta certa. Se aparecer aviso de "limite de horas", avise o grupo — não tente resolver sozinho mexendo em configurações.

---

## Parte 2 — Entender os dois arquivos envolvidos

Esta tarefa mexe em **dois** arquivos que trabalham juntos:

- `school.service.ts` → é onde o sistema **busca** os dados no servidor (é a "fonte" da informação).
- `DetalheOcorrenciaPage.tsx` → é onde essa informação **aparece na tela**.

### Passo a passo para localizar

1. Do lado esquerdo, clique no ícone de lupa (**Search**), ou aperte `Ctrl+Shift+F`.
2. Digite: `listOcorrenciasDetalhadas`
3. Aperte Enter. Isso deve te mostrar onde essa função aparece — provavelmente em `school.service.ts` (onde ela é definida) e em `DetalheOcorrenciaPage.tsx` (onde ela é usada).
4. Abra o arquivo `school.service.ts` clicando nele na lista de resultados.
5. Dentro dele, use `Ctrl+F` e busque por `usuarioId` para ver como o dado de usuário chega hoje.

> **Importante:** não tenho acesso ao conteúdo atual desses arquivos, então não posso indicar a linha exata. O que você precisa **confirmar antes de editar** é: a função `listOcorrenciasDetalhadas` já traz, junto com `usuarioId`, algum campo com o **nome** da pessoa (algo como `usuarioNome`, `usuario.nome` ou parecido)?
>
> - **Se já existir** um campo com o nome → você só precisa trocar a exibição na tela (vá direto para a Parte 3).
> - **Se não existir** → antes de mexer na tela, escreva no grupo pedindo confirmação de que o backend já devolve esse nome. **Não invente um campo que talvez não exista.**

---

## Parte 3 — Mostrar o nome na tela

1. Abra `DetalheOcorrenciaPage.tsx`.
2. Use `Ctrl+F` e busque por `usuarioId` novamente, agora dentro deste arquivo.
3. Localize o trecho de código que hoje mostra esse valor na lista do histórico (geralmente dentro de chaves `{ }`, próximo de outras informações do histórico como data e status).
4. Troque a referência ao `usuarioId` pela referência ao campo de nome que você confirmou na Parte 2 (ex: se o campo se chamar `usuarioNome`, o trecho passa a mostrar `{item.usuarioNome}` em vez de `{item.usuarioId}`).

### Parte 3.1 — Tratando o caso do professor (sem acesso a nomes)

A tarefa também exige: quando o perfil da pessoa logada **não pode listar usuários** (ex: professor), a tela deve mostrar o **nome do papel por extenso** (ex: "Coordenação Pedagógica") em vez de travar ou mostrar erro.

1. Ainda dentro de `DetalheOcorrenciaPage.tsx` (ou em um arquivo que ele importa), busque por `rotuloDePapel` usando `Ctrl+F`.
2. Esse é o nome de uma função que já existe no projeto, em `components/layout/iniciais.ts`, e que converte o papel (ex: `"coordenacao"`) no texto por extenso (ex: `"Coordenação Pedagógica"`).
3. A lógica que você precisa montar é do tipo:
   - **Se** o nome do usuário estiver disponível → mostrar o nome.
   - **Senão** → usar `rotuloDePapel()` passando o papel da pessoa, e mostrar o resultado no lugar do nome.
4. Se você não souber escrever essa condição em código, escreva em português exatamente o que quer fazer (como no item acima) e mande para o Daniel/José pedirem ajuda de quem já sabe montar a estrutura — **não adivinhe a sintaxe**.

> **Critério de aceite a lembrar:** o perfil de professor **não pode apresentar nenhum erro** na tela. Depois de editar, teste especificamente logado como professor (peça a alguém do grupo as credenciais de teste, se não tiver).

5. Salve o arquivo: `Ctrl+S`.

---

## Parte 4 — Testar se não quebrou nada

1. Abra o terminal: menu **"Terminal"** → **"New Terminal"**.
2. Clique na área preta que abrir e digite:

```
pnpm --filter web build
```

3. Aperte Enter e aguarde.

> **Como saber se deu certo:** se aparecer "build success" / "done" / marcação verde no final, pode seguir para a Parte 5. Se aparecer texto vermelho com "error", volte à Parte 3 e confira com calma se os nomes dos campos usados batem exatamente com os que existem no arquivo. Se não resolver em até 10 minutos, tire um print do erro e mande para o Daniel/José.

4. **Teste manual extra** (além do build): se o projeto tiver um jeito de rodar localmente e você tiver um usuário de teste com perfil de professor, entre no sistema como professor e abra o detalhe de uma ocorrência para confirmar que nenhum erro aparece na tela.

---

## Parte 5 — Enviar o trabalho

1. Do lado esquerdo, clique no ícone de três bolinhas ligadas (**Source Control**).
2. Passe o mouse sobre o nome do projeto no topo do painel e clique no **"+"** para marcar os arquivos alterados.
3. No campo de mensagem, escreva:

```
fix(FE-04): exibe nome do usuario no historico, com fallback de papel
```

4. Clique em **"Commit"** e depois em **"Sync Changes"** (ou "Push").

> Se o VS Code pedir para criar uma branch antes de tudo isso: clique onde está escrito "master" no canto inferior esquerdo, escolha **"Create new branch"** e nomeie: `fe-04-nome-usuario-historico`.

---

## Parte 6 — Abrir o Pull Request

1. Volte para a aba do `github.com/equipe-polar/polar` no navegador.
2. Clique no botão **"Compare & pull request"** (ou vá em "Pull requests" → "New pull request" e escolha sua branch).
3. Título: `FE-04: exibe nome do usuario no historico, com fallback de papel`
4. Descrição: explique em poucas linhas o que foi feito, incluindo se você confirmou o campo de nome com o grupo e se testou como professor.
5. Em **"Reviewers"**, selecione **José**.
6. Clique em **"Create pull request"**.

---

**Dúvidas em qualquer passo:** chame o grupo antes de tentar adivinhar. Faz parte do processo.
