# P.O.L.A

Sistema web para registro e gestão de ocorrências institucionais, focado
em substituir processos informais por um fluxo estruturado, rastreável e
auditável.

------------------------------------------------------------------------

## Visão Geral

O Polar está sendo desenvolvido como um MVP para resolver um problema real em
ambiente escolar: a falta de controle e histórico de ocorrências.

O sistema permite:

-   registrar ocorrências;
-   acompanhar o status;
-   manter histórico completo;
-   garantir responsabilidade institucional.

------------------------------------------------------------------------

## Funcionalidades (MVP)

-   Cadastro de usuários
-   Registro de ocorrências
-   Controle de status:
    -   Registrada
    -   Em análise
    -   Em atendimento
    -   Resolvida
    -   Encerrada
-   Histórico automático (auditável)
-   Consulta de ocorrências

------------------------------------------------------------------------

## Tecnologias

-   Node.js
-   Python
-   SQLite
-   Supabase
-   HTML/CSS/JS

------------------------------------------------------------------------

## Estrutura do Projeto

      backend/
      frontend/
      docs/

------------------------------------------------------------------------

## Como Executar

### 1. Clonar repositório

    git clone <https://github.com/bazhish/P.O.L.A.git>
    cd polar

------------------------------------------------------------------------

### 2. Backend

    **************
Servidor rodando em:

    **************

------------------------------------------------------------------------

### 3. Frontend

    **************

------------------------------------------------------------------------

## Pradronização de Commit

- feat - nova funcionalidade
- fix - correção de bug
- docs - documentação
- style - formatação (sem mudar lógica)
- refactor - melhoria no código
- test - testes
- chore - tarefas internas (config, build)

A descrição precisa ser objetiva

Ex:
   
    feat: adiciona tela de login
    fix: corrige erro de autenticação

------------------------------------------------------------------------

## Fluxo do Sistema

1.  Usuário registra uma ocorrência\
2.  Ocorrência entra como **Registrada**\
3.  Evolui para **Em análise → Em atendimento → Resolvida → Encerrada**\
4.  Todas as ações são registradas no histórico

------------------------------------------------------------------------

## Regras do Sistema

-   status não pode pular etapas
-   histórico é imutável
-   permissões baseadas em papel do usuário
-   ocorrências encerradas não podem ser alteradas

------------------------------------------------------------------------

## Objetivo do Projeto

Validar um modelo de gestão de ocorrências baseado em:

-   controle de fluxo
-   rastreabilidade
-   responsabilidade institucional

------------------------------------------------------------------------

## Status

Em desenvolvimento (MVP)

------------------------------------------------------------------------

## Licença

Uso acadêmico / educacional
