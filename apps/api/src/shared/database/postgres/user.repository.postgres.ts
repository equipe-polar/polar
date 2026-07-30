import type { Pool } from "pg";
import type { PapelUsuario, Usuario } from "../../domain.js";
import type { UserRepository } from "../repositories/user.repository.js";
import { dbDateTime, isoFromDb, isoFromDbRequired, withTransaction } from "./postgres-client.js";

interface UserRow {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  senha_hash: string;
  ativo: boolean;
  precisa_trocar_senha: boolean;
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
    ativo: row.ativo,
    precisaTrocarSenha: row.precisa_trocar_senha,
    tentativasLoginInvalidas: row.tentativas_login_invalidas,
    bloqueadoAte: isoFromDb(row.bloqueado_ate),
    ultimoLoginEm: isoFromDb(row.ultimo_login_em),
    criadoEm: isoFromDbRequired(row.criado_em),
    atualizadoEm: isoFromDbRequired(row.atualizado_em)
  };
}

const COLUNAS =
  "id, nome, email, papel, senha_hash, ativo, precisa_trocar_senha, tentativas_login_invalidas, bloqueado_ate, ultimo_login_em, criado_em, atualizado_em";

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: Pool) {}

  async list(): Promise<Usuario[]> {
    const { rows } = await this.pool.query<UserRow>(`SELECT ${COLUNAS} FROM users ORDER BY criado_em`);
    return rows.map(toUsuario);
  }

  async findById(id: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query<UserRow>(`SELECT ${COLUNAS} FROM users WHERE id = $1 LIMIT 1`, [id]);
    const row = rows[0];
    return row ? toUsuario(row) : null;
  }

  async findByEmailOrNome(identifier: string): Promise<Usuario | null> {
    const normalized = identifier.trim().toLowerCase();
    const { rows } = await this.pool.query<UserRow>(
      `SELECT ${COLUNAS} FROM users WHERE LOWER(email) = $1 OR LOWER(nome) = $1 LIMIT 1`,
      [normalized]
    );
    const row = rows[0];
    return row ? toUsuario(row) : null;
  }

  async create(usuario: Usuario): Promise<Usuario> {
    await this.pool.query(
      `INSERT INTO users (${COLUNAS}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        usuario.id,
        usuario.nome,
        usuario.email,
        usuario.papel,
        usuario.senhaHash,
        usuario.ativo,
        usuario.precisaTrocarSenha,
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
    return withTransaction(this.pool, async (client) => {
      const { rows } = await client.query<UserRow>(
        `SELECT ${COLUNAS} FROM users WHERE id = $1 LIMIT 1 FOR UPDATE`,
        [id]
      );
      const row = rows[0];
      if (!row) {
        return null;
      }

      const updated = updater(toUsuario(row));
      await client.query(
        `UPDATE users
           SET nome = $1, email = $2, papel = $3, senha_hash = $4, ativo = $5, precisa_trocar_senha = $6,
               tentativas_login_invalidas = $7, bloqueado_ate = $8, ultimo_login_em = $9, atualizado_em = $10
         WHERE id = $11`,
        [
          updated.nome,
          updated.email,
          updated.papel,
          updated.senhaHash,
          updated.ativo,
          updated.precisaTrocarSenha,
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
