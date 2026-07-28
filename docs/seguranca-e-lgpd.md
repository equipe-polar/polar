# Segurança e LGPD no POLAR

## 1. Medidas de segurança implementadas

| Medida | Implementação | Referência OWASP |
| --- | --- | --- |
| Senhas nunca em texto puro | bcrypt (custo 10) em `auth.service.ts`; nenhuma resposta expõe `senha_hash` | A02 Cryptographic Failures |
| Autenticação stateless | JWT assinado (`JWT_SECRET` ≥ 32 chars, obrigatório — a API não sobe sem ele), expiração configurável, issuer fixo | A07 Identification & Auth Failures |
| Autorização no servidor | Middleware `authorize(permissao)` por rota + regras de negócio no service (a UI apenas oculta) | A01 Broken Access Control |
| Bloqueio de força bruta | 5 tentativas inválidas → bloqueio de 15 min (423); rate-limit por IP no login (429); mensagem genérica que não revela se o e-mail existe | A07 |
| Validação de entrada | Zod em todos os endpoints; descrição ≥ 10 chars; caracteres de controle rejeitados; HTML removido (texto puro) | A03 Injection |
| SQL parametrizado | 100% das queries via placeholders `?` do mysql2 — zero concatenação de SQL | A03 Injection |
| Cabeçalhos de proteção | `helmet` (CSP, X-Content-Type-Options, frame-ancestors etc.) | A05 Security Misconfiguration |
| CORS restrito | Lista de origens explícita via `CORS_ORIGIN` | A05 |
| Política de senha | 8–72 caracteres, sem espaços nas bordas, sem caracteres de controle; troca obrigatória no primeiro login de conta criada por ADM | A07 |
| Segredos fora do código | Tudo por variável de ambiente; `.env` no `.gitignore`; senha bootstrap fraca derruba o boot em produção | A05 |
| Trilha de auditoria | `audit_logs` para login (sucesso/falha), criação/edição de entidades e transições de status | A09 Logging Failures |
| Histórico imutável | `ocorrencia_historico` é append-only em todas as camadas; tentativa de edição → 405 | A08 Integrity Failures |
| Payload limitado | `express.json({ limit: "1mb" })` | — |

### Pendências conhecidas (transparência)

- Sem refresh token / expiração por inatividade (sessão expira pelo tempo do JWT).
- Sem recuperação de senha por e-mail (fora de escopo: nenhuma comunicação externa).
- Recomendado: usuário MySQL da aplicação com privilégios mínimos (sem DDL) — tarefa aberta para o setor de Banco de Dados.

## 2. LGPD (Lei 13.709/2018)

O POLAR trata dados pessoais de **menores de idade** (nome, matrícula, turma, relatos disciplinares). Posição do projeto:

### Base legal

Art. 7º, e art. 14 (dados de crianças e adolescentes tratados no seu melhor interesse): o tratamento se dá **para a execução de políticas públicas de educação** pela própria instituição de ensino, no exercício de suas atribuições legais (acompanhamento pedagógico e disciplinar previsto no regimento escolar). Não há uso comercial, compartilhamento com terceiros nem decisão automatizada.

### Princípios aplicados no design

| Princípio (art. 6º) | Como o POLAR atende |
| --- | --- |
| **Minimização** | Só os dados necessários: nome, matrícula, turma e contato do responsável. **Não** coleta CPF, RG, endereço, foto, biometria ou dado sensível (art. 5º, II) |
| **Necessidade e finalidade** | Dado usado exclusivamente para o acompanhamento institucional de ocorrências |
| **Livre acesso / transparência** | A escola (controladora) pode extrair o histórico completo de um aluno para atender solicitação do responsável |
| **Segurança** | Seção 1 acima; acesso segregado por papel; professor só vê o que registrou |
| **Prevenção** | Inativação lógica preserva contexto sem exposição; contas desligadas são inativadas |
| **Responsabilização** | `audit_logs` registra quem acessou/alterou o quê e quando |

### Papéis LGPD

- **Controladora**: a instituição de ensino (define finalidade e meios).
- **Operadores**: usuários do sistema (professores, coordenação, direção) no exercício da função.
- O sistema é ferramenta interna da escola; não há transferência internacional nem compartilhamento externo de dados.

### Retenção

Recomendação ao cliente: manter registros pelo período de vida escolar do aluno + prazo do regimento interno, e anonimizar/expurgar após esse prazo. O modelo com inativação lógica e IDs UUID facilita futura anonimização (substituição de nome/matrícula preservando estatísticas).

### O que o sistema deliberadamente NÃO faz (redução de risco)

- Não expõe dados a alunos nem responsáveis (não são usuários).
- Não envia dados para fora (sem e-mail/SMS/push externos, sem APIs de terceiros).
- Não usa IA sobre dados de alunos.
- Não publica ranking ou comparação entre alunos.
