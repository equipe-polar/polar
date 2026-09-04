import type { DatabaseClient } from "../database.js";
import { StatusOcorrencia, type Ocorrencia, type OcorrenciaHistorico } from "../../domain.js";

export interface OcorrenciaDuplicateParams {
  alunoId: string;
  categoria: string;
  descricao: string;
  criadoPorId: string;
  desde: Date;
}

export interface OcorrenciaRepository {
  list(): Promise<Ocorrencia[]>;
  listByCriadoPor(criadoPorId: string): Promise<Ocorrencia[]>;
  listByBimestre(bimestre: number): Promise<Ocorrencia[]>;
  findById(id: string): Promise<Ocorrencia | null>;
  listHistorico(ocorrenciaId: string): Promise<OcorrenciaHistorico[]>;
  findDuplicate(params: OcorrenciaDuplicateParams): Promise<Ocorrencia | null>;
  create(ocorrencia: Ocorrencia, historico: OcorrenciaHistorico): Promise<Ocorrencia>;
  createHistorico(historico: OcorrenciaHistorico): Promise<OcorrenciaHistorico>;
  updateWithHistorico(
    id: string,
    updater: (ocorrencia: Ocorrencia) => Ocorrencia,
    historico?: OcorrenciaHistorico
  ): Promise<Ocorrencia | null>;
}

export class JsonOcorrenciaRepository implements OcorrenciaRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(): Promise<Ocorrencia[]> {
    const state = await this.db.read();
    return state.ocorrencias;
  }

  async listByCriadoPor(criadoPorId: string): Promise<Ocorrencia[]> {
    const state = await this.db.read();
    return state.ocorrencias.filter((ocorrencia) => ocorrencia.criadoPorId === criadoPorId);
  }

  async listByBimestre(bimestre: number): Promise<Ocorrencia[]> {
  const state = await this.db.read();

  return state.ocorrencias.filter(
    (ocorrencia) => ocorrencia.bimestre === bimestre
  );
}

  async findById(id: string): Promise<Ocorrencia | null> {
    const state = await this.db.read();
    return state.ocorrencias.find((ocorrencia) => ocorrencia.id === id) ?? null;
  }

  async listHistorico(ocorrenciaId: string): Promise<OcorrenciaHistorico[]> {
    const state = await this.db.read();
    return state.ocorrenciaHistorico.filter((item) => item.ocorrenciaId === ocorrenciaId);
  }

  async findDuplicate(params: OcorrenciaDuplicateParams): Promise<Ocorrencia | null> {
    const state = await this.db.read();
    const categoria = params.categoria.trim().toLowerCase();
    const descricao = params.descricao.trim().toLowerCase();
    return (
      state.ocorrencias.find((ocorrencia) => {
        const criadaEm = new Date(ocorrencia.criadoEm);
        return (
          ocorrencia.alunoId === params.alunoId &&
          ocorrencia.criadoPorId === params.criadoPorId &&
          ocorrencia.categoria.toLowerCase() === categoria &&
          ocorrencia.descricao.toLowerCase() === descricao &&
          ocorrencia.status !== StatusOcorrencia.ENCERRADA &&
          criadaEm >= params.desde
        );
      }) ?? null
    );
  }

  async create(ocorrencia: Ocorrencia, historico: OcorrenciaHistorico): Promise<Ocorrencia> {
    return this.db.transaction((state) => {
      state.ocorrencias.push(ocorrencia);
      state.ocorrenciaHistorico.push(historico);
      return ocorrencia;
    });
  }

  async createHistorico(historico: OcorrenciaHistorico): Promise<OcorrenciaHistorico> {
    return this.db.transaction((state) => {
      state.ocorrenciaHistorico.push(historico);
      return historico;
    });
  }

  async updateWithHistorico(
    id: string,
    updater: (ocorrencia: Ocorrencia) => Ocorrencia,
    historico?: OcorrenciaHistorico
  ): Promise<Ocorrencia | null> {
    return this.db.transaction((state) => {
      const index = state.ocorrencias.findIndex((ocorrencia) => ocorrencia.id === id);
      const current = state.ocorrencias[index];
      if (index < 0 || !current) {
        return null;
      }

      const updated = updater(current);
      state.ocorrencias[index] = updated;
      if (historico) {
        state.ocorrenciaHistorico.push(historico);
      }
      return updated;
    });
  }
}
