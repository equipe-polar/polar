# Legado Python

Este diretorio existe apenas como registro da fase anterior do P.O.L.A.

A logica principal do sistema foi migrada para `apps/api` em Node.js + TypeScript. A API ativa nao chama Python por `child_process` e nao depende de scripts deste diretorio.

## O que foi migrado

- Autenticacao e autorizacao.
- Usuarios e papeis.
- Turmas, alunos, notas e faltas.
- Ocorrencias, historico automatico e fluxo de status.
- Dashboard, relatorios, auditoria e notificacoes.
- Validacao forte de entrada.
- Testes de integracao da API.

## O que ainda precisa ser verificado

- Compatibilidade fina com dados reais exportados de `backend/banco_dados.json`.
- Revisao manual de telas antigas do frontend contra os novos endpoints.
- Migracao definitiva para PostgreSQL/Supabase.

## Quando remover

Remova este diretorio quando a migracao de dados reais tiver sido validada em ambiente de homologacao e nao houver mais necessidade de consultar a implementacao antiga.
