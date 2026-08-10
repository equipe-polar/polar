# Plano de Testes — POLAR (T01–T16)

Casos oficiais do documento mestre, atualizados para a v3. Prioridade: autenticação, criação de ocorrência e controle de acesso.

**Como preencher**: cada caso executado ganha responsável, data, versão/commit, navegador e evidência (print ou link). *"Entrega feita não é entrega validada"* — o caso só conta com evidência anexada.

Automação: T02–T09 possuem equivalentes automatizados em `apps/api/tests/integration/` (rodam no CI a cada push). A execução manual na URL pública continua obrigatória antes da banca.

| ID | Cenário | Passos | Resultado esperado | Resultado obtido | Responsável | Data | Evidência |
|---|---|---|---|---|---|---|---|
| T01 | Login válido | Login com credencial correta de cada papel | Token emitido; tela inicial do papel; sem vazamento de hash | Processo de autenticação parcialmente bem-sucedido. A maioria dos perfis acessou o sistema normalmente; porém o perfil de aluno apresentou falha durante o login. | PH Barros | 04/08/2026 | |
| T02 | Login inválido | Senha errada 1x; depois 6x seguidas | Mensagem genérica "Usuario ou senha invalidos"; após 5 tentativas, bloqueio temporário (423) | Sistema apresentou o comportamento esperado, exibindo mensagem de credenciais inválidas e realizando bloqueio temporário após tentativas inválidas. | PH Barros | 04/08/2026 | |
| T03 | Registro completo de ocorrência | Professor registra com aluno, categoria, prioridade e descrição | 201; status `REGISTRADA`; autor/data automáticos; histórico com 1 entrada | Ocorrência registrada com sucesso, sendo adicionada corretamente ao histórico. | PH Barros | 05/08/2026 | |
| T04 | Registro incompleto | Omitir aluno; depois descrição < 10 chars | 400 em ambos; nada gravado | Sistema impediu o registro quando os campos obrigatórios não foram preenchidos. | PH Barros | 05/08/2026 | |
| T05 | Professor tenta alterar status | Professor chama PATCH /status | 403; status inalterado | Caso não executado, pois a funcionalidade ainda não está implementada. | PH Barros | 05/08/2026 | |
| T06 | Transição válida pela coordenação | Coordenador: `REGISTRADA→EM_ANALISE→RESOLVIDA` com observação | 200; histórico ganha entradas com autor e observação | Funcionalidades básicas operacionais, porém o fluxo apresentou divergências do especificado. | PH Barros | 05/08/2026 | |
| T07 | Transição inválida | Coordenador tenta `REGISTRADA→ENCERRADA` | 409; nada gravado | Caso não executado devido à ausência da funcionalidade na versão atual. | PH Barros | 05/08/2026 | |
| T08 | Encerramento pela direção | Diretor encerra `RESOLVIDA`; depois tenta editar a ocorrência | Encerra com sucesso; edição posterior bloqueada (409) | O acesso sem autenticação foi corretamente bloqueado, conforme previsto, exigindo um token válido para acesso ao recurso. |  PH Barros |  05/08/2026  | |
| T09 | Acesso sem autenticação | Chamar `/ocorrencias` sem token | 401 | Após o reinício do serviço, a ocorrência e seu respectivo histórico permaneceram armazenados corretamente, confirmando a persistência dos dados. |  PH Barros | 05/08/2026 | |
| T10 | Persistência real | Registrar ocorrência → reiniciar serviço → consultar | A ocorrência e o histórico continuam lá (PostgreSQL) | Ocorrencia e historico continuaram | PH Barros | 05/08/2026 | |

## Casos adicionais da v3 (executar junto)

| ID | Cenário | Resultado esperado | Resultado obtido | Responsável | Evidência |
|---|---|---|---|---|---|
| T11 | Professor B lista/acessa ocorrência do professor A | Lista não mostra; detalhe/histórico → 403 | Caso não validado devido à ausência de uma segunda conta de professor para teste. | PH Barros | |
| T12 | Acentuação PT-BR | Registrar com categoria "Não fez atividade" e descrição com ã/ç/é | Foram identificadas inconsistências na persistência de caracteres acentuados. | PH Barros | |
| T13 | Edição pelo autor em `REGISTRADA` | 200 + histórico "Ocorrencia editada pelo autor" | Caso não executado, pois a funcionalidade não está disponível. | PH Barros | |
| T14 | Edição por terceiro (ADM) | 403 | Caso não executado, pois a funcionalidade não está disponível. | PH Barros | |
| T15 | Editar histórico (PUT/PATCH) | 405 | Caso não executado, pois a funcionalidade não está disponível. | PH Barros | |
| T16 | Dupla sessão simultânea | Coordenador e professor logados ao mesmo tempo operam sem interferência | Foi identificada interferência entre sessões simultâneas. Uma das sessões é encerrada enquanto a outra permanece autenticada. | PH Barros | |

## Ambiente de referência

- Navegador alvo: Chrome desktop (tablet como secundário).
- URL pública: preencher após o deploy.
- Credenciais de teste: contas do seed (`*@escola.polar`, uma por papel).
