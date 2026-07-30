import type { OcorrenciaRepository } from "../../shared/database/repositories/ocorrencia.repository.js";
import type { Ocorrencia } from "../../shared/domain.js";
import { escopoDeOcorrencias } from "../ocorrencias/ocorrencias.service.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

export class DashboardService {
  constructor(private readonly ocorrencias: OcorrenciaRepository) {}

  // O agregado obedece ao mesmo escopo por papel da listagem de ocorrencias.
  // Antes este metodo chamava list() direto e entregava os numeros da escola
  // inteira ao professor, contradizendo a regra que o proprio sistema declara.
  async resumo(actor: AuthenticatedUser) {
    const ocorrencias = await this.carregarNoEscopo(actor);
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

  private async carregarNoEscopo(actor: AuthenticatedUser): Promise<Ocorrencia[]> {
    const escopo = escopoDeOcorrencias(actor);
    switch (escopo.tipo) {
      case "global":
        return this.ocorrencias.list();
      case "autor":
        return this.ocorrencias.listByCriadoPor(escopo.usuarioId);
      default:
        return [];
    }
  }
}
