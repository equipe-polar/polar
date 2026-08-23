import type { DatabaseClient } from "../database.js";
import type { NotificacaoOcorrencia } from "../../domain.js";

export interface NotificacaoOcorrenciaRepository {
  createMany(notificacoes: NotificacaoOcorrencia[]): Promise<void>;
  listByOcorrencia(ocorrenciaId: string): Promise<NotificacaoOcorrencia[]>;
}

export class JsonNotificacaoOcorrenciaRepository implements NotificacaoOcorrenciaRepository {
  constructor(private readonly db: DatabaseClient) {}

  async createMany(notificacoes: NotificacaoOcorrencia[]): Promise<void> {
    await this.db.transaction((state) => {
      state.notificacoesOcorrencia.push(...notificacoes);
    });
  }

  async listByOcorrencia(ocorrenciaId: string): Promise<NotificacaoOcorrencia[]> {
    const state = await this.db.read();
    return state.notificacoesOcorrencia
      .filter((item) => item.ocorrenciaId === ocorrenciaId)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  }
}
