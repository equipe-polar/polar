import { PapelUsuario } from "../domain.js";

export enum Permissao {
  REGISTRAR_OCORRENCIA = "registrar_ocorrencia",
  CONSULTAR_OCORRENCIAS = "consultar_ocorrencias",
  CONSULTAR_HISTORICO = "consultar_historico",
  CONSULTAR_ALUNOS = "consultar_alunos",
  ANALISAR_OCORRENCIA = "analisar_ocorrencia",
  RESOLVER_OCORRENCIA = "resolver_ocorrencia",
  ENCERRAR_OCORRENCIA = "encerrar_ocorrencia",
  GERENCIAR_USUARIOS = "gerenciar_usuarios",
  GERENCIAR_TURMAS = "gerenciar_turmas",
  GERENCIAR_ALUNOS = "gerenciar_alunos",
  GERENCIAR_PERMISSOES = "gerenciar_permissoes",
  GERENCIAR_CONFIGURACOES = "gerenciar_configuracoes",
  ACESSAR_AUDITORIA = "acessar_auditoria",
  CONSULTAR_RELATORIOS = "consultar_relatorios",
  REGISTRAR_NOTAS = "registrar_notas",
  REGISTRAR_FALTAS = "registrar_faltas",
  GERENCIAR_NOTIFICACOES = "gerenciar_notificacoes"
}

const permissoesPorPapel: Record<PapelUsuario, ReadonlySet<Permissao>> = {
  [PapelUsuario.PROFESSOR]: new Set([
    Permissao.REGISTRAR_OCORRENCIA,
    Permissao.CONSULTAR_OCORRENCIAS,
    Permissao.CONSULTAR_HISTORICO,
    Permissao.CONSULTAR_ALUNOS,
    Permissao.REGISTRAR_NOTAS,
    Permissao.REGISTRAR_FALTAS
  ]),
  [PapelUsuario.COORDENADOR]: new Set([
    Permissao.CONSULTAR_OCORRENCIAS,
    Permissao.CONSULTAR_HISTORICO,
    Permissao.CONSULTAR_ALUNOS,
    Permissao.ANALISAR_OCORRENCIA,
    Permissao.RESOLVER_OCORRENCIA,
    Permissao.CONSULTAR_RELATORIOS,
    Permissao.REGISTRAR_NOTAS,
    Permissao.REGISTRAR_FALTAS,
    Permissao.GERENCIAR_NOTIFICACOES
  ]),
  [PapelUsuario.DIRETOR]: new Set([
    Permissao.CONSULTAR_OCORRENCIAS,
    Permissao.CONSULTAR_HISTORICO,
    Permissao.CONSULTAR_ALUNOS,
    Permissao.ENCERRAR_OCORRENCIA,
    Permissao.CONSULTAR_RELATORIOS
  ]),
  [PapelUsuario.ADM]: new Set(Object.values(Permissao)),
  // Conta de aluno: somente leitura, e ainda assim o escopo em
  // escopoDeOcorrencias() devolve lista vazia enquanto nao existir vinculo
  // Usuario -> Aluno no modelo. A permissao abre a rota; o escopo decide o que sai.
  [PapelUsuario.ALUNO]: new Set([Permissao.CONSULTAR_OCORRENCIAS, Permissao.CONSULTAR_HISTORICO])
};

export function possuiPermissao(papel: PapelUsuario, permissao: Permissao): boolean {
  return permissoesPorPapel[papel].has(permissao);
}
