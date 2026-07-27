# Backlog de Tarefas — 3º Bimestre

**Como usar**: cada tarefa abaixo vira uma Issue no GitHub (copiar e colar). Toda tarefa tem **critério de aceite verificável**, **arquivos exatos**, **exemplo pronto para seguir** e **validador nomeado**. Uma tarefa só conta como entregue quando o validador aprova o PR — *entrega feita não é entrega validada*.

**Regra de ouro do backlog**: nenhuma tarefa está no caminho crítico. O sistema já está completo e funcional sem elas. Toda entrega daqui é bônus que melhora a apresentação — e quem entrega aparece no relatório final como autor da melhoria.

**Esforço**: P = 1 sessão de aula · M = 2–3 sessões.

Legenda de setor: FE = Frontend · BD = Banco de Dados · QA = Testes · DOC = Documentação/Governança · VER = Versionamento.

---

## Frontend (CSS/JSX simples — sem TypeScript novo)

### FE-01 — Badges de prioridade com cores próprias (P)
- **O quê**: dar cor distinta aos badges BAIXA (verde), MEDIA (âmbar) e ALTA (vermelho) na lista e no detalhe de ocorrências.
- **Arquivos**: `apps/web/src/features/ocorrencias/status.tsx`, `apps/web/src/components/ui/ui.css`
- **Exemplo**: o `StatusBadge` no mesmo arquivo já faz isso para status — seguir o mesmo padrão.
- **Aceite**: as 3 prioridades têm cores diferentes nas duas telas; contraste legível (texto sempre visível); `pnpm --filter web build` passa.

### FE-02 — Estado vazio ilustrado nas listas (P)
- **O quê**: quando a lista de ocorrências/alunos/turmas estiver vazia, mostrar mensagem amigável com ícone (lucide-react) em vez de tabela vazia.
- **Arquivos**: `apps/web/src/features/ocorrencias/OcorrenciasListPage.tsx`, `AlunosPage.tsx`, `TurmasPage.tsx`
- **Exemplo**: `<p className="muted">` usado nas páginas + ícones lucide já importados no projeto.
- **Aceite**: filtrar por um aluno inexistente mostra o estado vazio; build passa.

### FE-03 — Modal de confirmação em ações destrutivas (M)
- **O quê**: inativar aluno/turma/usuário deve abrir modal "Tem certeza?" antes de executar.
- **Arquivos**: `apps/web/src/components/ui/Modal.tsx` (componente pronto), páginas de alunos/turmas/usuários.
- **Exemplo**: o Modal já existe e é usado em `UsuariosPage.tsx` — reutilizar.
- **Aceite**: nenhuma inativação acontece com 1 clique só; cancelar não executa nada; build passa.

### FE-04 — Data e hora legíveis no histórico (P)
- **O quê**: no detalhe da ocorrência, exibir `criadoEm` do histórico como "12/07/2026 14:32" em vez de não exibir/ISO.
- **Arquivos**: `apps/web/src/features/ocorrencias/DetalheOcorrenciaPage.tsx`
- **Exemplo**: `new Date(item.criadoEm).toLocaleString("pt-BR")`.
- **Aceite**: cada linha do histórico mostra a data em pt-BR; build passa.

### FE-05 — Nome do autor no histórico em vez do ID (M)
- **O quê**: o histórico mostra `usuarioId` (UUID); trocar pelo nome do usuário.
- **Arquivos**: `DetalheOcorrenciaPage.tsx` (cruzar com a lista de usuários via `school.service.ts` — só para papéis que podem listar usuários; senão exibir "Professor(a)" pelo papel).
- **Exemplo**: `listOcorrenciasDetalhadas` em `school.service.ts` já cruza ocorrência com aluno/turma — mesmo padrão.
- **Aceite**: histórico mostra nomes; sem erro para perfil professor (que não lista usuários); build passa.

### FE-06 — Favicon do POLAR (P)
- **O quê**: adicionar o favicon usando `apps/web/src/assets/logo-polar.svg` (o título da aba já está correto).
- **Arquivos**: `apps/web/index.html` (+ mover/copiar o svg para `apps/web/public/` se necessário)
- **Aceite**: a aba do navegador mostra o ícone do POLAR em `pnpm dev` e no build de produção.

