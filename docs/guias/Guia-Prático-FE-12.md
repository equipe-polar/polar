# Guia Passo a Passo — Issue FE-12
### Cores de gravidade nas ocorrências

**Projeto:** P.O.L.A.R.
**Responsável:** Gustavo
**Validador:** José
**Prazo:** A definir
**Esforço:** P
**Arquivos envolvidos:**
- `apps/web/src/features/ocorrencias/`
- `apps/web/src/styles/tokens.css`
- `apps/web/src/styles/globals.css`

> **Nota:** o arquivo original desta issue tem a seção "Arquivos envolvidos" com o título cortado ("Arqui"), mas o conteúdo da lista está completo — segui exatamente o que está listado, sem inventar arquivos adicionais.

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o José no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Fazer as ocorrências mostrarem uma cor de acordo com a gravidade — **verde** (baixa), **amarelo** (moderada/neutra), **vermelho** (grave) e **preto** (urgência) — sempre acompanhada do **texto** da classificação (nunca só a cor sozinha, para não excluir quem não distingue cores).

### Bloco pronto de implementação

Centralize o mapeamento da gravidade em `domain.ts` ou em um helper do frontend:

```ts
export const GRAVIDADE_CONFIG = {
  baixa: { label: 'Baixa', cor: 'var(--cor-verde)' },
  moderada: { label: 'Moderada', cor: 'var(--cor-amarelo)' },
  grave: { label: 'Grave', cor: 'var(--cor-vermelho)' },
  urgente: { label: 'Urgente', cor: 'var(--cor-preto)' },
} as const;
```

Uso na tela:

```tsx
const config = GRAVIDADE_CONFIG[item.gravidade];

return (
  <span className="gravidade-badge" style={{ backgroundColor: config.cor }}>
    {config.label}
  </span>
);
```

```css
.gravidade-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  color: white;
}
```

> Para urgência, adicione também um ícone ou um texto explícito em destaque para diferenciar do grave além da cor.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Entender como a gravidade já é tratada hoje

1. No **Explorer**, use `Ctrl+Shift+F` e busque por `gravidade` — deve levar aos lugares (lista de ocorrências e tela de detalhe) onde essa informação já é usada de alguma forma hoje.
2. Confiram se já existe alguma indicação visual de gravidade hoje (mesmo que incompleta ou só com cor, sem texto — que é justamente o problema que esta issue corrige, segundo o critério de aceite: "a prioridade não é inferida apenas pela cor exibida").
3. Abram `apps/web/src/styles/tokens.css` e usem `Ctrl+F` para buscar por `color` ou `cor` — esse arquivo, pelo nome ("tokens"), provavelmente já define variáveis de cor padronizadas do sistema (ex: `--cor-verde`, `--cor-erro`). **Reaproveitem essas variáveis já existentes em vez de inventar cores novas soltas**, para manter consistência visual com o resto do sistema.

> **Importante:** não tenho acesso ao conteúdo atual desses arquivos, então não posso indicar os nomes exatos das variáveis de cor já existentes. Este passo de leitura não é opcional.

---

## Parte 3 — Definir a estrutura de classificação

Antes de mexer em CSS, é preciso ter clareza de como o dado de gravidade chega no front-end:

1. Verifiquem (voltando à busca da Parte 2) se a ocorrência já tem um campo de gravidade salvo (ex: `gravidade: "baixa" | "moderada" | "grave" | "urgente"`) vindo do backend.
2. **Se já existir esse campo** → sigam para a Parte 4.
3. **Se não existir** → esta issue pode depender de um campo novo no backend (parecido com a situação da FE-05/BE-05, sobre prioridade). Antes de seguir, confirmem com o grupo se gravidade e prioridade são o mesmo conceito no sistema ou coisas diferentes — **não assumam sozinhos**, para não duplicar o trabalho de outra issue.

---

## Parte 4 — Criar o mapeamento de gravidade → cor e texto

A boa prática aqui é centralizar essa lógica em **um lugar só**, para não repetir a mesma decisão de cor em vários arquivos diferentes.

1. Verifiquem se já existe um arquivo parecido com `apps/web/src/services/domain.ts` (usado em outras issues, como a FE-11) onde listas/mapeamentos fixos costumam ficar. Se existir, é um bom lugar para adicionar este mapeamento também.
2. O formato geral seria parecido com:

```ts
export const GRAVIDADE_CONFIG = {
  baixa: { label: "Baixa", cor: "var(--cor-verde)" },
  moderada: { label: "Moderada", cor: "var(--cor-amarelo)" },
  grave: { label: "Grave", cor: "var(--cor-vermelho)" },
  urgente: { label: "Urgente", cor: "var(--cor-preto)" },
} as const;
```

> Os nomes das variáveis CSS (`var(--cor-verde)` etc.) são só um exemplo — usem os nomes reais encontrados em `tokens.css` na Parte 2. **Não inventem valores de cor em hexadecimal soltos no meio do código** — o objetivo de usar variáveis é manter tudo consistente e fácil de ajustar depois num lugar só.

---

## Parte 5 — Aplicar nas listas e no detalhe

1. Nos arquivos de lista de ocorrências e de detalhe (dentro de `apps/web/src/features/ocorrencias/`), localizem onde a gravidade é ou deveria ser exibida.
2. Usando o mapeamento criado na Parte 4, exibam **sempre juntos**: uma marcação visual de cor (ex: uma bolinha colorida, uma borda lateral colorida, ou um "badge") **e** o texto da classificação (ex: "Grave").
3. **Atenção especial ao caso "Urgente":** o critério de aceite pede que urgência seja **distinguível de grave também por texto e ícone ou marcador equivalente**, não só pela cor preta. Adicionem, por exemplo, um ícone de alerta ao lado do texto "Urgente", além da cor.

---

## Parte 6 — Adicionar os estilos no CSS

1. Em `apps/web/src/styles/globals.css` (ou `tokens.css`, dependendo de onde as variáveis de cor foram definidas na Parte 2), adicionem as classes CSS necessárias para os elementos visuais criados na Parte 5 (ex: a "bolinha" colorida, o "badge").
2. Usem as variáveis de cor já existentes (`var(--...)`), nunca cores soltas.
3. Salvem todos os arquivos alterados: `Ctrl+S`.

---

## Parte 7 — Testar

1. Se o projeto tiver como rodar localmente, abram a lista de ocorrências e o detalhe de uma ocorrência de cada gravidade (se houver dados de teste com gravidades diferentes).
2. Confirmem visualmente que cor + texto aparecem sempre juntos, nunca só a cor sozinha.
3. Confirmem que "Urgente" e "Grave" são visualmente diferentes um do outro além da cor (ícone, texto, etc.).

---

## Parte 8 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. Aperte Enter e aguardem.

> Se der erro, revisem os imports do mapeamento criado na Parte 4 e os nomes das variáveis CSS usadas. Se não resolverem em 15 minutos, print do erro para o grupo.

---

## Parte 9 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados.
3. Mensagem de commit:

```
feat(FE-12): adiciona indicacao visual de gravidade com cor e texto
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `fe-12-cores-gravidade`

---

## Parte 10 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `FE-12: adiciona indicacao visual de gravidade com cor e texto`
4. Descrição: expliquem como o caso "Urgente" foi diferenciado do "Grave" além da cor.
5. Em **"Reviewers"**, selecionem **José**.
6. Cliquem em **"Create pull request"**.
