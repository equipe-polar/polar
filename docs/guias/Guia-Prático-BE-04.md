# Guia Passo a Passo — Issue BE-05
### Níveis de prioridade das ocorrências

**Projeto:** P.O.L.A.R.
**Responsável:** Max e Felipe.
**Validador:** Max
**Prazo:** A definir
**Esforço:** M
**Arquivos envolvidos:**
- `database/schema.sql`
- `apps/api/src/modules/ocorrencias/`
- `apps/web/src/features/ocorrencias/`
- `apps/web/src/services/domain.ts`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o Max no grupo** antes de continuar.

---

## ⚠️ Aviso: esta issue tem uma dependência direta com a FE-12

Reparem que a **FE-12** (cores de gravidade) e esta **BE-05** (prioridade) tratam de conceitos muito parecidos — a FE-12 já tem um alerta pedindo para confirmar se "gravidade" e "prioridade" são a mesma coisa no sistema ou coisas diferentes.

**Antes de qualquer código, confirmem com o Max:**
- Prioridade e gravidade são **o mesmo campo** (e a FE-12 e a BE-05 são, na prática, a mesma funcionalidade vista de dois ângulos)?
- Ou são **conceitos diferentes** (ex: gravidade = quão grave é o fato relatado; prioridade = qual a urgência de tratamento, que pode depender de outros fatores além da gravidade)?

Isso muda completamente a implementação e evita que duas pessoas construam a mesma coisa duas vezes com nomes diferentes.

---

## O que você vai fazer, em uma frase

Definir e salvar níveis de prioridade para as ocorrências (aprovados pela coordenação), permitir que o formulário selecione uma prioridade válida, e permitir ordenar/filtrar as listagens por prioridade — sempre com o texto do nível visível, nunca só inferido pela cor.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Definir os níveis de prioridade (aprovação da coordenação)

Assim como em outras issues desta leva, **os níveis exatos de prioridade e sua relação com a gravidade precisam ser aprovados pela coordenação** — isso está escrito explicitamente no critério de aceite. Não é uma decisão técnica.

**Ação recomendada:** peçam ao Max a lista oficial de níveis (ex: "Baixa", "Média", "Alta", "Urgente" — **isto é só um exemplo**) e a documentação de quando usar cada um, antes da Parte 4. Enquanto isso não chega, adiantem as Partes 3.

---

## Parte 3 — Entender a estrutura atual de ocorrências

1. No **Explorer**, abram `database/schema.sql` e localizem a tabela de ocorrências.
2. Verifiquem se já existe alguma coluna relacionada a prioridade ou gravidade (lembrando do aviso do início — pode já existir por causa da FE-12).
3. Abram `apps/web/src/services/domain.ts` e busquem (`Ctrl+F`) por listas fixas parecidas já existentes, para usar como padrão.

> Não tenho acesso ao conteúdo atual desses arquivos — esta leitura é essencial antes de decidir se é preciso criar algo novo ou reaproveitar o que já existe da FE-12.

---

## Parte 4 — Banco de dados: persistir a prioridade

**Só façam isto depois de confirmar com o Max se prioridade e gravidade são a mesma coisa (aviso do início) e com os níveis aprovados pela coordenação (Parte 2).**

1. Se prioridade for um campo **separado** de gravidade, adicionem uma nova coluna na tabela de ocorrências em `database/schema.sql`, seguindo o padrão de outras colunas com valores restritos (como sugerido na BE-02, com `CHECK`):

```sql
prioridade VARCHAR(20) NOT NULL CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
```

> Os valores exatos (`'baixa'`, `'media'`, etc.) devem ser os aprovados pela coordenação, não os deste exemplo.

2. Se já existir uma coluna criada pela FE-12 para o mesmo propósito, **reaproveitem ela** em vez de criar uma nova — confirmem isso com quem trabalhou na FE-12 ou com o Max.

---

## Parte 5 — Backend: validar e salvar a prioridade

1. Em `apps/api/src/modules/ocorrencias/`, localizem onde uma ocorrência é criada/atualizada.
2. Garantam que a prioridade recebida é validada contra a lista de valores permitidos (não confiem só na validação do banco — validem também no backend, com uma mensagem de erro clara se vier um valor inválido).

---

## Parte 6 — Frontend: campo de seleção no formulário

1. Em `apps/web/src/features/ocorrencias/`, localizem o formulário de registro/edição de ocorrência.
2. Adicionem (ou reaproveitem, se a FE-12 já tiver criado algo parecido) um campo de seleção com os níveis de prioridade aprovados, usando `domain.ts` para centralizar a lista (mesmo padrão sugerido em outras issues desta leva, como a FE-11).

---

## Parte 7 — Frontend: ordenar e filtrar por prioridade

1. Nas listagens de ocorrências (`apps/web/src/features/ocorrencias/`), localizem onde já existem outros filtros/ordenações (ex: por bimestre, se a BE-02 já estiver pronta, ou por turma).
2. Sigam o mesmo padrão para adicionar a opção de ordenar a lista por prioridade (do mais urgente para o menos, ou vice-versa) e/ou filtrar mostrando só um nível específico.

---

## Parte 8 — Documentar quando usar cada nível

O critério de aceite pede explicitamente que **"a documentação explica quando utilizar cada nível."**

1. Criem (ou peçam ajuda para localizar, se já existir) um arquivo de documentação dentro da pasta `docs/` do projeto (parecido com o `docs/frontend/guia-visual.md` usado na FE-07), explicando em texto simples quando cada nível de prioridade deve ser usado, conforme definido pela coordenação na Parte 2.
2. Isso não precisa ser extenso — um parágrafo curto por nível já atende ao critério, desde que reflita o que foi de fato aprovado.

---

## Parte 9 — Testar

1. Se o projeto tiver como rodar localmente, registrem ocorrências de teste com prioridades diferentes.
2. Testem a ordenação e o filtro por prioridade, confirmando que funcionam corretamente.
3. Confirmem visualmente que o texto do nível de prioridade aparece sempre, não só uma cor.

---

## Parte 10 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. E também (perguntem ao grupo se o comando é este):

```
pnpm --filter api build
```

> Se der erro, revisem os nomes de campos entre frontend, backend e banco. Se não resolverem em 20 minutos, print do erro para o grupo.

---

## Parte 11 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados/criados (banco, backend, frontend e documentação).
3. Mensagem de commit:

```
feat(BE-05): adiciona nivel de prioridade nas ocorrencias
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `be-05-prioridade-ocorrencias`

---

## Parte 12 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `BE-05: adiciona nivel de prioridade nas ocorrencias`
4. Descrição: confirmem explicitamente a relação (ou não) com o campo de gravidade da FE-12, os níveis usados e que foram aprovados pela coordenação.
5. Em **"Reviewers"**, selecionem **Max**.
6. Cliquem em **"Create pull request"**.
