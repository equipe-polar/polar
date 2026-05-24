# Decisao: migrar logica principal para Node.js + TypeScript

## Contexto

O projeto mantinha uma API Node.js que chamava scripts Python por `child_process`. Essa ponte fazia a API depender de outro runtime para executar regras de negocio e persistencia.

## Decisao

A logica principal passa a viver em `apps/api`, usando Node.js + TypeScript.

## Por Que Sair Da Logica Principal Em Python

- O projeto ja usa Node.js para expor a API HTTP.
- Manter regra em Python e transporte em Node cria duas superficies de erro.
- Testar fluxo HTTP real fica mais caro quando cada request executa outro processo.
- Evoluir autenticacao, permissoes e validacao em duas linguagens aumenta o custo.

## Por Que Evitar `child_process`

- Erros de serializacao viram erros de runtime.
- Performance e observabilidade ficam piores.
- Deploy exige Python, Node e caminhos locais corretos.
- A seguranca da entrada depende de duas camadas com contratos frageis.

## Por Que TypeScript Ajuda

- Enums oficiais para papeis, status e prioridade.
- Contratos explicitos para entidades.
- Refatoracao mais segura.
- Testes e controllers compartilham os mesmos tipos de dominio.

## Destino Do Python Antigo

Python foi movido para legado documentado. A API nova nao depende do legado.

## Etapas Da Migracao

1. Isolar legado.
2. Criar API TypeScript.
3. Migrar regras de autenticacao e permissoes.
4. Migrar ocorrencias, historico, notas e faltas.
5. Criar camada de repositorios.
6. Preparar schema PostgreSQL.
7. Validar com testes automatizados.

## Riscos

- Dados reais podem ter campos com nomes antigos.
- Frontend legado ainda usa alguns aliases em ingles.
- JSON temporario nao substitui transacoes reais de PostgreSQL.

## Validacao

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm build`
- Revisao manual dos documentos e endpoints.
