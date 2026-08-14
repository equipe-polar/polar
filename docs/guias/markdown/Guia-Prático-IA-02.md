# Guia Passo a Passo — Issue IA-02
### Modelos de mensagem e sugestões de tom para ocorrências

**Projeto:** P.O.L.A.R.
**Responsável:** Ana Beatriz
**Validador:** Ana
**Prazo:** A definir
**Esforço:** M
**Arquivos envolvidos:**
- `apps/web/src/features/ocorrencias/`
- `apps/api/src/modules/ocorrencias/`
- Arquivo ou configuração de modelos de mensagem (**novo**)

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame a Ana no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Permitir que o professor, ao registrar uma ocorrência, escolha um **modelo de texto pronto** (editável) em vez de escrever do zero, e receba **sugestões de ajuste de tom** (mais profissional) antes de enviar — mas quem decide o texto final é sempre o professor, nunca o sistema sozinho.

### Bloco pronto de implementação

Arquivo JSON de modelos no backend:

```json
{
  "modelos": [
    {
      "id": "atraso",
      "titulo": "Atraso",
      "texto": "O aluno chegou atrasado à aula, sem justificativa apresentada até o momento."
    }
  ]
}
```

Endpoint simples:

```ts
router.get('/modelos-mensagem', async (_req, res) => {
  const modelos = await fs.promises.readFile('./src/modules/ocorrencias/modelos-mensagem.json', 'utf-8');
  return res.json(JSON.parse(modelos));
});
```

Frontend:

```tsx
const [modeloSelecionado, setModeloSelecionado] = useState('');

<select value={modeloSelecionado} onChange={(e) => {
  setModeloSelecionado(e.target.value);
  setDescricao(modelos.find((m) => m.id === e.target.value)?.texto ?? '');
}}>
  {modelos.map((modelo) => (
    <option key={modelo.id} value={modelo.id}>{modelo.titulo}</option>
  ))}
</select>
```

Sugestão de tom:

```tsx
const mostrarSugestao = texto.includes('muito');

if (mostrarSugestao) {
  setSugestao('Sugestão: reescreva com tom mais objetivo e profissional.');
}
```

> O texto só deve ser substituído após clique explícito do usuário em "Usar sugestão"; nunca aplica automaticamente.

---

## ⚠️ Aviso: esta issue tem sobreposição com a IA-01 — confirmem antes de começar

A **IA-01** (verificação de termos inadequados) e esta **IA-02** (modelos e sugestões de tom) mexem na mesma parte da tela (o campo de descrição da ocorrência) e têm um padrão de interação parecido (mostrar uma sugestão, sem trocar o texto sozinho).

**Antes de começar, confirmem com a Ana:**
- Se a IA-01 já foi feita (ou está sendo feita por outra pessoa), para não duplicar a lógica de "mostrar sugestão com botão de aceitar/recusar" — pode valer a pena reaproveitar o mesmo componente de interface para os dois casos.
- Se as duas issues devem aparecer juntas na mesma tela (ex: um único painel de "sugestões" que junta alerta de termo inadequado + sugestão de tom) ou separadas.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Entender o formulário de descrição hoje

1. No **Explorer**, usem `Ctrl+Shift+F` e busquem por `descricao` dentro de `apps/web/src/features/ocorrencias/`.
2. Abram o arquivo do formulário de registro de ocorrência e localizem o campo de texto livre.
3. **Se a IA-01 já tiver sido implementada**, vejam como o padrão de "aviso com sugestão" foi montado lá — reaproveitem esse mesmo componente visual aqui, só trocando o conteúdo (em vez de "termo inadequado", vira "sugestão de tom").

> Não tenho acesso ao conteúdo atual desse arquivo — este passo de leitura é essencial.

---

## Parte 3 — Definir os modelos de mensagem (conteúdo, não código)

Assim como em outras issues desta leva, **o conteúdo dos modelos de mensagem é uma decisão de coordenação/Ana, não uma decisão técnica.**

**Ação recomendada:** peçam à Ana pelo menos um modelo de texto pronto para começar (ex: um modelo para "atraso", um para "conflito entre alunos" — **isto é só um exemplo de estrutura**, o conteúdo real deve vir dela). O critério de aceite só exige "pelo menos um modelo editável" para já atender a issue, então não precisam esperar por uma lista enorme para começar a implementar.

---

## Parte 4 — Criar o arquivo de modelos de mensagem

1. Decidam, com a Ana, um formato simples para guardar os modelos. Por exemplo, um arquivo JSON em `apps/api/src/modules/ocorrencias/modelos-mensagem.json`:

