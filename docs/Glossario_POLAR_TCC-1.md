# GLOSSÁRIO DO SISTEMA POLAR

**Documento de referência para o Trabalho de Conclusão de Curso (TCC)**

**POLAR**  
Sistema institucional para registro, acompanhamento, resolução e encerramento de ocorrências escolares.

**Versão:** Documento canônico do produto  
**Finalidade:** padronizar conceitos, papéis, estados e regras do sistema

## 1. Apresentação

Este glossário reúne os principais termos, conceitos e regras utilizados no desenvolvimento do POLAR. Seu objetivo é garantir uma linguagem única em toda a documentação do projeto, evitando ambiguidades na descrição das funcionalidades e do fluxo institucional de ocorrências.

O POLAR foi concebido para substituir registros informais e dispersos de ocorrências disciplinares e pedagógicas por um processo digital, rastreável e baseado em permissões. O fluxo institucional segue uma sequência obrigatória:

**Professor registra → Coordenação analisa e resolve → Direção encerra**

### Fluxo oficial

**PROFESSOR registra → COORDENAÇÃO analisa e resolve → DIREÇÃO encerra**

## 2. Glossário de termos

### Aluno
Entidade que representa o estudante cadastrado no sistema. O registro de Aluno é independente da conta de usuário com papel ALUNO. Enquanto não houver vínculo entre essas duas entidades, a conta ALUNO permanece sem acesso a ocorrências, seguindo a regra de negar por padrão.

### Ocorrência
Registro institucional de um fato disciplinar ou pedagógico relacionado a um aluno. É criada pelo professor e contém, entre outras informações, aluno, categoria, prioridade, descrição, autor, data e status. O termo oficial é “ocorrência”; não devem ser utilizados “chamado”, “ticket” ou “tarefa”.

### Histórico da ocorrência
Conjunto de registros gerados automaticamente a cada ação relevante realizada sobre uma ocorrência. O histórico é append-only, ou seja, novos registros podem ser acrescentados, mas os registros existentes não podem ser editados ou excluídos.

### Histórico permanente por aluno
Visão que reúne as ocorrências relacionadas a um determinado aluno ao longo do tempo. Seu objetivo principal é permitir que a gestão identifique reincidências e tome decisões com base no histórico institucional.

### Reincidência
Identificação da repetição de ocorrências envolvendo o mesmo aluno. O acompanhamento da reincidência é um dos principais valores do POLAR, pois transforma registros isolados em informação útil para a gestão escolar.

### Fluxo institucional
Sequência obrigatória de responsabilidades no tratamento de uma ocorrência: o professor registra, a coordenação analisa e resolve, e a direção encerra. O fluxo não pode ser burlado ou ter etapas puladas.

### Estado
Situação atual de uma ocorrência dentro do fluxo institucional. O POLAR possui exatamente quatro estados oficiais: **REGISTRADA, EM_ANALISE, RESOLVIDA e ENCERRADA**.

### REGISTRADA
Estado inicial de toda ocorrência após seu registro pelo professor. Indica que a ocorrência foi cadastrada e aguarda análise da coordenação.

### EM_ANALISE
Estado que indica que a coordenação assumiu a análise da ocorrência. A mudança para esse estado é realizada exclusivamente pela coordenação.

### RESOLVIDA
Estado que indica que a coordenação concluiu o tratamento da ocorrência. A transição para RESOLVIDA exige observação e é exclusiva da coordenação. Ser resolvida não significa estar formalmente encerrada.

### ENCERRADA
Estado final da ocorrência. O encerramento é um ato institucional formal realizado exclusivamente pela direção, com observação. Após encerrada, a ocorrência torna-se somente leitura.

### Transição de estado
Mudança controlada de um estado para outro. O POLAR possui exatamente três transições oficiais:

- **REGISTRADA → EM_ANALISE**
- **EM_ANALISE → RESOLVIDA**
- **RESOLVIDA → ENCERRADA**

Cada transição é vinculada a um papel específico.

### Rastreabilidade
Capacidade de identificar o que foi feito, por quem e quando. No POLAR, é garantida principalmente pelo histórico automático e imutável das ações.

### Append-only
Modelo de histórico no qual informações podem apenas ser acrescentadas. Registros anteriores não são alterados nem excluídos, preservando a integridade e a rastreabilidade do processo.

### RBAC
Controle de acesso baseado em papéis (Role-Based Access Control). As permissões são definidas de acordo com o papel do usuário e aplicadas no backend. A interface pode ocultar opções, mas a segurança não depende dela.

### Backend
Parte do sistema responsável por processar regras, autenticação, permissões, validações, transições de estado e persistência dos dados. No POLAR, o backend é a camada que efetivamente garante o RBAC.

### Autenticação JWT
Mecanismo utilizado para identificar usuários por meio de JSON Web Tokens (JWT). Após o login, o token permite que o backend reconheça a identidade e o papel do usuário nas requisições.

