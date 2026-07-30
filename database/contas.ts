/**
 * Contas fixas de controle de usuarios do site e de teste. Uma por papel.
 * Todas compartilham a senha definida em SEED_SENHA_PADRAO.
 *
 * Os e-mails sao ASCII de proposito: a validacao de usuarios usa z.string().email(),
 * que rejeita acento e cedilha no local-part -- "coordenação@" quebraria a tela de
 * usuarios mesmo que o login funcionasse.
 *
 * Modulo separado do seed porque `database/seed.ts` executa main() no import;
 * quem so precisa da lista de contas importa daqui.
 */
export const CONTAS = {
  professor: { nome: "Professor POLAR", email: "professor@escola.polar" },
  coordenacao: { nome: "Coordenação POLAR", email: "coordenacao@escola.polar" },
  direcao: { nome: "Direção POLAR", email: "direcao@escola.polar" },
  adm: { nome: "Administração POLAR", email: "adm@escola.polar" },
  aluno: { nome: "Aluno POLAR", email: "aluno@escola.polar" }
} as const;

export type Conta = (typeof CONTAS)[keyof typeof CONTAS];
