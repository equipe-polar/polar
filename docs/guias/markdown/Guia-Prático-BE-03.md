# Guia Passo a Passo — Issue BE-04
### Encaminhamento automático de novas ocorrências

**Projeto:** P.O.L.A.R.
**Responsável:** Igor.
**Validador:** Max
**Prazo:** A definir
**Esforço:** G (grande)
**Arquivos envolvidos:**
- `database/schema.sql`
- `apps/api/src/modules/turmas/`
- `apps/api/src/modules/ocorrencias/`
- Módulo de notificações (**novo** — ainda não existe no projeto)
- `apps/web/src/features/ocorrencias/`

> **Antes de começar:** este guia assume que você nunca usou Git, terminal ou editor de código. Vamos usar só o navegador. Se algum passo aparecer diferente do descrito aqui, **pare e chame o Max no grupo** antes de continuar.
>
> **Aviso de tamanho:** issue **G**, envolve criar um módulo inteiro novo (notificações) e mexer em três módulos diferentes. Não recomendada como primeira tarefa no projeto.

---

## O que você vai fazer, em uma frase

Fazer com que, ao criar uma nova ocorrência, o sistema **encaminhe automaticamente** para as pessoas certas: se a turma for de **curso técnico**, encaminha para PAET, coordenação e direção; se for **ensino regular**, encaminha só para coordenação e direção. E guardar um histórico de quem recebeu, quando, e se o envio deu certo.

### Bloco pronto de implementação

A estrutura final da tabela de histórico e a chamada do serviço devem ficar no backend e na tela de detalhe da ocorrência.

```sql
-- database/schema.sql
CREATE TABLE encaminhamentos_ocorrencia (
  id SERIAL PRIMARY KEY,
  ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencias(id),
  destinatario_id INTEGER NOT NULL REFERENCES usuarios(id),
  data_envio TIMESTAMP NOT NULL DEFAULT now(),
  resultado VARCHAR(50) NOT NULL
);
```

```ts
// apps/api/src/modules/notificacoes/notificacoes.service.ts
export async function registrarEncaminhamento(ocorrenciaId: number, destinatarioId: number, resultado: 'sucesso' | 'falha') {
  return db.query(
    `INSERT INTO encaminhamentos_ocorrencia (ocorrencia_id, destinatario_id, data_envio, resultado)
     VALUES ($1, $2, NOW(), $3)`,
    [ocorrenciaId, destinatarioId, resultado]
  );
}
```

```tsx
// apps/web/src/features/ocorrencias/DetalheOcorrenciaPage.tsx
<ul>
  {historico.map((item) => (
    <li key={item.id}>
      <span>{item.destinatarioNome}</span>
      <span>{new Date(item.data_envio).toLocaleString()}</span>
      <span>{item.resultado}</span>
    </li>
  ))}
</ul>
```

> O critério de aceite exige que a ocorrência seja salva mesmo quando o envio falhar; o histórico deve registrar somente o resultado do envio.

---

## Parte 1 — Preparar o ambiente (sem instalar nada)

1. Abra o navegador (Chrome ou Edge) e acesse **github.com**.
2. Faça login com sua conta (colaboradora da organização `equipe-polar`).
3. Acesse **github.com/equipe-polar/polar**.
4. Clique no botão verde **"Code"** → aba **"Codespaces"** → **"Create codespace on master"**.
5. Aguarde de 1 a 3 minutos até o VS Code abrir no navegador.

---

## Parte 2 — Confirmar que existe um jeito de saber o tipo da turma

Toda a lógica desta issue depende de uma coisa: **o sistema já sabe dizer se uma turma é técnica ou regular?**

1. No **Explorer**, abram `database/schema.sql`.
2. Usem `Ctrl+F` e busquem pela tabela de turmas.
3. Verifiquem se já existe uma coluna indicando o tipo de curso (ex: `tipo`, `tipo_curso`, `modalidade`).

> **Se já existir** → anotem o nome exato e os valores possíveis (ex: `"tecnico"` / `"regular"`) e sigam para a Parte 3.
> **Se não existir** → esta issue não pode avançar sem essa informação no banco primeiro. **Conversem com o time de Banco de Dados antes de prosseguir** — pode ser necessário adicionar essa coluna (e preencher retroativamente as turmas já cadastradas, o que exige cuidado, parecido com o alerta da BE-02).

---

## Parte 3 — Confirmar onde encontrar os destinatários (PAET, coordenação, direção)

O sistema precisa saber **quem** é PAET, coordenação e direção para poder notificar.

1. Usem `Ctrl+Shift+F` e busquem por `PAET`, `coordenacao` e `direcao` no projeto inteiro.
2. Verifiquem se esses papéis já existem como perfis de usuário no sistema (provavelmente sim, já que aparecem em outras issues, como a FE-04, que menciona "papel" de usuário).
3. Confirmem: existe uma forma de buscar "todos os usuários com papel PAET" (ou coordenação, ou direção)? Se sim, anotem como. Se não, será necessário criar essa consulta.

---

## Parte 4 — Criar o módulo de notificações (novo)

Este é o módulo mais novo e mais delicado da issue: ele ainda **não existe** no projeto.