### Senha em hash
Forma segura de armazenamento de senhas em que a senha original não é salva diretamente no banco de dados. O POLAR utiliza bcrypt para gerar o hash das senhas.

### bcrypt
Algoritmo utilizado pelo sistema para realizar o hash das senhas antes de armazená-las. Seu uso reduz o risco associado ao armazenamento de senhas em texto puro.

### Zod
Biblioteca utilizada para validação e definição de esquemas de entrada. No POLAR, é responsável por validar os dados recebidos pela aplicação, incluindo textos com acentuação em português do Brasil.

### PostgreSQL
Sistema gerenciador de banco de dados relacional utilizado para a persistência real do POLAR. Os dados devem permanecer armazenados mesmo após uma reinicialização da aplicação.

### Persistência
Capacidade de manter os dados armazenados de forma duradoura. No MVP, a persistência é realizada em PostgreSQL e deve sobreviver a reinicializações do sistema.

### Ocorrência somente leitura
Regra aplicada às ocorrências no estado ENCERRADA. Depois do encerramento, os dados não podem mais ser alterados.

### Observação
Informação textual registrada durante determinadas transições de estado. A resolução pela coordenação e o encerramento pela direção devem conter observação.

### Professor
Papel responsável por registrar ocorrências, consultar e editar as próprias ocorrências enquanto estiverem em REGISTRADA, além de registrar notas e faltas. Não pode alterar o status nem visualizar ocorrências de outros professores.

### Coordenador
Papel responsável por visualizar todas as ocorrências, iniciar a análise e concluir a resolução. Pode realizar REGISTRADA → EM_ANALISE e EM_ANALISE → RESOLVIDA, sendo esta última acompanhada de observação. Não pode encerrar ocorrências nem editar o histórico.

### Diretor
Papel responsável pelo encerramento institucional. Pode visualizar todas as ocorrências e realizar exclusivamente a transição RESOLVIDA → ENCERRADA, com observação. Não pode analisar ou resolver ocorrências.

### ADM
Papel administrativo responsável por gerenciar usuários, turmas, alunos, configurações e auditoria. Não pode alterar o status de ocorrências nem editar ocorrências de terceiros.

### ALUNO (papel de usuário)
Conta que pode autenticar no sistema, mas possui acesso somente leitura. Como ainda não existe vínculo entre Usuario e Aluno, a regra é negar por padrão: a listagem de ocorrências fica vazia e o dashboard permanece zerado.

### Usuário
Conta utilizada para autenticação e controle de acesso ao sistema. O usuário possui um papel, como PROFESSOR, COORDENADOR, DIRETOR, ADM ou ALUNO.

### Autor da ocorrência
Usuário responsável pelo registro da ocorrência. O autor não é informado livremente pelo cliente; ele é derivado pelo backend a partir do usuário autenticado.

### Data da ocorrência
Data e horário associados ao registro da ocorrência. Assim como o autor, devem ser definidos pelo backend, evitando que o cliente manipule essas informações.

### Prioridade
Classificação da urgência ou relevância da ocorrência. O POLAR possui exatamente três valores: **BAIXA, MEDIA e ALTA**.

### Categoria
Classificação do tipo de ocorrência registrada. É uma informação obrigatória para caracterizar o fato no momento do cadastro.

### Descrição
Relato textual do fato ocorrido. Para garantir um mínimo de informação útil, a descrição deve possuir pelo menos 10 caracteres.

### Notas e faltas
Informações acadêmicas que podem ser registradas pelo professor. Fazem parte do escopo desejável do sistema, mas não constituem o núcleo obrigatório do MVP.

### Dashboard
Painel visual para apresentação de indicadores do sistema. É uma funcionalidade desejável, podendo apresentar informações operacionais sem substituir o histórico de ocorrências.

### Relatórios
Recursos destinados à organização e apresentação de informações das ocorrências. São considerados funcionalidades desejáveis, não obrigatórias para o MVP.

### Notificações internas
Avisos apresentados dentro do sistema para informar usuários sobre acontecimentos ou mudanças relevantes. Constituem funcionalidade bônus, fora do núcleo obrigatório do MVP.

### Auditoria
Recurso de acompanhamento de ações administrativas e operacionais realizadas no sistema. É desejável e complementa a rastreabilidade proporcionada pelo histórico das ocorrências.

### MVP
Produto Mínimo Viável. No POLAR, corresponde ao conjunto obrigatório de funcionalidades que precisa funcionar para que o projeto seja considerado concluído.

### Definition of Done
Critério utilizado para considerar uma funcionalidade efetivamente concluída. No POLAR, uma funcionalidade só está pronta quando funciona pela interface, persiste no banco, respeita as permissões e aparece corretamente nas listagens.

