# Guia Passo a Passo — Issue BE-01
### Virada de ano letivo (criar turmas do novo ano a partir das atuais)

**Projeto:** P.O.L.A.R.
**Responsável:** Paulo & Cristhiano
**Validador:** Max
**Prazo:** A definir
**Esforço:** G (grande)
**Arquivos envolvidos:**
- `apps/api/src/modules/turmas/`
- `apps/api/src/modules/alunos/`
- `apps/web/src/features/turmas/TurmasPage.tsx`
- `apps/web/src/features/alunos/AlunosPage.tsx`
- `database/schema.sql` (se for necessário persistir o ano letivo)

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o Max no grupo** antes de continuar.
>
> **Aviso de tamanho e risco:** esta é a issue mais delicada da lista até agora — ela mexe em dados de **turmas e alunos**, envolve banco de dados, e o critério de aceite exige que **os dados do ano anterior continuem intactos**. É uma issue **G**, provavelmente não recomendada para quem está tendo o primeiro contato com o projeto. Se essa for sua primeira tarefa, converse com o grupo sobre começar por uma issue menor antes.

---

## O que você vai fazer, em uma frase

Criar um fluxo onde alguém com permissão de gestão consegue: copiar as turmas do ano atual para um novo ano letivo, ajustar o nome de cada turma (ex: de "2026 - 3º B" para "2027 - 3º B"), adicionar ou remover alunos de cada turma nova, e confirmar — tudo isso **sem apagar ou alterar** os dados e turmas do ano anterior.

### Bloco pronto de implementação

Use este padrão como referência para o endpoint que cria as turmas do novo ano. O código deve ir em `apps/api/src/modules/turmas/` dentro do arquivo que já cria turmas ou em um novo `copiarTurmasAnoService.ts`.

