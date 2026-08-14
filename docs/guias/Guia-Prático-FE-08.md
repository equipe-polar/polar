# Guia Passo a Passo — Issue FE-08
### Criar a tela "Meu Perfil"

**Projeto:** P.O.L.A.R.
**Responsáveis:** Júlia & Lucas (dupla — dividam os passos entre vocês, ex: um mexe na tela nova e outro no menu/rota)
**Validador:** José
**Prazo:** 4 dias
**Esforço:** M
**Arquivos envolvidos:**
- `apps/web/src/features/perfil/PerfilPage.tsx` (**novo arquivo**, ainda não existe)
- `apps/web/src/app/routes.tsx`
- `apps/web/src/components/layout/UserMenu.tsx`

> **Antes de começar:** este guia assume que vocês nunca usaram Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **parem e chamem a Júlia/José no grupo** antes de continuar.

---

## O que vocês vão fazer, em uma frase

Criar uma página nova chamada **"Meu Perfil"**, que mostra nome, e-mail e papel de quem está logado, mais um formulário para trocar a própria senha. E colocar um link para essa página no menu de usuário (o menu que abre clicando no nome/avatar no topo da tela).

Esta é a issue mais "grande" das que já fizemos até agora, porque envolve **criar um arquivo do zero**, não só editar um existente. Por isso, vamos dividir em pedaços bem pequenos.

### Bloco pronto de implementação

Estrutura base do componente na nova tela `apps/web/src/features/perfil/PerfilPage.tsx`:

```tsx
export default function PerfilPage() {
  const { user } = useAuth();

  return (
    <section>
      <h1>Meu Perfil</h1>
      <p><strong>Nome:</strong> {user?.nome}</p>
      <p><strong>E-mail:</strong> {user?.email}</p>
      <p><strong>Papel:</strong> {user?.papel}</p>

      <form>
        <input type="password" name="novaSenha" placeholder="Nova senha" />
        <input type="password" name="confirmacao" placeholder="Confirmar senha" />
        <button type="submit">Salvar</button>
      </form>
    </section>
  );
}
```

Na rota:

```tsx
import PerfilPage from '../features/perfil/PerfilPage';

{ path: '/perfil', element: <PerfilPage /> }
```

No menu de usuário:

```tsx
<MenuItem to="/perfil">Meu Perfil</MenuItem>
```

> A senha deve ser rejeitada se tiver menos de 8 caracteres ou mais de 72; o texto do formulário e o nome do campo devem seguir o padrão já usado no projeto.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abram o navegador (Chrome ou Edge) e acessem **github.com**.
2. Façam login com a conta pessoal (colaboradora da organização `equipe-polar`).
3. Acessem **github.com/equipe-polar/polar**.
4. Cliquem no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguardem de 1 a 3 minutos até o VS Code abrir no navegador.

> **Recomendação para a dupla:** cada um pode abrir seu próprio Codespace (contam separado nas 60h grátis de cada conta), trabalhar na mesma branch e sincronizar via push/pull — combinem entre vocês quem envia primeiro para evitar dois enviando ao mesmo tempo.

---

## Parte 2 — Encontrar os exemplos para copiar (não inventar do zero)

A issue já indica dois modelos prontos no projeto para se inspirar: `ConfiguracoesPage.tsx` e o cabeçalho do `DashboardPage.tsx`. **A estratégia aqui é copiar a estrutura de uma tela que já existe e adaptar**, não escrever do zero.

1. Do lado esquerdo, cliquem no ícone de lupa (**Search**) ou `Ctrl+Shift+F`.
2. Busquem por `ConfiguracoesPage` e abram o arquivo encontrado.
3. Leiam a estrutura geral do arquivo (não precisam entender cada linha, só notar o "formato": imports no topo, um componente, um `return` com o HTML/JSX da tela).
4. Busquem também por `DashboardPage` e abram, só para ver como o cabeçalho da tela costuma ser montado.

> **Se a estrutura desses arquivos parecer muito diferente do que está descrito aqui**, é sinal de que o projeto mudou desde a última vez que essas informações foram levantadas — parem e avisem o grupo antes de tentar copiar algo que pode estar desatualizado.

---

## Parte 3 — Criar o arquivo da nova tela

1. Do lado esquerdo, no ícone de pastas (**Explorer**), naveguem até `apps/web/src/features/`.
2. Clique com o botão direito na pasta `features` → **"New Folder"** → nomeie: `perfil`
3. Clique com o botão direito na pasta `perfil` recém-criada → **"New File"** → nomeie: `PerfilPage.tsx`
4. Um arquivo vazio abre. É aqui que vocês vão montar a tela, usando `ConfiguracoesPage.tsx` como referência de formato.

### O que a tela precisa ter (do critério de aceite)

- [ ] Exibir o **nome** do usuário logado
- [ ] Exibir o **e-mail** do usuário logado
- [ ] Exibir o **papel** do usuário logado (ex: "Professor", "Coordenação")
- [ ] Um **formulário de troca de senha**, usando a API que já existe (não criar uma API nova)
- [ ] Validação de senha: **entre 8 e 72 caracteres**