### Critério de aceite
Conjunto de condições que deve ser cumprido para validar o MVP. O roteiro principal possui seis passos:

1. login do professor;
2. registro da ocorrência;
3. visualização pela coordenação;
4. resolução pela coordenação com observação;
5. encerramento pela direção;
6. conferência do histórico com autores e datas corretos.

### Cadastro
Operação de inclusão de usuários, turmas e alunos no sistema. O cadastro é realizado por usuários autorizados e não existe auto-cadastro.

### Sem auto-cadastro
Regra segundo a qual usuários não criam suas próprias contas. O gerenciamento das contas ocorre de forma institucional por meio de usuários autorizados.

### Segurança por padrão
Princípio segundo o qual acessos não explicitamente permitidos devem ser negados. No papel ALUNO, por exemplo, a ausência de vínculo com um registro de Aluno resulta em nenhuma ocorrência exibida.

### Sistema institucional
Característica do POLAR que o diferencia de sistemas de suporte ou help desk. O sistema representa um processo formal da escola, com responsabilidades, etapas, registros e encerramento institucional.

## Estados oficiais

Conjunto fechado de estados permitidos para uma ocorrência. São apenas: **REGISTRADA, EM_ANALISE, RESOLVIDA e ENCERRADA**. Não existe o estado “Em atendimento”.

## 3. Matriz resumida de papéis e permissões

| Papel | Principais permissões | Restrições principais |
|---|---|---|
| **PROFESSOR** | Registrar ocorrência; consultar/editar próprias em REGISTRADA; registrar notas e faltas. | Não altera status; não visualiza ocorrências de outros professores. |
| **COORDENADOR** | Visualizar todas; REGISTRADA → EM_ANALISE; EM_ANALISE → RESOLVIDA com observação; relatórios operacionais. | Não encerra; não pula etapas; não edita histórico. |
| **DIRETOR** | Visualizar todas; RESOLVIDA → ENCERRADA com observação; relatórios gerais. | Não analisa; não resolve; não edita histórico. |
| **ADM** | Gerenciar usuários, turmas, alunos, configurações e auditoria. | Não altera status de ocorrência; não edita ocorrência de terceiros. |
| **ALUNO** | Autenticar; acesso somente leitura. | Sem vínculo Usuario–Aluno: nenhuma ocorrência é exibida; não registra nem altera ocorrências. |

## 4. Máquina de estados

| Estado | Significado | Próxima ação permitida |
|---|---|---|
| **REGISTRADA** | Ocorrência criada e aguardando análise. | COORDENADOR: → EM_ANALISE |
| **EM_ANALISE** | Ocorrência em análise pela coordenação. | COORDENADOR: → RESOLVIDA + observação |
| **RESOLVIDA** | Tratamento concluído pela coordenação. | DIRETOR: → ENCERRADA + observação |
| **ENCERRADA** | Encerramento institucional formal. | Nenhuma; somente leitura. |

## 5. Regras essenciais do MVP

1. A autenticação utiliza JWT e senhas armazenadas em hash com bcrypt.
2. O RBAC é aplicado no backend; ocultar opções na interface não é considerado mecanismo de segurança.
3. Usuários, turmas e alunos são cadastrados sem auto-cadastro.
4. Uma ocorrência exige aluno, categoria, prioridade, descrição com no mínimo 10 caracteres, autor e data definidos pelo backend.
5. O status inicial de uma ocorrência é sempre REGISTRADA.
6. Existem exatamente quatro estados oficiais e três transições; nenhuma etapa pode ser pulada.
7. O histórico é automático, append-only e não possui rota de edição ou exclusão. Tentativa de edição/exclusão do histórico deve resultar em HTTP 405.
8. Ocorrências ENCERRADAS são somente leitura.
9. Os dados devem ser persistidos em PostgreSQL e sobreviver a reinicializações.
10. A validação de entrada é feita com Zod, incluindo suporte adequado à acentuação em português do Brasil.

## 6. Termos que devem ser evitados

| Evitar | Usar no lugar |
|---|---|
| Chamado | Ocorrência |
| Ticket | Ocorrência |
| Tarefa | Ocorrência |
| Em atendimento | Usar apenas os quatro estados oficiais |
| Encerrada = resolvida | Distinguir RESOLVIDA de ENCERRADA |

## 7. Escopo resumido

**Obrigatório:** autenticação, RBAC, cadastros institucionais, registro de ocorrências, máquina de estados, histórico imutável, reincidência por aluno, PostgreSQL e validação de entrada.

**Desejável:** dashboard, filtros, notas e faltas, notificações internas, relatórios, auditoria, observações/encaminhamentos e deploy público.

**Fora de escopo:** aplicativo mobile nativo, multi-escola, integrações externas, comunicação com pais, BI complexo, IA embarcada e uso do aluno como usuário operacional.