```ts
// apps/api/src/modules/turmas/copiarTurmasAnoService.ts
export async function copiarTurmasAnoService({ anoOrigem, anoDestino }: { anoOrigem: number; anoDestino: number }) {
  const turmasOrigem = await db.query(
    `SELECT * FROM turmas WHERE ano_letivo = $1 ORDER BY nome`,
    [anoOrigem]
  );

  const turmasNovas: any[] = [];

  for (const turma of turmasOrigem.rows) {
    const nomeNovo = turma.nome.replace(String(anoOrigem), String(anoDestino));

    const turmaNova = await db.query(
      `INSERT INTO turmas (nome, ano_letivo, professor_id, sala_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [nomeNovo, anoDestino, turma.professor_id, turma.sala_id]
    );

    const alunos = await db.query(
      `SELECT aluno_id FROM alunos_turmas WHERE turma_id = $1`,
      [turma.id]
    );

    for (const aluno of alunos.rows) {
      await db.query(
        `INSERT INTO alunos_turmas (aluno_id, turma_id) VALUES ($1, $2)`,
        [aluno.aluno_id, turmaNova.rows[0].id]
      );
    }

    turmasNovas.push(turmaNova.rows[0]);
  }

  return turmasNovas;
}
```

```ts
// apps/api/src/modules/turmas/turmas.routes.ts
router.post('/copiar-ano', async (req, res) => {
  const { anoOrigem, anoDestino } = req.body;

  if (!anoOrigem || !anoDestino) {
    return res.status(400).json({ message: 'anoOrigem e anoDestino são obrigatórios' });
  }

  const turmas = await copiarTurmasAnoService({ anoOrigem, anoDestino });
  return res.status(201).json({ turmas });
});
```

> Regra obrigatória: a criação das turmas novas deve sempre preservar a estrutura do ano antigo e nunca executar `DELETE`/`UPDATE` sobre `turmas` do ano de origem. A cópia deve ser incremental e sempre `INSERT`.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Entender a estrutura atual de turmas e alunos (não pular esta parte)

Como esta issue envolve criar dados novos sem afetar os antigos, é essencial entender **como o sistema hoje identifica uma turma e um ano letivo** antes de qualquer código.

1. No **Explorer**, abram `database/schema.sql`.
2. Usem `Ctrl+F` e busquem pela tabela de turmas (provavelmente `turmas` ou parecido).
3. Confiram: já existe uma coluna que representa o **ano letivo** dentro da tabela de turmas (ex: `ano`, `ano_letivo`)? Isso é fundamental — anotem o nome exato da coluna, se existir.
4. Busquem também a tabela que relaciona alunos com turmas (pode ser uma coluna direta em `alunos`, ou uma tabela separada tipo `matriculas` ou `alunos_turmas`).

> **Se não existir uma coluna de ano letivo:** essa é a primeira coisa que precisa ser adicionada ao banco, e é um passo delicado — **conversem com alguém do time de Banco de Dados (ver lista-membros) antes de alterar o `schema.sql` sozinhos**, para revisar o impacto dessa mudança em dados já existentes.

---

## Parte 3 — Backend: criar o endpoint de "copiar turmas para novo ano"

1. No **Explorer**, naveguem até `apps/api/src/modules/turmas/`.
2. Leiam os arquivos existentes para entender o padrão do projeto para criar novos endpoints (como uma turma normal é criada hoje — isso serve de referência).
3. A lógica geral que este novo endpoint precisa ter, em passos:
   - Recebe: o ano letivo de origem (atual) e o ano letivo de destino (novo).
   - Para cada turma do ano de origem: cria uma **turma nova** no ano de destino, com o nome ajustado (ex: trocando o ano no início do nome).
   - Para cada aluno matriculado na turma de origem: **copia a matrícula** para a turma nova — sem remover o vínculo original com a turma antiga.
   - **Não apaga nem altera nada** do ano de origem em nenhum momento desse processo.
4. Se não souberem como estruturar esse endpoint em código, **descrevam a lógica acima em português dentro de comentários no arquivo**, e peçam ajuda de alguém mais experiente do grupo para transformar isso em código — é mais seguro do que tentar sozinho numa parte que mexe com dados de matrícula.

> **Regra de segurança importante:** antes de qualquer criação de dados de verdade, testem esse fluxo primeiro com dados de teste/exemplo, nunca direto com as turmas e alunos reais da escola, até terem certeza de que o processo não apaga nada indevidamente.

---

## Parte 4 — Backend: permitir edição da composição de cada turma nova

1. Ainda em `apps/api/src/modules/turmas/`, verifiquem se já existe um endpoint para adicionar/remover um aluno de uma turma (comum em sistemas assim). Se existir, ele provavelmente pode ser **reaproveitado** para editar as turmas recém-criadas do novo ano, sem precisar de um endpoint novo.
2. Se não existir, será necessário criar essa funcionalidade — sigam o padrão de outros endpoints já existentes no mesmo módulo.

---

## Parte 5 — Frontend: tela de virada de ano

1. Abram `apps/web/src/features/turmas/TurmasPage.tsx` para entender a estrutura atual da tela.
2. Planejem uma nova seção ou tela (pode ser um botão "Virar ano letivo" que abre um fluxo próprio) com:
   - Seleção do ano de origem e do ano de destino.
   - Uma prévia das turmas que serão criadas, com campo editável para o nome de cada uma (ex: `2027 - 3º B`).
   - Para cada turma da prévia, uma forma de adicionar/remover alunos antes de confirmar.
   - Um botão de confirmação final, que só aí chama o endpoint da Parte 3.
3. Isso é uma quantidade grande de interface nova — **dividam entre vocês (se for mais de uma pessoa) por partes menores**: por exemplo, uma pessoa faz a tela de prévia das turmas, outra faz a edição de alunos por turma.

> Se estiverem com dificuldade para montar essa tela do zero, procurem no projeto (`Ctrl+Shift+F`) por outras telas que já tenham um fluxo de "várias etapas" ou "confirmação antes de salvar", para copiar a estrutura geral e adaptar — não é necessário inventar um padrão de interface novo se já existir algo parecido no sistema.

---

## Parte 6 — Testar cuidadosamente

Esta é a parte mais importante desta issue, por causa do critério de aceite: **"As turmas e os registros do ano anterior permanecem consultáveis e inalterados."**

1. Antes de testar, se possível, façam isso em um ambiente com dados de teste (não nos dados reais da escola) — perguntem ao grupo se existe essa opção.
2. Depois de rodar o fluxo de virada de ano nos dados de teste:
   - [ ] As turmas do ano antigo ainda aparecem normalmente na lista?
   - [ ] Os alunos continuam matriculados nas turmas antigas, sem terem "sumido" de lá?
   - [ ] As turmas novas foram criadas com os nomes corretos?
   - [ ] Os alunos aparecem corretamente nas turmas novas, conforme editado na prévia?
3. Se qualquer um desses pontos falhar, **não sigam para o Pull Request** — voltem e corrijam, ou chamem o grupo para ajudar a investigar antes de continuar.

---

## Parte 7 — Rodar o build

1. Abram o terminal: **"Terminal"** → **"New Terminal"**.
2. Digitem:

```
pnpm --filter web build
```

3. E também (perguntem ao grupo se o comando é este):

```
pnpm --filter api build
```

> Erros são esperados em issues grandes assim. Não se cobrem por travar — chamem o grupo com prints sempre que passarem de 20-30 minutos sem avançar num mesmo erro.

---

## Parte 8 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados/criados (backend, frontend e `schema.sql`, se alterado).
3. Mensagem de commit:

```
feat(BE-01): fluxo de virada de ano letivo com copia de turmas
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `be-01-virada-ano-letivo`

---

## Parte 9 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `BE-01: fluxo de virada de ano letivo com copia de turmas`
4. Descrição: expliquem, em detalhe, como o teste da Parte 6 foi feito e confirmem explicitamente que os dados do ano anterior não foram alterados nos testes.
5. Em **"Reviewers"**, selecionem **Max**.
6. Cliquem em **"Create pull request"** (considerem marcar como **"Draft"** se ainda faltar testar algum ponto da Parte 6, para deixar claro que não está pronta para merge).

---

**Por ser uma issue G de alto risco:** não tenham pressa. É mais importante que os dados de anos anteriores fiquem intactos do que a tarefa ser entregue rápido. Em caso de qualquer dúvida sobre apagar/alterar dados, **parem e perguntem antes de rodar qualquer coisa.**
