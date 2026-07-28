# Contribuindo

## Fluxo De Branches

```text
master
  ^
feature/nome-da-funcionalidade
```

- `master`: unica branch de longa duracao, protegida. Somente codigo estavel, sempre com CI verde.
- `feature/*` (ou `fix/*`): trabalho isolado por funcionalidade ou correcao, nasce de `master` e morre apos o merge.

Nao fazer push direto na `master`. PR obrigatorio.

## Criar Feature Branch

```bash
git checkout master
git pull
git checkout -b feature/nome-da-funcionalidade
```

## Antes Do Pull Request

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Pull Request

- Explique o problema resolvido.
- Liste mudancas principais.
- Informe testes executados.
- Aponte riscos e migracoes.

## Revisao De Codigo

Priorize:

- bugs e regressao de regra de negocio
- validacao de entrada
- autorizacao por papel
- vazamento de segredo ou hash
- cobertura de testes
- documentacao afetada

## Padrao De Commit

- `feat: adiciona modulo de notas`
- `fix: corrige fluxo de status`
- `docs: atualiza README`
- `test: cobre login invalido`
- `refactor: isola repositorio de alunos`
