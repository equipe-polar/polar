# Guia Passo a Passo — Issue FE-03
### Formatar data e hora do histórico da ocorrência

**Projeto:** P.O.L.A.R.
**Responsável:** Pietro
**Validador:** José
**Prazo:** 5 dias
**Esforço:** P
**Arquivos a alterar:**
- `apps/web/src/features/ocorrencias/DetalheOcorrenciaPage.tsx`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código antes. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o Pietro/José no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Hoje, na tela de detalhe de uma ocorrência, o histórico mostra a data em um formato difícil de ler, como `2026-08-14T13:05:00.000Z`. Sua tarefa é fazer essa data aparecer no formato brasileiro: `dd/mm/aaaa hh:mm`.

### Bloco pronto de implementação

No arquivo `apps/web/src/features/ocorrencias/DetalheOcorrenciaPage.tsx`, procure o trecho onde a data do histórico é renderizada e troque a expressão por esta:

```tsx
{new Date(item.criadoEm).toLocaleString('pt-BR')}
```

Se o campo não se chamar `item.criadoEm`, use o nome real do campo encontrado no arquivo, mas mantenha a mesma ideia: transformar a data em objeto `Date` e formatar com `toLocaleString('pt-BR')`.

> A regra aqui é simples: **não mostrar o valor bruto da data em ISO**; exibir a data e a hora em horário brasileiro, com dia, mês, ano, hora e minuto.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com a sua conta pessoal do GitHub, já vinculada à organização `equipe-polar`.
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

> Se o Codespace não abrir, confirme se a conta certa está logada. Se aparecer aviso de limite de horas, avise o grupo antes de mexer em qualquer configuração.

---

## Parte 2 — Encontrar o lugar certo no código

1. No Explorer, clique no ícone de lupa (**Search**) ou use `Ctrl+Shift+F`.
2. Digite `criadoEm` e aperte Enter.
3. Abra o arquivo `apps/web/src/features/ocorrencias/DetalheOcorrenciaPage.tsx`.
4. Dentro dele, use `Ctrl+F` e procure novamente por `criadoEm`.
5. Localize o trecho do histórico que mostra a data — normalmente algo como `{item.criadoEm}` dentro de JSX.
6. Se houver mais de um uso, escolha o que está dentro do bloco do histórico da ocorrência.

> Não invente nomes de variável. Use exatamente o campo encontrado no código, por exemplo `item.criadoEm`, `h.criadoEm`, `evento.criadoEm` ou o nome que estiver no arquivo real.

---

## Parte 3 — Fazer a alteração

1. Localize o trecho que hoje mostra a data em bruto.
2. Troque a expressão por:

```tsx
{new Date(item.criadoEm).toLocaleString('pt-BR')}
```

3. Se o campo tiver outro nome, mantenha a mesma lógica:

```tsx
{new Date(historico.criadoEm).toLocaleString('pt-BR')}
```

4. O que muda na prática:
   - `new Date(...)` transforma o texto em objeto de data.
   - `.toLocaleString('pt-BR')` formata em `dd/mm/aaaa, hh:mm` (em português do Brasil).
5. Salve o arquivo com `Ctrl+S`.

---

## Parte 4 — Testar se não quebrou nada

1. Abra o terminal: **"Terminal"** → **"New Terminal"**.
2. Digite:

```bash
pnpm --filter web build
```

3. Aperte Enter e aguarde o build terminar.

### Como saber se deu certo

- Se o terminal terminar sem erro e mostrar sucesso do build, a alteração está correta.
- Se aparecer erro em vermelho, volte ao trecho e confira:
  - aspas simples ou duplas corretas;
  - o nome do campo usado no arquivo;
  - presença de chaves `{}` e parênteses `()` corretamente fechados.

> Se o erro persistir por mais de 10 minutos, tire um print do terminal e chame o Pietro/José antes de continuar.

---

## Parte 5 — Enviar o trabalho

1. Clique no ícone de **Source Control** na barra lateral esquerda.
2. Marque o arquivo `DetalheOcorrenciaPage.tsx`.
3. No campo de mensagem do commit, escreva:

```bash
fix(FE-03): formata data do historico em pt-BR
```

4. Clique em **"Commit"** e depois em **"Sync Changes"** ou **"Push"** se o VS Code pedir.

> Se o VS Code pedir para criar uma branch antes: clique em `master` no canto inferior esquerdo → **"Create new branch"** → nome: `fe-03-formatar-data`.

---

## Parte 6 — Abrir o Pull Request

1. Volte para a aba do GitHub do projeto.
2. Clique em **"Compare & pull request"**.
3. Título:

```text
FE-03: formata data do historico em pt-BR
```

4. Descrição curta: explique que a data do histórico foi formatada para o padrão brasileiro via `toLocaleString('pt-BR')`.
5. Em **Reviewers**, selecione **José**.
6. Clique em **"Create pull request"**.

---

**Critério de aceite desta issue:** a data do histórico deve aparecer em formato legível para o usuário, em português do Brasil, sem quebrar o build do frontend.