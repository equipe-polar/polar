import type { OcorrenciaRepository } from "../../shared/database/repositories/ocorrencia.repository.js";

export class DashboardService {
  constructor(private readonly ocorrencias: OcorrenciaRepository) {}

  async resumo() {
    const ocorrencias = await this.ocorrencias.list();
    const porStatus: Record<string, number> = {};
    const porPrioridade: Record<string, number> = {};
    const porCategoria: Record<string, number> = {};

    for (const ocorrencia of ocorrencias) {
      porStatus[ocorrencia.status] = (porStatus[ocorrencia.status] ?? 0) + 1;
      porPrioridade[ocorrencia.prioridade] = (porPrioridade[ocorrencia.prioridade] ?? 0) + 1;
      porCategoria[ocorrencia.categoria] = (porCategoria[ocorrencia.categoria] ?? 0) + 1;
    }

    return {
      totalOcorrencias: ocorrencias.length,
      ocorrenciasPorStatus: porStatus,
      ocorrenciasPorPrioridade: porPrioridade,
      ocorrenciasPorCategoria: porCategoria
    };
  }
}