> **Importante:** não tenho acesso ao conteúdo atual de `ConfiguracoesPage.tsx` nem sei o nome exato da API de troca de senha. **Não vou inventar nomes de função ou de endpoint.** O caminho seguro é:
>
> 1. Abram `ConfiguracoesPage.tsx` e vejam **de onde** ele pega os dados do usuário logado (normalmente algum "hook" tipo `useUsuarioLogado()` ou `useAuth()` — busquem por `use` no início de palavras dentro do arquivo).
> 2. Busquem no projeto inteiro (`Ctrl+Shift+F`) por termos como `senha`, `password` ou `trocarSenha` para achar a função que já existe para troca de senha (a issue confirma que "a API já existente" deve ser reaproveitada — **não criem uma nova**).
> 3. Se não acharem nada parecido em 15 minutos de busca, **parem e perguntem no grupo** o nome exato da função/hook antes de tentar adivinhar.

---

## Parte 4 — Montar a estrutura da tela (passo a passo do "esqueleto")

Mesmo sem saber os nomes exatos de funções do projeto, o **formato geral** de uma tela em React é sempre parecido. Sigam esta ordem dentro do arquivo `PerfilPage.tsx`:

1. No topo do arquivo, importem o que for necessário (copiem os imports parecidos de `ConfiguracoesPage.tsx`, trocando só o que for específico dela).
2. Criem uma função com o nome `PerfilPage` (mesmo nome do arquivo).
3. Dentro dela, busquem os dados do usuário logado usando o mesmo hook identificado na Parte 3.
4. No `return`, montem o HTML/JSX com:
   - Um título ("Meu Perfil")
   - Os três dados (nome, e-mail, papel) em texto simples
   - Um formulário com dois campos de senha (nova senha e confirmação) e um botão "Salvar"
5. No final do arquivo, exportem o componente: `export default PerfilPage;`

> Se vocês travarem no meio dessa parte e não souberem como continuar a estrutura, **copiem e colem o que já escreveram até agora numa mensagem para o grupo**, junto com a dúvida específica (ex: "não sei como montar o formulário de senha"). É mais rápido destravar assim do que tentar sozinho por horas.

---

## Parte 5 — Adicionar a rota (fazer a página existir de verdade)

Uma tela só fica acessível se tiver uma **rota** apontando para ela.

1. Abram `apps/web/src/app/routes.tsx`.
2. Usem `Ctrl+F` e busquem por `ConfiguracoesPage` (ou outra tela parecida) para ver como uma rota existente é escrita ali.
3. Copiem o padrão encontrado e adaptem para a nova tela, seguindo a mesma estrutura, trocando:
   - O caminho (ex: `/perfil`)
   - O nome do componente importado (`PerfilPage`)
4. No topo do arquivo `routes.tsx`, adicionem também o `import` do novo componente:

```
import PerfilPage from "../features/perfil/PerfilPage";
```

> Ajustem o caminho do import de acordo com onde o `routes.tsx` está localizado em relação à pasta `perfil` — se dor dúvida, comparem com outro import já existente no mesmo arquivo que aponte para dentro de `features/`.

5. Salvem: `Ctrl+S`.

---

## Parte 6 — Adicionar o link no menu de usuário

1. Abram `apps/web/src/components/layout/UserMenu.tsx`.
2. Vejam como os itens do menu já existentes estão escritos (procurem algo como um link ou botão que leva para "Configurações").
3. Copiem esse padrão e adaptem: texto **"Meu Perfil"**, apontando para a rota `/perfil` criada na Parte 5.
4. Salvem: `Ctrl+S`.

---

## Parte 7 — Testar

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Aperte Enter e aguardem.

> Se aparecer erro em vermelho, é provável que seja em um destes pontos: nome de import errado, caminho de arquivo errado, ou chave/parêntese faltando. Revisem com calma cada arquivo alterado (`PerfilPage.tsx`, `routes.tsx`, `UserMenu.tsx`). Se não resolverem em 15 minutos, tirem print do erro e mandem para o grupo.

4. Se o projeto tiver um jeito de rodar localmente (perguntem ao José/Max se há um comando tipo `pnpm --filter web dev`), abram a tela pelo navegador, cliquem no menu de usuário, cliquem em "Meu Perfil" e confiram visualmente se os três dados aparecem e se dá para tentar trocar a senha.

5. Testem também o **critério de aceite da senha**: tentem salvar uma senha com menos de 8 caracteres e confirmem que o sistema recusa (não é pra deixar salvar).

---

## Parte 8 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Passem o mouse sobre o nome do projeto e cliquem no **"+"** para marcar todos os arquivos alterados/criados (`PerfilPage.tsx`, `routes.tsx`, `UserMenu.tsx`).
3. Mensagem de commit:

```
feat(FE-08): cria tela Meu Perfil com troca de senha
```

4. Cliquem em **"Commit"** e depois **"Sync Changes"**.

> Se pedir para criar branch antes: cliquem em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-08-tela-meu-perfil`

---

## Parte 9 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"** (ou "Pull requests" → "New pull request", escolhendo a branch `fe-08-tela-meu-perfil`).
3. Título: `FE-08: cria tela Meu Perfil com troca de senha`
4. Descrição: expliquem o que foi feito, mencionando qual hook/API de troca de senha vocês encontraram e reutilizaram.
5. Em **"Reviewers"**, selecionem **José**.
6. Cliquem em **"Create pull request"**.

---

**Como é trabalho em dupla:** se um de vocês fizer a Parte 3-4 (a tela) e o outro a Parte 5-6 (rota e menu), lembrem de sincronizar (`push`/`pull`) antes de mexer nos mesmos arquivos, para não sobrescrever o trabalho um do outro. Em caso de dúvida sobre isso, chamem o grupo — **não tentem resolver conflito de código sozinhos**.
