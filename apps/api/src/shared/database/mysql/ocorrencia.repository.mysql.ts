import type { Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type {
  Ocorrencia,
  OcorrenciaHistorico,
  PrioridadeOcorrencia,
  StatusOcorrencia
} from "../../domain.js";
import type {
  OcorrenciaDuplicateParams,
  OcorrenciaRepository
} from "../repositories/ocorrencia.repository.js";
import { dbDateTime, isoFromDbRequired, withTransaction } from "./mysql-client.js";

interface OcorrenciaRow extends RowDataPacket {
  id: string;
  aluno_id: string;
  categoria: string;
  prioridade: PrioridadeOcorrencia;
  descricao: string;
  local: string;
  testemunhas: string;
  status: StatusOcorrencia;
  criado_por_id: string;
  criado_em: Date;
  atualizado_em: Date;
}

interface HistoricoRow extends RowDataPacket {
  id: string;
  ocorrencia_id: string;
  status: StatusOcorrencia;
  acao: string;
  observacao: string | null;
  usuario_id: string;
  criado_em: Date;
}

function toOcorrencia(row: OcorrenciaRow): Ocorrencia {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    categoria: row.categoria,
    prioridade: row.prioridade,
    descricao: row.descricao,
    local: row.local,
    testemunhas: row.testemunhas,
    status: row.status,
    criadoPorId: row.criado_por_id,
    criadoEm: isoFromDbRequired(row.criado_em),
    atualizadoEm: isoFromDbRequired(row.atualizado_em)
  };
}

function toHistorico(row: HistoricoRow): OcorrenciaHistorico {
  return {
    id: row.id,
    ocorrenciaId: row.ocorrencia_id,
    status: row.status,
    acao: row.acao,
    observacao: row.observacao,
    usuarioId: row.usuario_id,
    criadoEm: isoFromDbRequired(row.criado_em)
  };
}

const COLUNAS =
  "id, aluno_id, categoria, prioridade, descricao, local, testemunhas, status, criado_por_id, criado_em, atualizado_em";
const COLUNAS_HISTORICO = "id, ocorrencia_id, status, acao, observacao, usuario_id, criado_em";

async function insertHistorico(conn: Pool | PoolConnection, historico: OcorrenciaHistorico): Promise<void> {
  await conn.execute(`INSERT INTO ocorrencia_historico (${COLUNAS_HISTORICO}) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
    historico.id,
    historico.ocorrenciaId,
    historico.status,
    historico.acao,
    historico.observacao,
    historico.usuarioId,
    dbDateTime(historico.criadoEm)
  ]);
}

export class MysqlOcorrenciaRepository implements OcorrenciaRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Ocorrencia[]> {
    const [rows] = await this.pool.query<OcorrenciaRow[]>(`SELECT ${COLUNAS} FROM ocorrencias ORDER BY criado_em DESC`);
    return rows.map(toOcorrencia);
  }

  async listByCriadoPor(criadoPorId: string): Promise<Ocorrencia[]> {
    const [rows] = await this.pool.query<OcorrenciaRow[]>(
      `SELECT ${COLUNAS} FROM ocorrencias WHERE criado_por_id = ? ORDER BY criado_em DESC`,
      [criadoPorId]
    );
    return rows.map(toOcorrencia);
  }

  async findById(id: string): Promise<Ocorrencia | null> {
    const [rows] = await this.pool.query<OcorrenciaRow[]>(`SELECT ${COLUNAS} FROM ocorrencias WHERE id = ? LIMIT 1`, [
      id
    ]);
    const row = rows[0];
    return row ? toOcorrencia(row) : null;
  }

  async listHistorico(ocorrenciaId: string): Promise<OcorrenciaHistorico[]> {
    const [rows] = await this.pool.query<HistoricoRow[]>(
      `SELECT ${COLUNAS_HISTORICO} FROM ocorrencia_historico WHERE ocorrencia_id = ? ORDER BY criado_em`,
      [ocorrenciaId]
    );
    return rows.map(toHistorico);
  }

  async findDuplicate(params: OcorrenciaDuplicateParams): Promise<Ocorrencia | null> {
    const [rows] = await this.pool.query<OcorrenciaRow[]>(
      `SELECT ${COLUNAS}
         FROM ocorrencias
        WHERE aluno_id = ?
          AND criado_por_id = ?
          AND LOWER(categoria) = ?
          AND LOWER(descricao) = ?
          AND status <> 'ENCERRADA'
          AND criado_em >= ?
        LIMIT 1`,
      [
        params.alunoId,
        params.criadoPorId,
        params.categoria.trim().toLowerCase(),
        params.descricao.trim().toLowerCase(),
        params.desde
      ]
    );
    const row = rows[0];
    return row ? toOcorrencia(row) : null;
  }

  async create(ocorrencia: Ocorrencia, historico: OcorrenciaHistorico): Promise<Ocorrencia> {
    // Transacao real (TCL): ocorrencia e primeiro registro de historico sao atomicos.
    return withTransaction(this.pool, async (conn) => {
      await conn.execute(`INSERT INTO ocorrencias (${COLUNAS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        ocorrencia.id,
        ocorrencia.alunoId,
        ocorrencia.categoria,
        ocorrencia.prioridade,
        ocorrencia.descricao,
        ocorrencia.local ?? "",
        ocorrencia.testemunhas ?? "",
        ocorrencia.status,
        ocorrencia.criadoPorId,
        dbDateTime(ocorrencia.criadoEm),
        dbDateTime(ocorrencia.atualizadoEm)
      ]);
      await insertHistorico(conn, historico);
      return ocorrencia;
    });
  }

  async createHistorico(historico: OcorrenciaHistorico): Promise<OcorrenciaHistorico> {
    await insertHistorico(this.pool, historico);
    return historico;
  }

  async updateWithHistorico(
    id: string,
    updater: (ocorrencia: Ocorrencia) => Ocorrencia,
    historico?: OcorrenciaHistorico
  ): Promise<Ocorrencia | null> {
    // Transacao real (TCL): status novo + historico gravados juntos ou nada e gravado.
    return withTransaction(this.pool, async (conn) => {
      const [rows] = await conn.query<OcorrenciaRow[]>(
        `SELECT ${COLUNAS} FROM ocorrencias WHERE id = ? LIMIT 1 FOR UPDATE`,
        [id]
      );
      const row = rows[0];
      if (!row) {
        return null;
      }

      const updated = updater(toOcorrencia(row));
      await conn.execute(
        `UPDATE ocorrencias
           SET categoria = ?, prioridade = ?, descricao = ?, local = ?, testemunhas = ?, status = ?, atualizado_em = ?
         WHERE id = ?`,
        [
          updated.categoria,
          updated.prioridade,
          updated.descricao,
          updated.local ?? "",
          updated.testemunhas ?? "",
          updated.status,
          dbDateTime(updated.atualizadoEm),
          id
        ]
      );
      if (historico) {
        await insertHistorico(conn, historico);
      }
      return updated;
    });
  }
}
