Evidências — Teste de Concorrência
Objetivo
Validar o comportamento do POLAR quando dois usuários autenticados, com
sessões abertas simultaneamente, acessam e operam sobre a mesma ocorrência.
O teste tem como foco verificar que uma ocorrência não pode ser resolvida duas
vezes e que uma segunda tentativa de resolução retorna HTTP 409 Conflict,
conforme o critério de aceite.

Ambiente do teste
Sistema       POLAR
Data          10/08/2026
Responsável Kauã Paulino
URL           https://polar-kappa.vercel.app/login

PRINT 1 — Acesso simultâneo à mesma ocorrência




Execução do teste
. Acesso simultâneo
A ocorrência foi acessada simultaneamente pelos usuários de Coordenação e
Professor.
Resultado observado:
  A coodernação tem a função de “colocar em analise”, enquanto o
professor não pode efetuar essa função

PRINT 2 — Evidência do acesso simultâneo




. Primeira tentativa de resolução
A Coordenação realizou a operação de resolução da ocorrência conforme o fluxo
permitido pelo sistema.
Ação realizada: o botão “Colocar em analise” foi clicado
Resultado observado: a ocorrencia saiu da categoria “registrada” para “em
analise”

PRINT 3 — Primeira resolução
. Segunda tentativa de resolução
 Tentei realizar o mesmo teste na conta do professor, e como esperando, o site
impede o professor de realizar a tarefa de realizar modificações na ocorrência

PRINT 4 — Segunda tentativa e HTTP 409




8. Conclusão
Os testes foram executados e como esperado o perfil de professor não tem a opção
de modificar ou editar qualquer ocorrência, apenas a coordenação tem a opção de
modificar as ocorrências
