# Relatorio de integracao frontend-backend

Data: 2026-05-24

## 1. Objetivo

Integrar a aplicacao React + TypeScript (`apps/web`) com a API Node.js + TypeScript (`apps/api`), removendo o uso de dados mockados como fonte da aplicacao e deixando mocks apenas nos testes automatizados.

## 2. Estado anterior

- Login possuia fallback demo em ambiente de desenvolvimento.
- Dashboard, ocorrencias, alunos, perfil do aluno, turmas, usuarios e relatorios consumiam dados locais de `mock-data.ts` ou arrays internos.
- Formulario de nova ocorrencia validava campos, mas nao persistia na API.
- Detalhe da ocorrencia exibia historico local e botoes sem chamada real para troca de status.
- Documentacao indicava que telas usavam mock como fallback.

## 3. Alteracoes realizadas

- Criado contrato de tipos do frontend em `apps/web/src/services/domain.ts`.
- Criado servico HTTP integrado em `apps/web/src/services/school.service.ts`.
- Removido `apps/web/src/services/mock-data.ts`.
- Removido fallback demo de `apps/web/src/features/auth/auth.service.ts`.
- Atualizadas as telas para consumir endpoints reais:
  - Dashboard.
  - Lista de ocorrencias.
  - Nova ocorrencia.
  - Detalhe da ocorrencia.
  - Gestao de alunos.
  - Perfil/historico do aluno.
  - Turmas.
  - Usuarios.
  - Relatorios.
- Conectadas acoes administrativas de criacao de aluno, criacao/edicao de turma, criacao de usuario e ativacao/desativacao de usuario.
- Criados estados de carregamento e erro nas telas integradas.
- Atualizado `VITE_API_URL` para ser a fonte unica da URL do backend.
- Atualizado backend para aceitar `local` e `testemunhas` em ocorrencias.
- Atualizado `database/schema.sql` para refletir os novos campos de ocorrencia.
- Atualizado script de migracao JSON para preservar `local` e `testemunhas`, quando existirem no legado.
- Dashboard da API passou a exigir `CONSULTAR_OCORRENCIAS`, alinhando o acesso do professor ao dashboard operacional.
- Testes do frontend passaram a mockar `fetch`, sem fallback de dados na aplicacao.

## 4. Endpoints consumidos pelo frontend

| Tela | Endpoints |
| --- | --- |
| Login | `POST /auth/login` |
| Dashboard | `GET /dashboard/resumo`, `GET /ocorrencias`, `GET /alunos`, `GET /turmas` |
| Ocorrencias | `GET /ocorrencias`, `POST /ocorrencias`, `GET /ocorrencias/:id`, `PATCH /ocorrencias/:id/status`, `GET /ocorrencias/:id/historico` |
| Alunos | `GET /alunos`, `GET /alunos/:id`, `GET /turmas`, `POST /alunos` |
| Perfil do aluno | `GET /alunos/:id`, `GET /ocorrencias`, `GET /notas/alunos/:alunoId`, `GET /faltas/alunos/:alunoId` |
| Turmas | `GET /turmas`, `POST /turmas`, `PATCH /turmas/:id` |
| Usuarios | `GET /usuarios`, `POST /usuarios`, `PATCH /usuarios/:id` |
| Relatorios | `GET /relatorios/ocorrencias` |

## 5. Impacto direto no funcionamento

- O usuario agora depende da API real para autenticar.
- A interface passa a refletir dados persistidos pelo backend.
- Registro de ocorrencia cria registro real via API e redireciona para o detalhe criado.
- Troca de status no detalhe executa o fluxo real do backend e respeita regras de papel.
- Historico exibido vem do backend e continua imutavel manualmente.
- Listagens de alunos, turmas e usuarios nao usam mais dados estaticos.
- Acoes administrativas basicas agora persistem na API.
- Erros HTTP sao exibidos nas telas e `401/403` continuam tratados por `api.ts`.
- Testes continuam isolados, mas simulam o contrato HTTP em vez de importar dados da aplicacao.

## 6. Arquivos principais criados

- `apps/web/src/services/domain.ts`
- `apps/web/src/services/school.service.ts`
- `docs/relatorios/integracao-frontend-backend.md`

## 7. Arquivos principais alterados

- `apps/web/src/features/auth/auth.service.ts`
- `apps/web/src/features/dashboard/DashboardPage.tsx`
- `apps/web/src/features/ocorrencias/OcorrenciasListPage.tsx`
- `apps/web/src/features/ocorrencias/NovaOcorrenciaPage.tsx`
- `apps/web/src/features/ocorrencias/DetalheOcorrenciaPage.tsx`
- `apps/web/src/features/alunos/AlunosPage.tsx`
- `apps/web/src/features/alunos/PerfilAlunoPage.tsx`
- `apps/web/src/features/turmas/TurmasPage.tsx`
- `apps/web/src/features/usuarios/UsuariosPage.tsx`
- `apps/web/src/features/relatorios/RelatoriosPage.tsx`
- `apps/web/vitest.setup.ts`
- `apps/api/src/modules/ocorrencias/ocorrencias.service.ts`
- `apps/api/src/modules/ocorrencias/ocorrencias.types.ts`
- `apps/api/src/modules/dashboard/dashboard.routes.ts`
- `apps/api/src/shared/domain.ts`
- `database/schema.sql`
- `scripts/migrate-json-to-db.ts`

## 8. Como rodar integrado

1. Configure `apps/api/.env` local com `JWT_SECRET`, `DATABASE_PROVIDER` e `BOOTSTRAP_ADMIN_PASSWORD`, sem versionar o arquivo.
2. Configure `apps/web/.env` local com:

```env
VITE_API_URL=http://localhost:3000
```

3. Rode na raiz:

```bash
pnpm install
pnpm dev
```

Ou separado:

```bash
pnpm --filter @pola/api dev
pnpm --filter web dev
```

## 9. Validacoes executadas

- `pnpm --filter web typecheck`: sucesso.
- `pnpm --filter @pola/api typecheck`: sucesso.
- `pnpm --filter web test`: sucesso, 5 testes passaram.
- `pnpm --filter @pola/api test`: sucesso, 16 testes passaram.
- `pnpm --filter web build`: sucesso.
- `pnpm --filter @pola/api build`: sucesso.
- `pnpm lint`: sucesso.

## 10. Limitacoes restantes

- Edicao completa de perfil de usuario e edicao completa de aluno ainda precisam de telas especificas.
- Exportacao de relatorios permanece planejada para evolucao futura.
- Ainda falta teste E2E com navegador real cobrindo login, listagem, criacao de ocorrencia e troca de status.
- O ambiente local precisa de usuario bootstrap ou seed para primeiro acesso.

## 11. Proximos passos recomendados

1. Criar seed de desenvolvimento com usuarios por papel, turmas, alunos, notas, faltas e ocorrencias.
2. Implementar telas completas de edicao para usuarios e alunos.
3. Adicionar Playwright para validacao ponta a ponta.
4. Evoluir controle de escopo por professor/turma/aluno.
5. Persistir em PostgreSQL/Supabase substituindo o JSON temporario.
