import { badRequest, notFound } from "../../shared/errors/app-error.js";
import type { AlunoRepository } from "../../shared/database/repositories/aluno.repository.js";
import type { OcorrenciaRepository } from "../../shared/database/repositories/ocorrencia.repository.js";
import type { TurmaRepository } from "../../shared/database/repositories/turma.repository.js";
import type { AlunoTurmaHistoricoRepository } from "../../shared/database/repositories/aluno-turma-historico.repository.js";

export interface RelatorioOcorrenciasFiltro {
  turmaId?: string;
  dataInicio?: string;
  dataFim?: string;
}

export class RelatoriosService {
  constructor(
    private readonly ocorrencias: OcorrenciaRepository,
    private readonly alunos: AlunoRepository,
    private readonly turmas: TurmaRepository,
    private readonly alunosTurmasHistorico: AlunoTurmaHistoricoRepository
  ) {}

  async ocorrenciasResumo(filtro: RelatorioOcorrenciasFiltro = {}) {
    const [todasOcorrencias, alunos, turmas] = await Promise.all([
      this.ocorrencias.list(),
      this.alunos.list(),
      this.turmas.list()
    ]);
    const inicio = this.limiteData(filtro.dataInicio, false);
    const fim = this.limiteData(filtro.dataFim, true);
    if (inicio && fim && inicio.getTime() > fim.getTime()) {
      throw badRequest("A data inicial deve ser anterior ou igual a data final.");
    }

    const alunoPorId = new Map(alunos.map((aluno) => [aluno.id, aluno]));
    const turmaPorId = new Map(turmas.map((turma) => [turma.id, turma]));
    const anosDasOcorrencias = [...new Set(todasOcorrencias.map((ocorrencia) => new Date(ocorrencia.criadoEm).getUTCFullYear()))];
    const historicos = (await Promise.all(anosDasOcorrencias.map((ano) => this.alunosTurmasHistorico.listByAno(ano)))).flat();
    const turmaHistoricaPorAlunoEAno = new Map(historicos.map((item) => [`${item.alunoId}:${item.anoLetivo}`, item.turmaId]));
    const ocorrencias = todasOcorrencias.filter((ocorrencia) => {
      const aluno = alunoPorId.get(ocorrencia.alunoId);
      if (!aluno) return false;
      const criadaEm = new Date(ocorrencia.criadoEm);
      const turmaId = turmaHistoricaPorAlunoEAno.get(`${aluno.id}:${criadaEm.getUTCFullYear()}`) ?? aluno.turmaId;
      return (
        (!filtro.turmaId || turmaId === filtro.turmaId) &&
        (!inicio || criadaEm.getTime() >= inicio.getTime()) &&
        (!fim || criadaEm.getTime() <= fim.getTime())
      );
    });
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    const byTurma = new Map<string, number>();
    const byPeriodo = new Map<string, number>();

    for (const ocorrencia of ocorrencias) {
      byStatus[ocorrencia.status] = (byStatus[ocorrencia.status] ?? 0) + 1;
      byPriority[ocorrencia.prioridade] = (byPriority[ocorrencia.prioridade] ?? 0) + 1;
      byCategory[ocorrencia.categoria] = (byCategory[ocorrencia.categoria] ?? 0) + 1;
      const aluno = alunoPorId.get(ocorrencia.alunoId);
      const anoLetivo = new Date(ocorrencia.criadoEm).getUTCFullYear();
      const turmaId = aluno ? turmaHistoricaPorAlunoEAno.get(`${aluno.id}:${anoLetivo}`) ?? aluno.turmaId : undefined;
      const turma = turmaId ? turmaPorId.get(turmaId) : undefined;
      const nomeTurma = turma?.nome ?? "Turma nao encontrada";
      byTurma.set(nomeTurma, (byTurma.get(nomeTurma) ?? 0) + 1);
      const data = new Date(ocorrencia.criadoEm);
      const periodo = `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, "0")}`;
      byPeriodo.set(periodo, (byPeriodo.get(periodo) ?? 0) + 1);
    }

    return {
      total: ocorrencias.length,
      byStatus,
      byPriority,
      byCategory,
      recent: [...ocorrencias].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 5),
      byTurma: [...byTurma.entries()]
        .map(([nome, total]) => ({ nome, total }))
        .sort((a, b) => a.nome.localeCompare(b.nome)),
      byPeriodo: [...byPeriodo.entries()]
        .map(([periodo, total]) => ({ periodo, total }))
        .sort((a, b) => a.periodo.localeCompare(b.periodo))
    };
  }

  private limiteData(valor: string | undefined, fimDoDia: boolean): Date | null {
    if (!valor) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      throw badRequest("As datas do relatório devem estar no formato AAAA-MM-DD.");
    }
    const data = new Date(`${valor}T${fimDoDia ? "23:59:59.999" : "00:00:00.000"}Z`);
    if (Number.isNaN(data.getTime())) {
      throw badRequest("Data de relatório inválida.");
    }
    return data;
  }

  async aluno(id: string) {
    const aluno = await this.alunos.findById(id);
    if (!aluno) {
      throw notFound("Aluno nao encontrado.");
    }

    const ocorrencias = (await this.ocorrencias.list()).filter((ocorrencia) => ocorrencia.alunoId === id);
    const byStatus: Record<string, number> = {};
    for (const ocorrencia of ocorrencias) {
      byStatus[ocorrencia.status] = (byStatus[ocorrencia.status] ?? 0) + 1;
    }

    return {
      aluno,
      totalOcorrencias: ocorrencias.length,
      byStatus,
      ocorrencias
    };
  }
}
