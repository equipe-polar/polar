# Guia Passo a Passo — Issue FE-06
### Adicionar o favicon do POLAR

**Projeto:** P.O.L.A.R.
**Responsável:** Kauã
**Validador:** José
**Prazo:** A definir
**Arquivos envolvidos:**
- `apps/web/index.html`
- `apps/web/public/` (se necessário)
- Arquivo de origem: `apps/web/src/assets/logo-polar.svg`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o José no grupo** antes de continuar. Esta é a issue mais simples da lista até agora — bom ponto de partida se for a sua primeira tarefa no projeto.

---

## O que você vai fazer, em uma frase

Fazer o logo do POLAR aparecer na aba do navegador (aquele iconezinho pequeno ao lado do título da página), usando a imagem que já existe em `logo-polar.svg`.

### Bloco pronto de implementação

No `apps/web/index.html`, dentro do `<head>`, insira:

```html
<link rel="icon" type="image/svg+xml" href="/logo-polar.svg" />
```

Se o SVG estiver em `src/assets/logo-polar.svg`, copie para `apps/web/public/logo-polar.svg` primeiro. O caminho do arquivo deve ser sempre raiz do site (`/logo-polar.svg`), nunca caminho relativo de `src/`.

```bash
# exemplo de pasta correta
apps/web/
  public/
    logo-polar.svg
```

> Se o favicon não atualizar, limpe o cache do navegador com `Ctrl+Shift+R` e confirme que o arquivo foi colado na pasta `public`.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Confirmar que a imagem existe e como ela está

1. No **Explorer** (ícone de pastas, lado esquerdo), naveguem até `apps/web/src/assets/`.
2. Confirmem que existe um arquivo chamado `logo-polar.svg` ali. Cliquem nele — o VS Code deve mostrar uma prévia visual do SVG (a imagem em si).
3. Anotem o caminho completo: `src/assets/logo-polar.svg` (vocês vão precisar dele daqui a pouco).

> Se o arquivo não existir com esse nome exato, **parem e avisem o grupo** — pode ter sido renomeado ou movido, e usar um nome errado no próximo passo vai gerar um ícone quebrado (aquele ícone de "página não encontrada" no lugar do favicon).

---

## Parte 3 — Adicionar a referência ao favicon no HTML

1. Abram o arquivo `apps/web/index.html` (fica na raiz da pasta `apps/web/`, não dentro de `src/`).
2. Usem `Ctrl+F` e busquem por `<head>` — é a seção do arquivo onde ficam configurações da página (título, ícones, etc.), diferente do `<body>`, que é o conteúdo visível.
3. Dentro da seção `<head>`, procurem se já existe uma linha parecida com esta (pode já existir apontando para outro ícone padrão, tipo `vite.svg`):

```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
```

4. **Se já existir uma linha assim:** troquem o valor de `href` para apontar para o logo do POLAR. Como o arquivo está dentro de `src/assets/`, e não direto na pasta pública, geralmente é necessário primeiro copiá-lo (ou movê-lo) para dentro da pasta `apps/web/public/` para que o navegador consiga acessá-lo diretamente pelo caminho `/logo-polar.svg`. Veja a Parte 4 antes de decidir.

5. **Se não existir nenhuma linha de favicon:** vocês vão adicionar uma nova linha, dentro do `<head>`, seguindo o mesmo formato do exemplo acima, trocando o `href` pelo caminho correto do logo do POLAR (decidido na Parte 4).

---

## Parte 4 — Decidir o caminho certo do arquivo

Em projetos como este (usando Vite, que é comum em projetos `apps/web` com esse tipo de estrutura), existem duas formas de referenciar uma imagem no `index.html`:

### Opção A — Copiar o SVG para a pasta `public/`
- A pasta `apps/web/public/` é especial: tudo que está lá dentro fica disponível direto pela raiz do site (ex: um arquivo em `public/logo-polar.svg` fica acessível em `/logo-polar.svg`).
- **Passo a passo:**
  1. Cliquem com o botão direito em `logo-polar.svg` (dentro de `src/assets/`) → **"Copy"**.
  2. Naveguem até a pasta `apps/web/public/` (criem essa pasta se ela não existir: botão direito em `apps/web` → **"New Folder"** → nome `public`).
  3. Clique com o botão direito dentro da pasta `public/` → **"Paste"**.
  4. No `index.html`, usem: `<link rel="icon" type="image/svg+xml" href="/logo-polar.svg" />`

### Opção B — Referenciar direto de dentro de `src/assets/`
- Alguns projetos Vite conseguem referenciar arquivos de `src/` diretamente no HTML usando um caminho relativo, mas isso costuma exigir configuração extra e é mais propenso a dar erro para quem está começando agora.
- **Recomendação:** usem a **Opção A** (copiar para `public/`) — é o caminho mais simples e com menos chance de erro.

---

## Parte 5 — Salvar e testar visualmente

1. Salvem o arquivo `index.html`: `Ctrl+S`.
2. Se o projeto tiver como rodar localmente (perguntem o comando ao grupo, provavelmente `pnpm --filter web dev`), rodem e abram a tela no navegador.
3. Olhem a aba do navegador onde a página abriu: o ícone pequeno ao lado do título deve ser o logo do POLAR, não mais o ícone padrão (geralmente um raio, se for Vite).
4. Se o ícone não mudar mesmo depois de recarregar a página, tentem um recarregamento "forçado" (no Chrome/Edge: `Ctrl+Shift+R`), porque o navegador às vezes guarda o ícone antigo em cache.

---

## Parte 6 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Aperte Enter e aguardem.

> Se der erro, o mais provável é o caminho do arquivo estar escrito errado no `href` (letra maiúscula/minúscula errada, barra faltando). Revisem com calma comparando com o nome exato do arquivo na Parte 2. Se não resolverem em 15 minutos, print do erro para o grupo.

---

## Parte 7 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Passem o mouse sobre o nome do projeto e clique no **"+"** para marcar `index.html` e o novo arquivo dentro de `public/`.
3. Mensagem de commit:

```
feat(FE-06): adiciona favicon do POLAR
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-06-favicon`

---

## Parte 8 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-06: adiciona favicon do POLAR`
4. Descrição: mencionem qual opção (A ou B da Parte 4) foi usada.
5. Em **"Reviewers"**, selecionem **José**.
6. Cliquem em **"Create pull request"**.

---

> **Nota sobre o cabeçalho da issue:** o texto original do critério de aceite desta issue (copiado do arquivo enviado) parece ser um erro de cópia — ele menciona formatação de data em vez de favicon. Segui o "O quê?" e os "Arquivos envolvidos" da issue, que são claros sobre o favicon. Vale confirmar com o José se o critério de aceite oficial é mesmo só "o ícone aparece corretamente na aba do navegador e o build passa sem erros".
