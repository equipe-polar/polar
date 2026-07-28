# Declaração de Uso de IA no Projeto POLAR

## Por que este documento existe

Transparência sobre o uso de inteligência artificial é princípio central das regulações estudadas no curso — **EU AI Act** (obrigações de transparência), **PL 2338/2023** (marco legal brasileiro de IA) e **NIST AI Risk Management Framework** (governança e prestação de contas). Este documento aplica esses princípios ao próprio processo de desenvolvimento do TCC: declaramos onde a IA foi usada, como, e onde ela **não** foi usada.

## Onde a IA foi usada (ferramenta de produtividade)

| Área | Como | Responsabilidade humana |
| --- | --- | --- |
| Código (backend/frontend) | Assistentes de código (Claude, Codex, ChatGPT) para gerar e refatorar módulos a partir de especificações escritas pela equipe | Todo código passa por revisão, lint, typecheck e suíte de testes automatizados antes de entrar na branch principal |
| Documentação | Estruturação e redação assistida a partir do conteúdo produzido pela equipe (atas, decisões, modelos) | Conteúdo técnico validado contra o sistema real; decisões são da equipe |
| Testes | Geração de casos de teste a partir do plano T01–T10 escrito pela equipe | Execução e evidências são humanas |
| Estudo | Explicação de conceitos (Git Flow, normalização, JWT) para nivelamento dos membros | — |

## Onde a IA NÃO é usada

- **Dentro do produto**: o POLAR não embarca nenhum modelo de IA. Nenhuma decisão sobre aluno é automatizada — classificação, priorização e encerramento de ocorrências são atos humanos de professores, coordenação e direção. Isso elimina, por design, o principal risco das regulações estudadas: decisão automatizada sobre menores de idade.
- **Sobre dados reais de alunos**: nenhum dado pessoal de aluno foi enviado a serviços de IA. Os dados de demonstração são fictícios.

## Posição metodológica

O uso de IA como ferramenta de desenvolvimento é prática de mercado (pair programming assistido) e foi tratado como tal: acelera a produção, mas **não substitui** a definição de requisitos, as decisões de arquitetura, a revisão e a validação — que permanecem humanas e rastreáveis (commits, PRs, ADRs em `docs/arquitetura/`, plano de testes com evidências).

## Riscos considerados e mitigação

| Risco | Mitigação |
| --- | --- |
| Código gerado com defeito sutil | Testes de integração da API (Vitest/Supertest) + CI obrigatório em todo push |
| Dependência da ferramenta | Documentação completa do sistema permite manutenção sem IA |
| Alucinação em documentação | Toda afirmação técnica é conferível contra o código e o banco reais |
| Vazamento de dados nos prompts | Proibição de colar credenciais e dados reais em ferramentas de IA (regra de trabalho da equipe) |
