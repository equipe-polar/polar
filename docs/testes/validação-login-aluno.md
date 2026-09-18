# Evidências de testes — Validação do perfil de aluno

## Objetivo

Validar o comportamento do perfil `ALUNO` no sistema POLAR, verificando o acesso ao sistema, o conteúdo das telas e as permissões desse papel.

## Ambiente

* Aplicação: POLAR
* Perfil utilizado: Aluno
* Usuário: `aluno@escola.polar`
* Navegador: Google Chrome
* Ambiente: desenvolvimento local
* Branch: `feature/qa-04-validacao-aluno`

---

## Caso 1 — Login com perfil de aluno

**Entrada utilizada**

* Usuário: `aluno@escola.polar`
* Senha: `SenhaDemo1!`

**Resultado esperado**

O usuário deve conseguir realizar o login e acessar o sistema utilizando o perfil `ALUNO`.

**Resultado obtido**

Login realizado com sucesso e acesso ao sistema efetuado com o perfil de aluno.

**Status:** ✅ Sucesso

![Evidência do login com perfil de aluno](./Evidências/QA-04-login.png)

---

## Caso 2 — Listagem de ocorrências vazia

**Entrada utilizada**

* Perfil: `ALUNO`
* Tela: Ocorrências

**Resultado esperado**

A listagem de ocorrências deve permanecer vazia para o perfil de aluno.


**Status:** ✅ Acesso bloqueado

![Evidência da listagem de ocorrências](./Evidências/QA-04-listagem.png)

---

## Caso 3 — Painel sem dados

**Entrada utilizada**

* Perfil: `ALUNO`
* Tela: Dashboard/Painel

**Resultado esperado**

O painel deve ser exibido sem dados de ocorrências para o perfil de aluno.


**Status:** ✅ Acesso bloqueado

![Evidência do painel sem dados](./Evidências/QA-04-dashboard.png)

---

## Caso 4 — Acesso aos relatórios

**Entrada utilizada**

* Perfil: `ALUNO`
* Recurso: Relatórios

**Resultado esperado**

O sistema deve impedir o acesso ao recurso e retornar erro HTTP `403 Forbidden`.

**Resultado obtido**

O acesso foi bloqueado e a aplicação apresentou a tela de `Acesso negado`.

**Status:** ✅ Acesso bloqueado

![Evidência do acesso aos relatórios](./Evidências/QA-04-relatorios-403.png)

> Observação: confirmar o código HTTP `403` na aba **Network** do navegador para registrar a evidência técnica completa do critério de aceite.

---

## Caso 5 — Acesso à auditoria

**Entrada utilizada**

* Perfil: `ALUNO`
* Recurso: Auditoria

**Resultado esperado**

O sistema deve impedir o acesso ao recurso e retornar erro HTTP `403 Forbidden`.

**Resultado obtido**

O acesso foi bloqueado e a aplicação apresentou a tela de `Acesso negado`.

**Status:** ✅ Acesso bloqueado

![Evidência do acesso à auditoria](./Evidências/QA-04-auditoria-403.png)

> Observação: confirmar o código HTTP `403` na aba **Network** do navegador para registrar a evidência técnica completa do critério de aceite.

---

## Conclusão

Os testes do perfil `ALUNO` foram iniciados no ambiente de desenvolvimento local.

O login foi realizado com sucesso e os acessos às áreas de relatórios e auditoria foram bloqueados pela aplicação, apresentando a tela de `Acesso negado`.

Ainda é necessário registrar os resultados da listagem de ocorrências e do painel, além de confirmar tecnicamente o código HTTP `403` nas tentativas de acesso a relatórios e auditoria.

Após a conclusão dessas verificações, o relatório poderá ser atualizado com o resultado final da QA-04.
