# Roteiro de Apresentação — POLAR

> Ensaie este roteiro completo ANTES da banca, na URL pública. O critério de aceite é explícito: **se qualquer etapa falhar, o MVP não está concluído**. Tempo estimado: 8–10 minutos de demonstração.

## Preparação (véspera)

- [ ] Sistema no ar: `https://SEU-PROJETO.vercel.app/api/health` responde `ok`.
- [ ] Keepalive ativo (serviço não hiberna durante a apresentação).
- [ ] Banco com dados do seed (12 ocorrências nos 4 estados).
- [ ] 3 abas/perfis de navegador preparados (professor, coordenação, direção) — ou logins anotados.
- [ ] Plano B: PostgreSQL local via Docker + `pnpm dev` no notebook (ver docs/deploy/supabase.md), caso a internet da escola falhe.

## Credenciais de demonstração

| Papel | E-mail | Senha |
| --- | --- | --- |
| Professor | `professor@escola.polar` | (a definida em `SEED_SENHA_PADRAO`) |
| Coordenação | `coordenacao@escola.polar` | idem |
| Direção | `direcao@escola.polar` | idem |
| ADM | `adm@escola.polar` | idem |
| Aluno | `aluno@escola.polar` | idem |

## Ato 1 — O problema e a visão (1 min, sem sistema)

"Hoje a ocorrência escolar vive no papel e na conversa de corredor: a informação se perde, ninguém sabe em que etapa o caso está e não existe histórico por aluno. O POLAR digitaliza esse processo num fluxo institucional que não pode ser burlado, com histórico imutável."

## Ato 2 — O caminho feliz (os 6 passos oficiais)

1. **Login do professor** (`professor@escola.polar`). Mostrar que a lista se chama "Minhas ocorrências" — professor só vê o que ele registrou.
2. **Registrar ocorrência**: aluno da lista, categoria **"Não fez atividade"** (mostrar acentuação funcionando), prioridade MÉDIA, descrição real. Mostrar que autor e data saem automáticos.
3. **Login da coordenação** (`coordenacao@escola.polar`): a ocorrência aparece; abrir o detalhe → **Colocar em análise**.
4. **Marcar resolvida** preenchendo a observação: *"Conversa com o aluno realizada; família comunicada."* Mostrar a observação entrando no histórico.
5. **Login da direção** (`direcao@escola.polar`) → **Encerrar** com observação.
6. **Abrir o histórico**: as 4 etapas, com autor, data e observações, em ordem cronológica.

## Ato 3 — O sistema que diz NÃO (o diferencial na banca)

> "Falhar explicitamente é comportamento correto." Demonstre os bloqueios:

- Professor tenta mudar status → **403** (não há botão na UI; mostrar via ferramenta de rede/console que o backend também bloqueia).
- Coordenação tenta encerrar (pular etapa) → **409**.
- Tentar editar ocorrência encerrada → **409**; editar histórico → **405**.
- Professor não enxerga ocorrência registrada pelo ADM → **403** no acesso direto, e ausente da lista.
- **O dashboard obedece ao mesmo escopo**: professor vê total 6, coordenação vê 12. É o ponto que mais costuma ser furado em sistemas assim — a listagem filtra e o agregado vaza.
- Login do aluno (`aluno@escola.polar`): lista vazia e dashboard zerado. Nega por padrão, porque ainda não existe vínculo entre a conta e o registro do estudante.
- Logout e acesso direto à URL interna → redirecionado ao login (**401**).

## Ato 4 — Persistência e reincidência (2 min)

- **Perfil do aluno**: histórico completo — a tela que responde "este aluno é reincidente?" (o valor central para a coordenação).
- **Dashboard**: totais por status/prioridade/categoria.
- **T10 ao vivo (opcional, ousado)**: disparar um redeploy no painel da Vercel e mostrar que os dados continuam — "persistência real em PostgreSQL".
- **Auditoria** (login ADM): quem fez o quê e quando.

## Ato 5 — Engenharia por trás (para as perguntas técnicas)

| Pergunta provável | Resposta curta | Evidência |
| --- | --- | --- |
| "Que banco vocês usam?" | PostgreSQL 15 no Supabase, 10 tabelas normalizadas em 3FN | `database/schema.sql`, docs/banco-de-dados/ |
| "E se cair a conexão no meio da mudança de status?" | Transação: status + histórico + auditoria são atômicos (TCL) | `postgres/ocorrencia.repository.postgres.ts` |
| "Como garantem que professor não burla?" | RBAC no backend; a UI só esconde | testes de integração + demo do 403 |
| "Histórico pode ser apagado?" | Não existe UPDATE/DELETE em nenhuma camada; rota devolve 405 | `docs/fluxos/fluxo-ocorrencias.md` |
| "LGPD com dados de menores?" | Minimização (sem CPF/endereço), base legal educacional, auditoria, sem exposição externa | `docs/seguranca-e-lgpd.md` |
| "Vocês usaram IA?" | Sim, como ferramenta de produtividade, declarado e com validação humana; zero IA dentro do produto | `docs/uso-de-ia.md` |
| "Como vocês trabalharam em equipe?" | GitHub (branches, PRs, CI), sprints semanais, tarefas com critério de aceite | histórico do repositório |

## Erros a não cometer

- Não chamar ocorrência de "chamado/ticket"; não confundir "resolvida" com "encerrada".
- Não improvisar dados ao vivo fora do seed (nomes reais de alunos são proibidos).
- Não abrir o painel do banco com credenciais visíveis no projetor.
