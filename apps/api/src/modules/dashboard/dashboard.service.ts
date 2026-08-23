import type { OcorrenciaRepository } from "../../shared/database/repositories/ocorrencia.repository.js";
import type { UserRepository } from "../../shared/database/repositories/user.repository.js";
import type { Ocorrencia } from "../../shared/domain.js";
import { escopoDeOcorrencias } from "../ocorrencias/ocorrencias.service.js";
import type { AuthenticatedUser } from "../auth/auth.types.js";

export class DashboardService {
  constructor(
    private readonly ocorrencias: OcorrenciaRepository,
    private readonly users: UserRepository
  ) {}

  // O agregado obedece ao mesmo escopo por papel da listagem de ocorrencias.
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

  async movimentacoesRecentes(actor: AuthenticatedUser) {
    const ocorrencias = await this.carregarNoEscopo(actor);
    const ocorrenciasIds = new Set(ocorrencias.map((ocorrencia) => ocorrencia.id));
    const historicos = (await Promise.all(ocorrencias.map((ocorrencia) => this.ocorrencias.listHistorico(ocorrencia.id))))
      .flat()
      .filter((item) => ocorrenciasIds.has(item.ocorrenciaId))
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .slice(0, 5);
    const usuarios = await this.users.list();
    const nomePorUsuario = new Map(usuarios.map((usuario) => [usuario.id, usuario.nome]));

    return historicos.map((item) => ({
      id: item.id,
      ocorrenciaId: item.ocorrenciaId,
      acao: item.acao,
      status: item.status,
      usuarioNome: nomePorUsuario.get(item.usuarioId) ?? "Usuario indisponivel",
      criadoEm: item.criadoEm
    }));
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
