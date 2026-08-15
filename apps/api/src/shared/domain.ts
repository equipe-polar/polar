export enum PapelUsuario {
  PROFESSOR = "PROFESSOR",
  COORDENADOR = "COORDENADOR",
  DIRETOR = "DIRETOR",
  ADM = "ADM",
  ALUNO = "ALUNO"
}

export enum StatusOcorrencia {
  REGISTRADA = "REGISTRADA",
  EM_ANALISE = "EM_ANALISE",
  RESOLVIDA = "RESOLVIDA",
  ENCERRADA = "ENCERRADA"
}

export enum PrioridadeOcorrencia {
  BAIXA = "BAIXA",
  MEDIA = "MEDIA",
  ALTA = "ALTA"
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  senhaHash: string;
  ativo: boolean;
  precisaTrocarSenha: boolean;
  tentativasLoginInvalidas: number;
  bloqueadoAte: string | null;
  ultimoLoginEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  precisaTrocarSenha: boolean;
  criadoEm: string;
  atualizadoEm: string;
  ultimoLoginEm: string | null;
}

export interface Turma {
  id: string;
  nome: string;
  anoLetivo: number;
  turno: string;
  ativa: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turmaId: string;
  responsavelNome: string;
  responsavelContato: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface AlunoTurmaHistorico {
  id: string;
  alunoId: string;
  turmaId: string;
  anoLetivo: number;
  criadoEm: string;
}

export interface Ocorrencia {
  id: string;
  alunoId: string;
  categoria: string;
  prioridade: PrioridadeOcorrencia;
  descricao: string;
  local?: string;
  testemunhas?: string;
  status: StatusOcorrencia;
  criadoPorId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface OcorrenciaHistorico {
  id: string;
  ocorrenciaId: string;
  status: StatusOcorrencia;
  acao: string;
  observacao: string | null;
  usuarioId: string;
  criadoEm: string;
}

export interface Nota {
  id: string;
  alunoId: string;
  disciplina: string;
  valor: number;
  etapa: string;
  professorId: string;
  data: string;
  criadoEm: string;
}

export interface Falta {
  id: string;
  alunoId: string;
  data: string;
  justificativa: string | null;
  registradaPorId: string;
  criadoEm: string;
}

export interface AuditLog {
  id: string;
  usuarioId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  metadata: Record<string, unknown>;
  criadoEm: string;
}

export interface DatabaseState {
  usuarios: Usuario[];
  turmas: Turma[];
  alunos: Aluno[];
  alunosTurmasHistorico: AlunoTurmaHistorico[];
  ocorrencias: Ocorrencia[];
  ocorrenciaHistorico: OcorrenciaHistorico[];
  notas: Nota[];
  faltas: Falta[];
  auditLogs: AuditLog[];
}

export function usuarioPublico(usuario: Usuario): UsuarioPublico {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    ativo: usuario.ativo,
    precisaTrocarSenha: usuario.precisaTrocarSenha,
    criadoEm: usuario.criadoEm,
    atualizadoEm: usuario.atualizadoEm,
    ultimoLoginEm: usuario.ultimoLoginEm
  };
}
