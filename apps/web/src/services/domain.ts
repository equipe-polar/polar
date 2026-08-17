export type PapelUsuario = "PROFESSOR" | "COORDENADOR" | "DIRETOR" | "ADM" | "ALUNO";

export type StatusOcorrencia = "REGISTRADA" | "EM_ANALISE" | "RESOLVIDA" | "ENCERRADA";

export type PrioridadeOcorrencia = "BAIXA" | "MEDIA" | "ALTA";

export interface ApiData<T> {
  data: T;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  ativo: boolean;
  precisaTrocarSenha?: boolean;
  ultimoLoginEm?: string | null;
}

export interface Turma {
  id: string;
  nome: string;
  anoLetivo: number;
  turno: string;
  ativa: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface Aluno {
  id: string;
  nome: string;
  matricula: string;
  turmaId: string;
  responsavelNome?: string;
  responsavelContato?: string;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface AlunoTurmaHistorico {
  id: string;
  alunoId: string;
  turmaId: string;
  anoLetivo: number;
  criadoEm: string;
}

export interface AlunoDetalhado extends Aluno {
  turma: string;
  totalOcorrencias: number;
  temOcorrenciaGrave: boolean;
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

export interface OcorrenciaDetalhada extends Ocorrencia {
  aluno: string;
  turma: string;
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

export interface DashboardResumo {
  totalOcorrencias: number;
  ocorrenciasPorStatus: Partial<Record<StatusOcorrencia, number>>;
  ocorrenciasPorPrioridade: Partial<Record<PrioridadeOcorrencia, number>>;
  ocorrenciasPorCategoria: Record<string, number>;
}

export interface RelatorioOcorrencias {
  total: number;
  byStatus: Partial<Record<StatusOcorrencia, number>>;
  byPriority: Partial<Record<PrioridadeOcorrencia, number>>;
  byCategory: Record<string, number>;
  recent: Ocorrencia[];
}

export interface CreateOcorrenciaPayload {
  alunoId: string;
  categoria: string;
  prioridade: PrioridadeOcorrencia;
  descricao: string;
  local?: string;
  testemunhas?: string;
}

export interface CreateAlunoPayload {
  nome: string;
  matricula: string;
  turmaId: string;
  responsavelNome?: string;
  responsavelContato?: string;
}

export interface UpdateAlunoPayload {
  nome?: string;
  matricula?: string;
  turmaId?: string;
  responsavelNome?: string;
  responsavelContato?: string;
  ativo?: boolean;
}

export interface CreateTurmaPayload {
  nome: string;
  anoLetivo: number;
  turno: string;
}

export interface UpdateTurmaPayload {
  nome?: string;
  anoLetivo?: number;
  turno?: string;
  ativa?: boolean;
}

export interface CreateUsuarioPayload {
  nome: string;
  email: string;
  papel: PapelUsuario;
  senha: string;
}

export interface UpdateUsuarioPayload {
  nome?: string;
  email?: string;
  papel?: PapelUsuario;
  ativo?: boolean;
}