### FE-07 — Responsividade da tabela de ocorrências em celular (M)
- **O quê**: abaixo de 720px, a tabela de ocorrências vira cards empilhados (aluno, categoria, status, prioridade, botão ver).
- **Arquivos**: `apps/web/src/components/ui/Table.tsx`, `ui.css` (media queries)
- **Exemplo**: `docs/frontend/guia-visual.md` seções 6–7 definem as regras de responsividade.
- **Aceite**: no modo responsivo do navegador (375px), a lista é utilizável sem rolagem horizontal; desktop permanece igual.

### FE-08 — Tela "Meu perfil" (M)
- **O quê**: página simples mostrando nome, e-mail, papel e botão de trocar senha (a API `/auth/alterar-senha` já existe).
- **Arquivos**: nova `apps/web/src/features/perfil/PerfilPage.tsx` + rota em `apps/web/src/app/routes.tsx` + item no menu (`Sidebar.tsx`).
- **Exemplo**: seguir a estrutura de `ConfiguracoesPage.tsx`.
- **Aceite**: qualquer papel logado troca a própria senha pela tela; senha nova respeita a política (mín. 8); build e testes passam.

## Banco de Dados (SQL puro)

### BD-01 — Consultas de relatório comentadas (P)
- **O quê**: arquivo `database/consultas-relatorio.sql` com 6 consultas DQL comentadas: ocorrências por status; por categoria; por turma; top 5 alunos por reincidência; ocorrências por professor; média de notas por turma.
- **Exemplo**: a consulta de reincidência em `docs/banco-de-dados/normalizacao.md`.
- **Aceite**: todas rodam sem erro no MySQL com o seed aplicado; cada uma tem comentário explicando o que faz e por que os índices ajudam.

### BD-02 — Usuário MySQL de aplicação com privilégios mínimos (P)
- **O quê**: script `database/usuarios-mysql.sql` (DCL) criando `polar_app` com SELECT/INSERT/UPDATE apenas nas tabelas necessárias (sem DELETE, sem DDL) e `polar_leitura` só com SELECT (para relatórios).
- **Exemplo**: `GRANT SELECT, INSERT, UPDATE ON polar.ocorrencias TO 'polar_app'@'%';`
- **Aceite**: conectando como `polar_app`, um `DROP TABLE` falha e o fluxo completo do sistema funciona; documentado no próprio arquivo.

### BD-03 — Massa de dados de teste ampliada (M)
- **O quê**: ampliar `database/seed.ts` para ~40 alunos e ~30 ocorrências distribuídas em 3 meses (mantendo coerência de datas e transições).
- **Exemplo**: as listas `alunos` e `ocorrencias` já existentes no arquivo — seguir o formato.
- **Aceite**: `pnpm seed` roda sem erro em banco limpo; dashboard fica visivelmente mais rico; nomes 100% fictícios.

### BD-04 — Verificação prática da normalização (P)
- **O quê**: executar os passos de `docs/banco-de-dados/normalizacao.md` no banco real e anexar prints ao documento (seção "Verificação prática").
- **Aceite**: PR com os prints e uma frase de conclusão por forma normal.

## Testes / QA

### QA-01 — Executar T01–T16 na URL pública (M)
- **O quê**: rodar o plano `docs/testes/plano-de-testes.md` completo e preencher TODAS as colunas de evidência (prints).
- **Aceite**: tabela 100% preenchida com responsável, data, versão e evidência; qualquer falha vira Issue com passo a passo de reprodução.

### QA-02 — Teste de acentuação e limites (P)
- **O quê**: registrar ocorrências com "ã, ç, é, ô", descrição de exatamente 9 caracteres (deve falhar) e de 2000 (deve passar), e categoria "Dano ao patrimônio".
- **Aceite**: relatório curto em `docs/testes/evidencias-acentuacao.md` com prints dos 4 casos.

