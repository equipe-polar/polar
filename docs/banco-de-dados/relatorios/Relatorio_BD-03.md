# BD-03 – MASSA DE DADOS DE TESTE AMPLIADA (M)

## Objetivo

O objetivo desta atividade foi realizar a população do banco de dados do sistema POLAR com dados fictícios e verificar se a base estava adequada para utilização no painel inicial da aplicação.

Foram utilizados dados simulados para representar um cenário real de utilização do sistema, permitindo testar a apresentação de informações variadas, os relacionamentos entre as tabelas e o indicador de tempo em aberto das ocorrências.

Para criar uma base de dados suficientemente rica para demonstração, foram inseridos dados fictícios nas principais estruturas utilizadas pelo sistema.

## Dados cadastrados

| Tipo de dado | Quantidade |
|---|---:|
| Usuários | 3 |
| Turmas | 4 |
| Alunos | 40 |
| Categorias de ocorrência | 6 |
| Ocorrências | 30 |
| Históricos de ocorrência | 30 |

Os 40 alunos foram distribuídos entre quatro turmas, com 10 alunos em cada turma.

As ocorrências foram distribuídas ao longo de três meses, abrangendo maio, junho e julho de 2026.

Após a execução dos comandos de entidades do banco, foram realizadas consultas SQL para confirmar se os registros haviam sido inseridos corretamente.

## Validação dos registros

Foi utilizada a consulta:

```sql
SELECT COUNT(*) AS total_alunos
FROM alunos;
```

O resultado esperado e obtido foi de **40 alunos**.

Para as ocorrências, foi utilizada:

```sql
SELECT COUNT(*) AS total_ocorrencias
FROM ocorrencias;
```

O resultado esperado e obtido foi de **30 ocorrências**.

Também foram realizadas consultas agrupadas para verificar a distribuição dos registros entre turmas, categorias, prioridades e status.

Dessa forma, foi possível confirmar que os registros foram inseridos na estrutura correta e que os relacionamentos entre as tabelas estavam funcionando.

**Critério atendido:** todos os registros planejados foram inseridos corretamente.

## Variedade dos dados

Para verificar se o painel inicial teria uma base de dados rica para demonstração, as ocorrências foram distribuídas entre diferentes categorias.

### Categorias

- Desrespeito
- Agressão verbal
- Atraso
- Não fez atividade
- Dano ao patrimônio
- Má conduta

### Prioridades

- Baixa
- Média
- Alta

### Status

- Registrada
- Em análise
- Resolvida
- Encerrada

Essa variedade permite que o painel apresente informações diferentes simultaneamente, evitando que todos os registros tenham o mesmo comportamento.

Também foram criadas ocorrências em diferentes datas, possibilitando que o sistema apresente informações relacionadas ao período em que cada ocorrência permaneceu aberta.

### Resultado

**Critério atendido:** a base de dados apresenta informações variadas para utilização e demonstração do painel inicial.

## Indicador de tempo em aberto

Um dos requisitos da atividade foi verificar se o indicador de tempo em aberto consegue apresentar as três faixas:

### Normal

Representa ocorrências que estão dentro de um período considerado adequado para tratamento.

### Alerta

Representa ocorrências que estão há mais tempo em aberto e necessitam de atenção.

### Crítico

Representa ocorrências que ultrapassaram um período considerado elevado e precisam de prioridade no tratamento.

Para possibilitar esse teste, as ocorrências foram distribuídas ao longo de três meses.

A existência de ocorrências com datas diferentes é fundamental para que o indicador consiga apresentar as três situações.

### Resultado

**Critério atendido:** a base possui registros com diferentes tempos de abertura, permitindo a apresentação das faixas **Normal**, **Alerta** e **Crítico** no painel, conforme as regras de classificação implementadas na aplicação.

## Execução do seed

O comando `pnpm seed` foi definido como responsável pela execução da rotina de população da base de dados.

O critério de aceite estabelece que:

- O `pnpm seed` deve executar sem erros.
- A execução deve realizar a inserção dos dados necessários sem apresentar erros relacionados a:
  - conexão com o banco;
  - tabelas inexistentes;
  - chaves estrangeiras;
  - registros duplicados;
  - tipos ENUM;
  - campos obrigatórios;
  - incompatibilidade de tipos.

A execução bem-sucedida indica que o processo de seed está compatível com a estrutura do banco POLAR.

### Resultado

**Critério de aceite:** aprovado quando o comando `pnpm seed` finalizar com código de sucesso e sem mensagens de erro.

## Dados disponíveis no painel

Com os dados inseridos, o painel inicial passa a possuir informações suficientes para demonstrar diferentes situações do sistema.

A base permite apresentar:

- quantidade de alunos;
- quantidade de ocorrências;
- ocorrências por categoria;
- ocorrências por prioridade;
- ocorrências por status;
- ocorrências distribuídas por período;
- responsáveis pelos registros;
- ocorrências com diferentes tempos de abertura.

Isso torna o painel mais próximo de um ambiente real, permitindo testar diferentes componentes da interface.

A distribuição das ocorrências entre diferentes datas também possibilita testar o indicador de tempo em aberto.

### Resultado

**Critério atendido:** o painel possui uma base de dados rica e variada para demonstração.

## Conclusão

A atividade teve como resultado a preparação de uma base de dados fictícia e diversificada para o sistema POLAR.

Os dados foram organizados de forma a permitir a validação dos principais componentes do painel inicial, principalmente o indicador de tempo em aberto.

Os critérios de aceite definidos para a atividade são considerados atendidos quando o `pnpm seed` é executado sem erros, todos os registros são inseridos corretamente, os dados respeitam a estrutura do banco e o painel consegue apresentar informações variadas.
