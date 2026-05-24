# Relatorio da fase frontend React + TypeScript

Data: 2026-05-24

## 1. O que foi criado

Foi criado um frontend profissional em React + TypeScript + Vite dentro de `apps/web`.

Principais itens:

- Vite configurado.
- React Router configurado.
- Design system simples com tokens CSS.
- Layout institucional com sidebar, topbar e page header.
- Servico de API com `VITE_API_URL`.
- Servicos HTTP tipados para dashboard, ocorrencias, alunos, turmas, usuarios, notas, faltas e relatorios.
- Controle de permissao no frontend com `ProtectedRoute` e `canAccess`.
- Testes com Vitest e Testing Library.

## 2. O que foi migrado

As telas HTML/CSS/JS antigas deixaram de ser frontend ativo. A experiencia principal foi recriada em React com componentes reutilizaveis.

## 3. O que ficou em legado

O HTML antigo foi movido para:

```text
legacy/frontend-html/
```

Esse material fica apenas como referencia visual/prototipo.

## 4. Telas disponiveis

- Login
- Dashboard
- Lista de ocorrencias
- Nova ocorrencia
- Detalhe da ocorrencia
- Gestao de alunos
- Perfil/historico do aluno
- Gestao de turmas
- Gestao de usuarios
- Relatorios
- Configuracoes
- Acesso negado
- Pagina nao encontrada

## 5. Componentes criados

- `AppShell`
- `Sidebar`
- `Topbar`
- `PageHeader`
- `Button`
- `Card`
- `Input`
- `Select`
- `Table`
- `Badge`
- `Modal`
- `Tabs`
- `Breadcrumb`
- `ProtectedRoute`

## 6. Como rodar

Na raiz:

```bash
pnpm install
pnpm dev
```

Somente frontend:

```bash
pnpm --filter web dev
```

Variavel:

```env
VITE_API_URL=http://localhost:3000
```

## 7. Como testar

```bash
pnpm --filter web test
pnpm --filter web build
```

Na raiz:

```bash
pnpm test
pnpm build
```

## 8. Integracao com backend

As telas principais foram conectadas aos endpoints reais da API Node/TypeScript:

- Login usa `POST /auth/login`.
- Dashboard usa `GET /dashboard/resumo` e `GET /ocorrencias`.
- Ocorrencias usam `GET /ocorrencias`, `POST /ocorrencias`, `GET /ocorrencias/:id`, `GET /ocorrencias/:id/historico` e `PATCH /ocorrencias/:id/status`.
- Alunos usam `GET /alunos`, `GET /alunos/:id`, `GET /notas/alunos/:alunoId` e `GET /faltas/alunos/:alunoId`.
- Turmas usam `GET /turmas`.
- Turmas administrativas usam `POST /turmas` e `PATCH /turmas/:id`.
- Alunos administrativos usam `POST /alunos`.
- Usuarios usam `GET /usuarios`, `POST /usuarios` e `PATCH /usuarios/:id`.
- Relatorios usam `GET /relatorios/ocorrencias`.

O fallback demo do login e os dados mockados da aplicacao foram removidos. Dados simulados ficam restritos ao setup de testes.

## 9. Limitacoes atuais

- Edicao completa de perfil do usuario e edicao completa de aluno ainda precisam de telas dedicadas.
- Exportacao de relatorios esta prevista como evolucao futura.
- E2E com Playwright ainda nao foi criado.

## 10. Proximos passos

1. Adicionar Playwright para fluxo de login e ocorrencia.
2. Refinar permissoes por turma/aluno.
3. Evoluir edicao completa de usuarios e alunos.
4. Criar exportacao de relatorios.

## Validacoes executadas

- `pnpm --filter web typecheck`: sucesso.
- `pnpm --filter web test`: sucesso, 5 testes passaram.
- `pnpm --filter web build`: sucesso.
