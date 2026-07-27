import mysql, { type Pool, type PoolConnection } from "mysql2/promise";

export interface MysqlOptions {
  url: string;
  ssl: boolean;
}

export function createMysqlPool(options: MysqlOptions): Pool {
  return mysql.createPool({
    uri: options.url,
    waitForConnections: true,
    connectionLimit: 10,
    // Todas as datas trafegam em UTC; o backend e a unica autoridade de data.
    timezone: "Z",
    charset: "utf8mb4_unicode_ci",
    decimalNumbers: true,
    ...(options.ssl ? { ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true } } : {})
  });
}

export async function withTransaction<T>(pool: Pool, fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export function isoFromDb(value: Date | string | null): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

export function isoFromDbRequired(value: Date | string): string {
  const iso = isoFromDb(value);
  if (!iso) {
    throw new Error("Data obrigatoria ausente no banco de dados.");
  }
  return iso;
}

export function dateOnlyFromDb(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value.slice(0, 10);
}

export function dbDateTime(iso: string | null | undefined): Date | null {
  return iso ? new Date(iso) : null;
}

export function dbBool(value: boolean): number {
  return value ? 1 : 0;
}

export function boolFromDb(value: unknown): boolean {
  return value === 1 || value === true || value === "1";
}
