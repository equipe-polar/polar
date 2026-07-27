import type { Pool, RowDataPacket } from "mysql2/promise";
import type { PapelUsuario, Usuario } from "../../domain.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { boolFromDb, dbBool, dbDateTime, isoFromDb, isoFromDbRequired, withTransaction } from "./mysql-client.js";

interface UserRow extends RowDataPacket {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  senha_hash: string;
  ativo: number;
  precisa_trocar_senha: number;
  tentativas_login_invalidas: number;
  bloqueado_ate: Date | null;
  ultimo_login_em: Date | null;
  criado_em: Date;
  atualizado_em: Date;
}

function toUsuario(row: UserRow): Usuario {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    papel: row.papel,
    senhaHash: row.senha_hash,
    ativo: boolFromDb(row.ativo),
    precisaTrocarSenha: boolFromDb(row.precisa_trocar_senha),
    tentativasLoginInvalidas: row.tentativas_login_invalidas,
    bloqueadoAte: isoFromDb(row.bloqueado_ate),
    ultimoLoginEm: isoFromDb(row.ultimo_login_em),
    criadoEm: isoFromDbRequired(row.criado_em),
    atualizadoEm: isoFromDbRequired(row.atualizado_em)
  };
}

const COLUNAS =
  "id, nome, email, papel, senha_hash, ativo, precisa_trocar_senha, tentativas_login_invalidas, bloqueado_ate, ultimo_login_em, criado_em, atualizado_em";

export class MysqlUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Usuario[]> {
    const [rows] = await this.pool.query<UserRow[]>(`SELECT ${COLUNAS} FROM users ORDER BY criado_em`);
    return rows.map(toUsuario);
  }

  async findById(id: string): Promise<Usuario | null> {
    const [rows] = await this.pool.query<UserRow[]>(`SELECT ${COLUNAS} FROM users WHERE id = ? LIMIT 1`, [id]);
    const row = rows[0];
    return row ? toUsuario(row) : null;
  }

  async findByEmailOrNome(identifier: string): Promise<Usuario | null> {
    const normalized = identifier.trim().toLowerCase();
    const [rows] = await this.pool.query<UserRow[]>(
      `SELECT ${COLUNAS} FROM users WHERE LOWER(email) = ? OR LOWER(nome) = ? LIMIT 1`,
      [normalized, normalized]
    );
    const row = rows[0];
    return row ? toUsuario(row) : null;
  }

  async create(usuario: Usuario): Promise<Usuario> {
    await this.pool.execute(
      `INSERT INTO users (${COLUNAS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        usuario.id,
        usuario.nome,
        usuario.email,
        usuario.papel,
        usuario.senhaHash,
        dbBool(usuario.ativo),
        dbBool(usuario.precisaTrocarSenha),
        usuario.tentativasLoginInvalidas,
        dbDateTime(usuario.bloqueadoAte),
        dbDateTime(usuario.ultimoLoginEm),
        dbDateTime(usuario.criadoEm),
        dbDateTime(usuario.atualizadoEm)
      ]
    );
    return usuario;
  }

  async update(id: string, updater: (usuario: Usuario) => Usuario): Promise<Usuario | null> {
    return withTransaction(this.pool, async (conn) => {
      const [rows] = await conn.query<UserRow[]>(`SELECT ${COLUNAS} FROM users WHERE id = ? LIMIT 1 FOR UPDATE`, [id]);
      const row = rows[0];
      if (!row) {
        return null;
      }

      const updated = updater(toUsuario(row));
      await conn.execute(
        `UPDATE users
           SET nome = ?, email = ?, papel = ?, senha_hash = ?, ativo = ?, precisa_trocar_senha = ?,
               tentativas_login_invalidas = ?, bloqueado_ate = ?, ultimo_login_em = ?, atualizado_em = ?
         WHERE id = ?`,
        [
          updated.nome,
          updated.email,
          updated.papel,
          updated.senhaHash,
          dbBool(updated.ativo),
          dbBool(updated.precisaTrocarSenha),
          updated.tentativasLoginInvalidas,
          dbDateTime(updated.bloqueadoAte),
          dbDateTime(updated.ultimoLoginEm),
          dbDateTime(updated.atualizadoEm),
          id
        ]
      );
      return updated;
    });
  }
}
