import { apiRequest } from "./api";
import type {
  Aluno,
  AlunoComResumoOcorrencias,
  AlunoDetalhado,
  AlunoDetalhadoComResumoOcorrencias,
  ApiData,
  CreateAlunoPayload,
  CreateOcorrenciaPayload,
  CreateTurmaPayload,
  CreateUsuarioPayload,
  DashboardResumo,
  Falta,
  Nota,
  Ocorrencia,
  OcorrenciaDetalhada,
  OcorrenciaHistorico,
  RelatorioOcorrencias,
  StatusOcorrencia,
  Turma,
  UpdateAlunoPayload,
  UpdateTurmaPayload,
  UpdateUsuarioPayload,
  Usuario
} from "./domain";

function turmaName(turmas: Turma[], turmaId: string): string {
  return turmas.find((turma) => turma.id === turmaId)?.nome ?? "Turma nao encontrada";
}

function alunoDetalhado<T extends Aluno>(aluno: T, turmas: Turma[]): T & { turma: string } {
  return {
    ...aluno,
    turma: turmaName(turmas, aluno.turmaId)
  };
}



function ocorrenciaDetalhada(ocorrencia: Ocorrencia, alunos: Aluno[], turmas: Turma[]): OcorrenciaDetalhada {
  const aluno = alunos.find((item) => item.id === ocorrencia.alunoId);
  return {
    ...ocorrencia,
    aluno: aluno?.nome ?? "Aluno nao encontrado",
    turma: aluno ? turmaName(turmas, aluno.turmaId) : "Turma nao encontrada"
  };
}

export interface CopiarAnoTurmaPayload {
  origemId: string;
  nome: string;
  turno: string;
  alunos: string[];
}

export interface CopiarAnoLetivoPayload {
  anoOrigem: number;
  anoDestino: number;
  turmas: CopiarAnoTurmaPayload[];
}

export async function copiarAnoLetivo(
  payload: CopiarAnoLetivoPayload
): Promise<Turma[]> {
  const response = await apiRequest<ApiData<Turma[]>>("/turmas/copiar-ano", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return response.data;
}

export async function listHistoricoTurmas(
  alunoId: string
): Promise<AlunoTurmaHistorico[]> {
  const response = await apiRequest<ApiData<AlunoTurmaHistorico[]>>(
    `/alunos/${alunoId}/historico-turmas`
  );

  return response.data;
}

export async function listTurmas(): Promise<Turma[]> {
  const response = await apiRequest<ApiData<Turma[]>>("/turmas");
  return response.data;
}

export async function createTurma(payload: CreateTurmaPayload): Promise<Turma> {
  const response = await apiRequest<ApiData<Turma>>("/turmas", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updateTurma(id: string, payload: UpdateTurmaPayload): Promise<Turma> {
  const response = await apiRequest<ApiData<Turma>>(`/turmas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function listAlunos(): Promise<AlunoComResumoOcorrencias[]> {
  const response = await apiRequest<ApiData<AlunoComResumoOcorrencias[]>>("/alunos");
  return response.data;
}

export async function createAluno(payload: CreateAlunoPayload): Promise<Aluno> {
  const response = await apiRequest<ApiData<Aluno>>("/alunos", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updateAluno(id: string, payload: UpdateAlunoPayload): Promise<Aluno> {
  const response = await apiRequest<ApiData<Aluno>>(`/alunos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function getAluno(id: string): Promise<Aluno> {
  const response = await apiRequest<ApiData<Aluno>>(`/alunos/${id}`);
  return response.data;
}

export async function listAlunosDetalhados(): Promise<AlunoDetalhadoComResumoOcorrencias[]> {
  const [alunos, turmas] = await Promise.all([listAlunos(), listTurmas()]);
  return alunos.map((aluno) => alunoDetalhado(aluno, turmas));
}

export async function getAlunoDetalhado(id: string): Promise<AlunoDetalhado> {
  const [aluno, turmas] = await Promise.all([getAluno(id), listTurmas()]);
  return alunoDetalhado(aluno, turmas);
}

export async function listOcorrencias(): Promise<Ocorrencia[]> {
  const response = await apiRequest<ApiData<Ocorrencia[]>>("/ocorrencias");
  return response.data;
}

export async function getOcorrencia(id: string): Promise<Ocorrencia> {
  const response = await apiRequest<ApiData<Ocorrencia>>(`/ocorrencias/${id}`);
  return response.data;
}

export async function listOcorrenciasDetalhadas(): Promise<OcorrenciaDetalhada[]> {
  const [ocorrencias, alunos, turmas] = await Promise.all([listOcorrencias(), listAlunos(), listTurmas()]);
  return ocorrencias.map((ocorrencia) => ocorrenciaDetalhada(ocorrencia, alunos, turmas));
}

export async function getOcorrenciaDetalhada(id: string): Promise<OcorrenciaDetalhada> {
  const [ocorrencia, alunos, turmas] = await Promise.all([getOcorrencia(id), listAlunos(), listTurmas()]);
  return ocorrenciaDetalhada(ocorrencia, alunos, turmas);
}

export async function listHistoricoOcorrencia(id: string): Promise<OcorrenciaHistorico[]> {
  const response = await apiRequest<ApiData<OcorrenciaHistorico[]>>(`/ocorrencias/${id}/historico`);
  return response.data;
}

export async function createOcorrencia(payload: CreateOcorrenciaPayload): Promise<Ocorrencia> {
  const response = await apiRequest<ApiData<Ocorrencia>>("/ocorrencias", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updateOcorrenciaStatus(
  id: string,
  status: StatusOcorrencia,
  observacao?: string
): Promise<Ocorrencia> {
  const response = await apiRequest<ApiData<Ocorrencia>>(`/ocorrencias/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(observacao?.trim() ? { status, observacao: observacao.trim() } : { status })
  });
  return response.data;
}

export async function listNotasByAluno(alunoId: string): Promise<Nota[]> {
  const response = await apiRequest<ApiData<Nota[]>>(`/notas/alunos/${alunoId}`);
  return response.data;
}

export async function listFaltasByAluno(alunoId: string): Promise<Falta[]> {
  const response = await apiRequest<ApiData<Falta[]>>(`/faltas/alunos/${alunoId}`);
  return response.data;
}

export async function getDashboardResumo(): Promise<DashboardResumo> {
  const response = await apiRequest<ApiData<DashboardResumo>>("/dashboard/resumo");
  return response.data;
}

export async function getRelatorioOcorrencias(): Promise<RelatorioOcorrencias> {
  const response = await apiRequest<ApiData<RelatorioOcorrencias>>("/relatorios/ocorrencias");
  return response.data;
}

export async function listUsuarios(): Promise<Usuario[]> {
  const response = await apiRequest<ApiData<Usuario[]>>("/usuarios");
  return response.data;
}

export async function createUsuario(payload: CreateUsuarioPayload): Promise<Usuario> {
  const response = await apiRequest<ApiData<Usuario>>("/usuarios", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return response.data;
}

export async function updateUsuario(id: string, payload: UpdateUsuarioPayload): Promise<Usuario> {
  const response = await apiRequest<ApiData<Usuario>>(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
  return response.data;
}