### QA-03 — Teste de concorrência simples (P)
- **O quê**: dois navegadores logados (coordenação e professor) operando ao mesmo tempo sobre a mesma ocorrência; tentar resolver a mesma ocorrência duas vezes em sequência.
- **Aceite**: relatório com o comportamento observado (segunda tentativa deve dar 409) em `docs/testes/evidencias-concorrencia.md`.

## Documentação / Governança

### DOC-01 — Manual do usuário com prints (M)
- **O quê**: `docs/manual-do-usuario.md` — para cada papel, o passo a passo com print de cada tela (login → ação principal → resultado).
- **Exemplo**: estrutura do `docs/demo/roteiro-apresentacao.md`.
- **Aceite**: um leigo consegue operar o sistema seguindo só o manual; prints do sistema real (dados fictícios).

### DOC-02 — Glossário final unificado (P)
- **O quê**: `docs/glossario.md` — termos oficiais (Ocorrência, os 4 estados, os 4 papéis, histórico, reincidência, inativação) com a regra "Resolvida ≠ Encerrada" e vocabulário proibido (ticket/chamado).
- **Exemplo**: seção 7 de `docs/visao-geral.md`.
- **Aceite**: nenhuma contradição com `docs/visao-geral.md` e `docs/fluxos/fluxo-ocorrencias.md` (o validador confere).

### DOC-03 — Slides da banca (M)
- **O quê**: deck de 12–15 slides seguindo os 5 atos do `docs/demo/roteiro-apresentacao.md`: problema → solução → demo → engenharia → gestão do projeto.
- **Aceite**: revisado pela liderança; sem logos de terceiros (Sala do Futuro/GOV.BR proibidos); nomes de alunos fictícios.

### DOC-04 — Linha do tempo do projeto (P)
- **O quê**: `docs/historia-do-projeto.md` — evolução honesta: PM-GPO → Acta → POLA → POLAR; Python+JSON → TypeScript → MySQL; o que foi aprendido em cada virada.
- **Aceite**: 1 página; datas conferidas com os documentos do acervo; tom profissional (sem apontar culpados).

## Versionamento

### VER-01 — Proteger a branch master (P)
- **O quê**: no GitHub: Settings → Branches → rule para `master`: exigir PR, exigir CI verde, proibir force-push.
- **Aceite**: um push direto na master é rejeitado (testar e anexar print na Issue).

### VER-02 — Templates de Issue (P)
- **O quê**: `.github/ISSUE_TEMPLATE/tarefa.md` (com campos: o quê, critério de aceite, arquivos, validador, esforço) e `bug.md` (passos, esperado, obtido, print).
- **Exemplo**: o formato das tarefas deste arquivo.
- **Aceite**: criar Issue nova no GitHub oferece os 2 templates preenchíveis.

### VER-03 — CHANGELOG com SemVer (P)
- **O quê**: `CHANGELOG.md` na raiz registrando v1.0 (Python+JSON), v2.0 (TypeScript monorepo) e v3.0 (MySQL + deploy + regras fechadas), no formato Keep a Changelog.
- **Aceite**: datas e conteúdos conferem com o histórico do git; lint de markdown ok.

### VER-04 — Badge de CI no README (P)
- **O quê**: adicionar badge do status do workflow CI no topo do `README.md`.
- **Exemplo**: `![CI](https://github.com/Origenes-Lessa/P.O.L.A/actions/workflows/ci.yml/badge.svg)`
- **Aceite**: badge renderiza e reflete o status real.

---

## Distribuição sugerida

| Setor | Tarefas | Validador |
| --- | --- | --- |
| Frontend | FE-01…FE-08 | líder técnico |
| Banco de Dados | BD-01…BD-04 | líder do setor de BD |
| QA | QA-01…QA-03 | responsável de QA/segurança |
| Documentação | DOC-01…DOC-04 | liderança de documentação |
| Versionamento | VER-01…VER-04 | líder de versionamento |

Quem não tem computador em casa: BD-01/BD-02/QA-01/QA-02/DOC-02/DOC-04 e VER-01/VER-02 são executáveis integralmente na escola (navegador + editor online do GitHub).
