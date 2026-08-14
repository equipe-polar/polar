# Guia Passo a Passo — Issue IA-01
### Verificação de termos inadequados nas descrições de ocorrência

**Projeto:** P.O.L.A.R.
**Responsável:** Ana Beatriz
**Validador:** Ana
**Prazo:** A definir
**Esforço:** M
**Arquivos envolvidos:**
- `apps/api/src/modules/ocorrencias/`
- `apps/web/src/features/ocorrencias/`
- Arquivo ou configuração de termos de moderação (**novo**)

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame a Ana no grupo** antes de continuar.

---

## O que você vai fazer, em uma frase

Quando alguém digita a descrição de uma ocorrência usando termos ofensivos ou inadequados, o sistema deve **avisar** a pessoa e **sugerir** uma forma alternativa de escrever — mas **sem trocar o texto sozinho**: quem decide se aceita a sugestão continua sendo a pessoa que está escrevendo.

### Bloco pronto de implementação

Crie o arquivo de termos em `apps/api/src/modules/ocorrencias/termos-moderacao.json` e valide no backend antes de salvar a ocorrência.

```json
{
  "termos": [
    "ofensa",
    "insulto",
    "ameaça",
    "palavrão"
  ],
  "sugestaoGenerica": "Considere reescrever a descrição com um tom mais objetivo e respeitoso."
}
```

```ts
// apps/api/src/modules/ocorrencias/ocorrencias.service.ts
import termosModeracao from './termos-moderacao.json';

export function validarDescricaoComModeracao(texto: string) {
  const normalized = texto.toLowerCase();
  const encontrou = termosModeracao.termos.find((termo) => normalized.includes(termo.toLowerCase()));

  if (!encontrou) {
    return null;
  }

  return {
    motivo: `Termo potencialmente inadequado: "${encontrou}"`,
    sugestao: termosModeracao.sugestaoGenerica,
  };
}
```

```tsx
// apps/web/src/features/ocorrencias/RegistroOcorrenciaForm.tsx
const aviso = await api.post('/ocorrencias/validar-descricao', { descricao: form.descricao });

if (aviso.data?.alerta) {
  setModalSugestao({
    aberto: true,
    motivo: aviso.data.alerta.motivo,
    sugestao: aviso.data.alerta.sugestao,
  });
}
```

> O texto deve ser alterado apenas após a ação explícita do usuário: clicar em "Usar sugestão" ou "Manter meu texto".

---

## ⚠️ Aviso importante: definição do escopo antes de codar

Esta issue tem uma decisão de conteúdo/segurança que **precisa vir de fora do código**, definida junto com a Ana e a coordenação:

- **A lista de termos considerados inadequados** — não é algo para vocês criarem sozinhos. Termos mal escolhidos podem gerar problemas (falsos positivos bloqueando relatos legítimos, ou termos graves de verdade passando despercebidos).
- **Quem pode editar essa lista depois** — o critério de aceite exige que a lista "seja documentada e revisável pela equipe autorizada", ou seja, alguém vai precisar de um jeito de atualizar isso sem depender de um novo Pull Request toda vez.

**Ação recomendada:** conversem com a Ana sobre esses dois pontos antes da Parte 3. Enquanto isso, adiantem as Partes 1 e 2.

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
2. Abram o arquivo do formulário de registro de ocorrência e localizem o campo de texto livre onde a descrição é digitada.
3. Verifiquem se já existe alguma validação nesse campo (ex: tamanho mínimo/máximo) — se sim, esse é o lugar natural para "encaixar" a nova verificação.

> Não tenho acesso ao conteúdo atual desse arquivo — este passo de leitura é essencial antes de decidir onde inserir a nova lógica.

---

## Parte 3 — Criar o arquivo de termos de moderação

**Só façam isto depois de ter a lista aprovada pela Ana (ver aviso do início).**

1. Decidam, com a Ana, um formato simples de armazenar a lista — o mais simples para começar é um arquivo JSON dentro do backend, por exemplo em `apps/api/src/modules/ocorrencias/termos-moderacao.json`:

```json
{
  "termos": [
    "exemplo-termo-1",
    "exemplo-termo-2"
  ],
  "sugestaoGenerica": "Considere revisar o texto para manter um tom respeitoso e descritivo dos fatos."
}
```

