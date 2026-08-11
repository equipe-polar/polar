# EVIDÊNCIAS — TESTE DE CONCORRÊNCIA

**Documento de evidência para o Trabalho de Conclusão de Curso (TCC)**

**POLAR**  
Sistema institucional para registro, acompanhamento, resolução e encerramento de ocorrências escolares.


## 1. Objetivo

Validar o comportamento do POLAR quando dois usuários autenticados, com sessões abertas simultaneamente, acessam e operam sobre a mesma ocorrência.

O teste tem como foco verificar que uma ocorrência não pode ser resolvida duas vezes e que uma segunda tentativa de resolução retorna **HTTP 409 Conflict**, conforme o critério de aceite.

## 2. Ambiente do teste

| Informação | Valor |
|---|---|
| **Sistema** | POLAR |
| **Data** | 10/08/2026 |
| **Responsável** | Kauã Paulino |
| **URL** | https://polar-kappa.vercel.app/login |

## 3. Execução do teste

### Acesso simultâneo

A ocorrência foi acessada simultaneamente pelos usuários de **Coordenação** e **Professor**.

A coordenação tem a função de **“colocar em análise”**, enquanto o professor não pode efetuar essa função.

**PRINT 1 — Acesso simultâneo à mesma ocorrência**

**PRINT 2 — Evidência do acesso simultâneo**

### Primeira tentativa de resolução

A Coordenação realizou a operação de resolução da ocorrência conforme o fluxo permitido pelo sistema.

**Ação realizada:** o botão **“Colocar em análise”** foi clicado.

**Resultado observado:** a ocorrência saiu da categoria **“registrada”** para **“em análise”**.

**PRINT 3 — Primeira resolução**

### Segunda tentativa de resolução

Foi realizada a mesma tentativa na conta do professor. Como esperado, o site impede o professor de realizar modificações na ocorrência.

**Resultado observado:** o perfil de professor não possui permissão para realizar modificações na ocorrência.

**PRINT 4 — Segunda tentativa e HTTP 409**

## 4. Resultados observados

| Etapa | Usuário | Ação | Resultado |
|---|---|---|---|
| Acesso simultâneo | Coordenação | Acessar a ocorrência | Acesso permitido |
| Acesso simultâneo | Professor | Acessar a ocorrência | Acesso conforme as permissões do perfil |
| Primeira tentativa | Coordenação | Clicar em “Colocar em análise” | Ocorrência alterada de **REGISTRADA** para **EM_ANALISE** |
| Segunda tentativa | Professor | Tentar modificar a ocorrência | Operação impedida pelo sistema |

## 5. Conclusão

Os testes foram executados e, como esperado, o perfil de **Professor** não possui a opção de modificar ou editar qualquer ocorrência.

A **Coordenação** possui a opção de modificar as ocorrências dentro das permissões estabelecidas pelo fluxo do sistema.

O teste também evidencia a diferença de permissões entre os perfis de Coordenação e Professor durante o acesso e tratamento de uma mesma ocorrência.
