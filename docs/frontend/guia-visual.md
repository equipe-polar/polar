# Guia visual do frontend P.O.L.A

## 1. Referencia estetica

O frontend segue uma linguagem institucional escolar: fundo claro, navegacao lateral, cards brancos, tabelas limpas e hierarquia visual objetiva.

A Sala do Futuro e a referencia deliberada de organizacao visual, porque e a plataforma que os estudantes ja usam diariamente e com a qual o P.O.L.A devera integrar. Aproximar a interface reduz o atrito de quem transita entre os dois sistemas. O que se aproxima e a **gramatica visual** -- estrutura de navegacao, hierarquia, uso de cor como sinal. Identidade, logo, textos e fluxo sao proprios do P.O.L.A, e a secao 3 continua valendo integralmente.

## 2. O que pode ser inspirado

- Fundo cinza-claro.
- Sidebar lateral clara.
- Cards brancos com sombra suave.
- Azul institucional como cor principal.
- Topbar com usuario logado.
- Breadcrumbs.
- Abas.
- Cards de resumo.
- Tabelas limpas.
- Botoes arredondados.

## 3. O que nao pode ser copiado

- Logo da Sala do Futuro.
- Logo GOV.BR.
- Textos oficiais.
- Nomes de menus sem sentido para o P.O.L.A.
- Telas identicas.
- Identidade visual exata.
- Dados reais de alunos.
- CPF, RG, endereco ou informacoes pessoais.

## 4. Cores oficiais do P.O.L.A

A fonte de verdade e `apps/web/src/styles/tokens.css`. Esta lista e o resumo; divergiu, o token vence.

- Background do conteudo: `#f4f5f7`
- Card e painel (sidebar, topbar, rodape): `#ffffff`
- Azul principal: `#1351b4`
- Azul forte: `#0c3d8d`
- Azul suave (item ativo do menu): `#e8f1fb`
- Ciano de marca (painel do login): `#1a9ec4` a `#10748f`
- Texto principal: `#1f2937`
- Texto secundario: `#667085`
- Sucesso: `#16844a`
- Analise/alerta: `#b86b00`
- Erro/prioridade alta: `#c73636`

Destaques dos cards de indicador (faixa superior de 4px, uma cor por indicador para
que o numero seja localizavel antes da leitura do rotulo):

- Azul `#2d9cdb` · Laranja `#f2a33c` · Vermelho `#eb5757` · Verde `#27ae60`

## 5. Componentes principais

Base de UI (`components/ui/`): `Button`, `Card`, `Input`, `Select`, `Table`, `Badge`,
`Modal`, `Tabs`, `Breadcrumb`.

Estrutura (`components/layout/`): `AppShell`, `Sidebar`, `Topbar`, `PageHeader`,
`AppFooter`, `UserMenu`, `PendenciasBell`.

De dominio (`features/ocorrencias/`): `StatusBadge`, `PrioridadeBadge`, `DiasEmAberto`.

## 6. Regras de layout

- Layout principal com sidebar e area de conteudo.
- Conteudo em cards brancos somente quando houver agrupamento funcional.
- Tabelas dentro de containers com rolagem horizontal em telas pequenas.
- Titulos curtos e objetivos.
- Acoes principais no `PageHeader`.

## 7. Regras de responsividade

- Abaixo de 1100px, o login passa de duas colunas para uma; abaixo de 760px o painel
  de apresentacao some e sobra o formulario.
- Abaixo de 980px, grids viram uma coluna e a sidebar vira gaveta acionada pela topbar.
- Tabelas mantem largura minima e rolagem horizontal **dentro do proprio card**.
- Formularios passam para uma coluna em mobile.

**Coluna unica se escreve `minmax(0, 1fr)`, nunca `1fr`.** As duas parecem iguais, mas
`1fr` equivale a `minmax(auto, 1fr)`: o conteudo com largura minima (a tabela) empurra a
coluna alem da viewport e a pagina inteira ganha rolagem horizontal. Foi exatamente esse
bug que apareceu no mobile depois de acrescentar uma coluna na tabela.

## 8. Regras de acessibilidade

- Inputs com `label`.
- Foco visivel.
- Botoes com texto claro.
- `aria-label` em acoes iconicas quando necessario.
- Status sempre exibido com texto, nao apenas cor.
- Mensagens de erro legiveis.
- Contraste adequado para textos e estados.