> **Os valores acima são só um exemplo de formato** — a lista real de termos deve vir da Ana/coordenação, não deve ser inventada por quem está implementando.

2. Guardem esse arquivo em um lugar fácil de encontrar e editar depois, já que ele será atualizado com frequência (diferente da maior parte do código do projeto).

---

## Parte 4 — Backend: verificar o texto contra a lista

1. Em `apps/api/src/modules/ocorrencias/`, localizem onde a criação de uma ocorrência acontece.
2. Antes de salvar a ocorrência, adicionem uma verificação: o texto da descrição contém algum termo da lista criada na Parte 3?
   - Uma forma simples (não a única, mas boa para começar): verificar se o texto da descrição, em letras minúsculas, contém alguma das palavras da lista, também em minúsculas.
3. **Importante:** essa verificação deve **avisar**, não **bloquear silenciosamente** nem **alterar** o texto sozinha. O fluxo correto é:
   - Se encontrar um termo da lista → devolver para o frontend um aviso, junto com a sugestão de texto alternativo (pode ser a sugestão genérica do arquivo, ou algo mais elaborado, dependendo do que for definido com a Ana).
   - A pessoa que está escrevendo decide se ajusta o texto ou confirma o envio mesmo assim.
4. Não façam essa verificação **impedir** o envio da ocorrência de forma definitiva — o critério de aceite fala em "alertar" e "sugerir", preservando "a possibilidade de revisão humana antes do envio", não em bloquear.

> Se tiverem dúvida sobre se a verificação deve ser **totalmente bloqueante** ou apenas um **aviso que pode ser ignorado**, tirem essa dúvida com a Ana antes de implementar — é uma decisão sensível.

---

## Parte 5 — Frontend: mostrar o aviso e a sugestão

1. No formulário de ocorrência (identificado na Parte 2), depois que a pessoa tentar enviar (ou, se preferirem, enquanto digita — combinem isso com a Ana também, já que muda a experiência), chamem o backend para verificar o texto.
2. Se vier um aviso, mostrem para a pessoa: o motivo do aviso e a sugestão de texto alternativo, com dois botões claros: **"Usar sugestão"** (substitui o texto no campo, mas a pessoa ainda pode editar depois) e **"Manter meu texto"** (fecha o aviso e permite enviar como estava).
3. Em nenhum momento o texto deve ser trocado **sem a pessoa clicar em algo** — isso é explícito no critério de aceite.

---

## Parte 6 — Documentar a lista e as regras

O critério de aceite exige que **"a lista de termos e as regras de tratamento são documentadas e revisáveis pela equipe autorizada."**

1. Criem um arquivo curto de documentação (pode ser dentro de `docs/`, seguindo o padrão de outros documentos do projeto, como visto na FE-07 e na BE-05) explicando:
   - Onde a lista de termos fica salva (o arquivo da Parte 3).
   - Como alguém autorizado pode atualizar essa lista.
   - Qual é o comportamento do sistema quando um termo é encontrado (aviso, não bloqueio).

---

## Parte 7 — Testar

1. Se o projeto tiver como rodar localmente, testem digitando uma descrição de ocorrência com um termo da lista de teste e confirmem que o aviso aparece com a sugestão.
2. Confirmem que **clicar em "Manter meu texto"** permite enviar normalmente, sem nenhuma alteração no texto original.
3. Confirmem que **clicar em "Usar sugestão"** só troca o texto depois da ação explícita da pessoa, nunca automaticamente.
4. Testem também uma descrição sem nenhum termo da lista, e confirmem que nenhum aviso aparece.

---

## Parte 8 — Rodar o build

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

## Parte 9 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados/criados (backend, frontend, arquivo de termos e documentação).
3. Mensagem de commit:

```
feat(IA-01): adiciona verificacao de termos inadequados na descricao
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `ia-01-moderacao-descricao`

---

## Parte 10 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `IA-01: adiciona verificacao de termos inadequados na descricao`
4. Descrição: confirmem que a lista de termos foi aprovada pela Ana, e expliquem como a documentação da Parte 6 explica o processo de atualização da lista.
5. Em **"Reviewers"**, selecionem **Ana**.
6. Cliquem em **"Create pull request"**.
