# Fluxo De Ocorrencias

## Registro

O professor registra uma ocorrencia com:

- aluno valido
- categoria
- prioridade (`BAIXA`, `MEDIA`, `ALTA`)
- descricao com conteudo suficiente

A ocorrencia nasce com status `REGISTRADA` e cria historico automatico.

## Analise

O coordenador pode alterar `REGISTRADA` para `EM_ANALISE`.

## Resolucao

O coordenador pode alterar `EM_ANALISE` para `RESOLVIDA`.

## Encerramento

O diretor pode alterar `RESOLVIDA` para `ENCERRADA`.

## Historico

Cada transicao cria registro em `ocorrenciaHistorico`. Nao ha rota de edicao manual do historico. Tentativas de edicao retornam `405`.

## Regras De Transicao

```text
REGISTRADA -> EM_ANALISE -> RESOLVIDA -> ENCERRADA
```

- Nao pode pular status.
- Professor nao altera status.
- Coordenador nao encerra.
- Diretor nao coloca em analise nem resolve.
- Ocorrencia encerrada nao pode ser alterada.
- Ocorrencia duplicada em janela curta e bloqueada.

## Permissoes Por Papel

| Papel | Acoes |
| --- | --- |
| PROFESSOR | registrar ocorrencia, consultar ocorrencias permitidas, consultar historico permitido |
| COORDENADOR | consultar, colocar em analise, resolver, relatorios operacionais |
| DIRETOR | consultar, encerrar, relatorios gerais |
| ADM | administrar cadastros, permissoes, configuracoes e auditoria |
