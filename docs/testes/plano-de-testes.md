# Plano de Testes — POLAR (T01–T10)

Casos oficiais do documento mestre, atualizados para a v3. Prioridade: autenticação, criação de ocorrência e controle de acesso.

**Como preencher**: cada caso executado ganha responsável, data, versão/commit, navegador e evidência (print ou link). *"Entrega feita não é entrega validada"* — o caso só conta com evidência anexada.

Automação: T02–T09 possuem equivalentes automatizados em `apps/api/tests/integration/` (rodam no CI a cada push). A execução manual na URL pública continua obrigatória antes da banca.

| ID | Cenário | Passos | Resultado esperado | Resultado obtido | Responsável | Data | Evidência |
| --- | --- | --- | --- | --- | --- | --- | --- |
| T01 | Login válido | Login com credencial correta de cada papel | Token emitido; tela inicial do papel; sem vazamento de hash | | | | |
| T02 | Login inválido | Senha errada 1x; depois 6x seguidas | Mensagem genérica "Usuario ou senha invalidos"; após 5 tentativas, bloqueio temporário (423) | | | | |
| T03 | Registro completo de ocorrência | Professor registra com aluno, categoria, prioridade e descrição | 201; status `REGISTRADA`; autor/data automáticos; histórico com 1 entrada | | | | |
| T04 | Registro incompleto | Omitir aluno; depois descrição < 10 chars | 400 em ambos; nada gravado | | | | |
| T05 | Professor tenta alterar status | Professor chama PATCH /status | 403; status inalterado | | | | |
| T06 | Transição válida pela coordenação | Coordenador: `REGISTRADA→EM_ANALISE→RESOLVIDA` com observação | 200; histórico ganha entradas com autor e observação | | | | |
| T07 | Transição inválida | Coordenador tenta `REGISTRADA→ENCERRADA` (pular etapa) | 409; nada gravado | | | | |
| T08 | Encerramento pela direção | Diretor encerra `RESOLVIDA`; depois tenta editar a ocorrência | Encerra com sucesso; edição posterior bloqueada (409) | | | | |
| T09 | Acesso sem autenticação | Chamar `/ocorrencias` sem token | 401 | | | | |
| T10 | Persistência real | Registrar ocorrência → reiniciar o serviço → consultar | A ocorrência e o histórico continuam lá (PostgreSQL) | | | | |

## Casos adicionais da v3 (executar junto)

| ID | Cenário | Resultado esperado | Resultado obtido | Responsável | Evidência |
| --- | --- | --- | --- | --- | --- |
| T11 | Professor B lista/acessa ocorrência do professor A | Lista não mostra; detalhe/histórico → 403 | | | |
| T12 | Acentuação PT-BR | Registrar com categoria "Não fez atividade" e descrição com ã/ç/é | Persistido e exibido corretamente | | | |
| T13 | Edição pelo autor em `REGISTRADA` | 200 + histórico "Ocorrencia editada pelo autor" | | | |
| T14 | Edição por terceiro (ADM) | 403 | | | |
| T15 | Editar histórico (PUT/PATCH) | 405 | | | |
| T16 | Dupla sessão simultânea | Coordenador e professor logados ao mesmo tempo operam sem interferência | | | |

## Ambiente de referência

- Navegador alvo: Chrome desktop (tablet como secundário).
- URL pública: preencher após o deploy (ver [docs/deploy/vercel.md](../deploy/vercel.md)).
- Credenciais de teste: contas do seed (`*@escola.polar`, uma por papel).
