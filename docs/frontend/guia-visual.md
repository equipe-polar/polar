# Guia visual do frontend P.O.L.A

## 1. Referencia estetica

O frontend segue uma linguagem institucional escolar: fundo claro, navegacao lateral, cards brancos, tabelas limpas e hierarquia visual objetiva.

A Sala do Futuro foi usada apenas como referencia ampla de organizacao institucional. O P.O.L.A possui identidade propria, logo proprio, textos proprios e fluxo proprio.

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

- Background: `#eef3f8`
- Card: `#ffffff`
- Azul principal: `#1d5fa7`
- Azul forte: `#124b84`
- Texto principal: `#1f2937`
- Texto secundario: `#667085`
- Sucesso: `#16844a`
- Analise/alerta: `#b86b00`
- Erro/prioridade alta: `#c73636`

## 5. Componentes principais

- `AppShell`
- `Sidebar`
- `Topbar`
- `PageHeader`
- `Button`
- `Card`
- `Input`
- `Select`
- `Table`
- `Badge`
- `Modal`
- `Tabs`
- `Breadcrumb`

## 6. Regras de layout

- Layout principal com sidebar e area de conteudo.
- Conteudo em cards brancos somente quando houver agrupamento funcional.
- Tabelas dentro de containers com rolagem horizontal em telas pequenas.
- Titulos curtos e objetivos.
- Acoes principais no `PageHeader`.

## 7. Regras de responsividade

- Abaixo de 980px, grids viram uma coluna.
- Sidebar recolhe para navegacao acionada pela topbar.
- Tabelas mantem largura minima e rolagem horizontal.
- Formularios passam para uma coluna em mobile.

## 8. Regras de acessibilidade

- Inputs com `label`.
- Foco visivel.
- Botoes com texto claro.
- `aria-label` em acoes iconicas quando necessario.
- Status sempre exibido com texto, nao apenas cor.
- Mensagens de erro legiveis.
- Contraste adequado para textos e estados.