1. No **Explorer**, dentro de `apps/api/src/modules/`, criem uma nova pasta chamada `notificacoes` (botão direito → **"New Folder"**).
2. Antes de escrever qualquer lógica de envio de e-mail/mensagem de verdade, **conversem com o grupo sobre qual vai ser o meio de notificação**: e-mail? Notificação dentro do próprio sistema (aparecendo pro usuário quando ele entra)? Isso muda bastante a complexidade da implementação, e a issue não deixa isso explícito.

   - **Se for notificação dentro do sistema** (mais simples de implementar sem depender de serviços externos): a lógica seria salvar um registro no banco dizendo "usuário X tem uma notificação pendente sobre a ocorrência Y", e o frontend mostra isso quando o usuário entra.
   - **Se for e-mail de verdade**: vai exigir configurar um serviço de envio de e-mail (isso costuma precisar de credenciais/chaves de API — **não é algo para decidir ou configurar sozinho, tragam essa decisão para o Max**).

3. Dentro do módulo `notificacoes`, criem a estrutura básica seguindo o padrão de outro módulo já existente no projeto (ex: como `ocorrencias` é organizado — arquivos de rotas, de lógica, etc.). Copiar a estrutura de pastas/arquivos de um módulo existente é mais seguro do que inventar um padrão novo.

---

## Parte 5 — Criar a tabela de histórico de encaminhamentos

O critério de aceite exige que **"o histórico registra destinatários, data e resultado do envio."**

1. Em `database/schema.sql`, criem uma nova tabela, seguindo o padrão de nomenclatura das tabelas já existentes. Um formato de exemplo:

```sql
CREATE TABLE encaminhamentos_ocorrencia (
  id SERIAL PRIMARY KEY,
  ocorrencia_id INTEGER NOT NULL REFERENCES ocorrencias(id),
  destinatario_id INTEGER NOT NULL REFERENCES usuarios(id),
  data_envio TIMESTAMP NOT NULL DEFAULT now(),
  resultado VARCHAR(50) NOT NULL
);
```

> Este é só um exemplo de estrutura — ajustem os nomes de tabelas/colunas referenciadas (`ocorrencias`, `usuarios`) para os nomes reais usados no restante do `schema.sql`, e confirmem o formato com quem cuida do banco antes de aplicar.

---

## Parte 6 — Conectar tudo: ao criar uma ocorrência, dispara o encaminhamento

1. Em `apps/api/src/modules/ocorrencias/`, localizem onde uma nova ocorrência é criada.
2. Logo após a ocorrência ser salva com sucesso, adicionem a chamada para a lógica de encaminhamento (criada na Parte 4), passando o tipo da turma (Parte 2) para decidir os destinatários:
   - **Turma técnica** → PAET + coordenação + direção
   - **Ensino regular** → coordenação + direção
3. Para cada destinatário, registrem uma linha na tabela criada na Parte 5, com o resultado do envio (ex: `"sucesso"` ou `"falha"`).

> **Importante:** o critério de aceite não exige que a ocorrência falhe se a notificação falhar — trate essas duas coisas como independentes (a ocorrência deve ser salva mesmo que, por algum motivo, uma notificação não consiga ser enviada; só o resultado do envio fica registrado como falha no histórico).

---

## Parte 7 — Frontend: mostrar o histórico de encaminhamentos

1. Em `apps/web/src/features/ocorrencias/` (provavelmente na tela de detalhe da ocorrência, já usada em outras issues), adicionem uma seção mostrando o histórico de encaminhamentos: quem recebeu, quando, e se deu certo.
2. Sigam o mesmo padrão visual de outras listas de histórico já existentes na mesma tela (ex: histórico de mudanças de status, se já existir).

---

## Parte 8 — Testar

1. Se o projeto tiver como rodar localmente, criem uma ocorrência de teste numa turma técnica e confirmem que o histórico de encaminhamento mostra PAET, coordenação e direção.
2. Criem outra ocorrência de teste numa turma de ensino regular e confirmem que o histórico mostra só coordenação e direção.
3. Confirmem que a data e o resultado do envio aparecem corretamente no histórico.

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

> Erros são esperados numa issue deste tamanho, especialmente por envolver um módulo novo. Chamem o grupo sempre que passarem de 20-30 minutos travados no mesmo ponto.

---

## Parte 10 — Enviar o trabalho

1. Ícone de três bolinhas ligadas (**Source Control**) na lateral esquerda.
2. Marquem todos os arquivos alterados/criados (banco, backend, módulo novo e frontend).
3. Mensagem de commit:

```
feat(BE-04): encaminhamento automatico de ocorrencias por tipo de turma
```

4. Clique em **"Commit"** e depois **"Sync Changes"**.

> Se pedir branch antes: clique em "master" no canto inferior esquerdo → **"Create new branch"** → nome: `be-04-encaminhamento-automatico`

---

## Parte 11 — Abrir o Pull Request

1. Voltem para a aba do `github.com/equipe-polar/polar`.
2. Cliquem em **"Compare & pull request"**.
3. Título: `BE-04: encaminhamento automatico de ocorrencias por tipo de turma`
4. Descrição: expliquem qual meio de notificação foi escolhido (Parte 4) e por quê, e confirmem os testes com os dois tipos de turma.
5. Em **"Reviewers"**, selecionem **Max**.
6. Cliquem em **"Create pull request"**.
