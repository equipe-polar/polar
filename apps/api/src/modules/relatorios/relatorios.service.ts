import { notFound } from "../../shared/errors/app-error.js";
import type { AlunoRepository } from "../../shared/database/repositories/aluno.repository.js";
import type { OcorrenciaRepository } from "../../shared/database/repositories/ocorrencia.repository.js";

export class RelatoriosService {
  constructor(
    private readonly ocorrencias: OcorrenciaRepository,
    private readonly alunos: AlunoRepository
  ) {}

  async ocorrenciasResumo() {
    const ocorrencias = await this.ocorrencias.list();
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const ocorrencia of ocorrencias) {
      byStatus[ocorrencia.status] = (byStatus[ocorrencia.status] ?? 0) + 1;
      byPriority[ocorrencia.prioridade] = (byPriority[ocorrencia.prioridade] ?? 0) + 1;
      byCategory[ocorrencia.categoria] = (byCategory[ocorrencia.categoria] ?? 0) + 1;
    }

    return {
      total: ocorrencias.length,
      byStatus,
      byPriority,
      byCategory,
      recent: ocorrencias.slice(-5).reverse()
    };
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