```json
{
  "modelos": [
    {
      "id": "atraso",
      "titulo": "Atraso",
      "texto": "O aluno chegou atrasado à aula, sem justificativa apresentada até o momento."
    }
  ]
}
```

> Este é só um exemplo de formato — o texto real de cada modelo deve vir da Ana.

---

## Parte 5 — Backend: disponibilizar os modelos

1. Em `apps/api/src/modules/ocorrencias/`, criem (ou reaproveitem, se existir algo parecido de outra issue) um endpoint simples que devolve a lista de modelos do arquivo criado na Parte 4.
2. Não é necessário nada complexo aqui — é basicamente "ler o arquivo e devolver o conteúdo".

---

## Parte 6 — Frontend: selecionar um modelo

1. No formulário de ocorrência, adicionem uma forma de escolher um modelo (ex: uma lista suspensa com os títulos dos modelos, ou botões).
2. Ao escolher um modelo, o texto dele deve **preencher** o campo de descrição, mas continuar **editável** — a pessoa pode mudar qualquer parte depois.
3. O formulário também deve continuar aceitando texto totalmente livre, sem escolher nenhum modelo, para os casos que não se encaixam em nenhum modelo pronto.

---

## Parte 7 — Sugestões de tom profissional

Esta é a parte mais delicada tecnicamente, porque "sugerir ajuste de tom" pode significar coisas bem diferentes dependendo da abordagem escolhida:

### Opção A — Sugestões simples baseadas em regras (mais fácil de implementar)
- Uma lista de palavras/expressões informais e suas versões mais formais (parecido com o formato de termos da IA-01), com um mapeamento tipo "se encontrar X no texto, sugira trocar por Y".
- **Vantagem:** não depende de nenhum serviço externo, fácil de entender e revisar.

### Opção B — Sugestão gerada por um serviço de IA externo
- Enviar o texto digitado para um serviço externo de IA que reescreve num tom mais formal.
- **Isso envolve decisões sensíveis:** qual serviço usar, custo, e principalmente **enviar dados de alunos para um serviço de terceiros**, o que tem implicações de privacidade que precisam ser aprovadas antes, não decididas por quem está implementando.

> **Recomendação:** comecem pela **Opção A**, que é mais simples e não levanta questões de privacidade. Se o grupo decidir usar a Opção B, **isso precisa passar por aprovação explícita da Ana e possivelmente da coordenação antes de qualquer implementação**, por causa da privacidade dos dados dos alunos.

1. Sigam o mesmo padrão de interface da IA-01 (se já existir): ao detectar uma oportunidade de ajuste, mostrem a sugestão com dois botões claros — **"Usar sugestão"** e **"Manter meu texto"**.
2. Em nenhum momento o texto deve mudar sem uma ação explícita da pessoa.

---

## Parte 8 — Testar

1. Se o projeto tiver como rodar localmente, testem escolher um modelo e confirmem que o texto aparece no campo, editável.
2. Testem editar o texto depois de escolher um modelo, e confirmem que a edição funciona normalmente.
3. Testem o fluxo de sugestão de tom (Parte 7): digitem um texto que deveria gerar uma sugestão, confirmem que ela aparece, e que **só muda o texto se a pessoa clicar em "Usar sugestão"**.
4. Confirmem que o texto final salvo é exatamente o que estava no campo no momento do envio (o que o professor confirmou), não uma versão automática.

---

## Parte 9 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. E também (perguntem ao grupo se o comando é este):

```
pnpm --filter api build
```

> Se der erro, revisem os nomes de campos entre frontend e backend. Se não resolverem em 20 minutos, print do erro para o grupo.

---

## Parte 10 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados/criados (backend, frontend e arquivo de modelos).
3. Mensagem de commit:

```
feat(IA-02): adiciona modelos de mensagem e sugestao de tom nas ocorrencias
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `ia-02-modelos-tom-ocorrencias`

---

## Parte 11 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `IA-02: adiciona modelos de mensagem e sugestao de tom nas ocorrencias`
4. Descrição: confirmem qual opção (A ou B da Parte 7) foi usada e, se A, que nenhum dado foi enviado a serviços externos.
5. Em **"Reviewers"**, selecionem **Ana**.
6. Cliquem em **"Create pull request"**.

---

**Fim do lote de 18 issues enviadas.** Restam as 10 que não couberam no upload por limite de anexação — quando puder mandá-las (mesmo que em mais de uma mensagem), sigo com o mesmo processo.
