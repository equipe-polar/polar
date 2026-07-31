import pg, { type Pool, type PoolClient } from "pg";
import { SUPABASE_ROOT_CA } from "./supabase-ca.js";

// Parsers de tipo registrados uma unica vez, no import do modulo.
//
// NUMERIC (OID 1700): o driver pg devolve string por padrao para nao perder precisao.
// notas.valor e DECIMAL(4,2) e o dominio tipa `valor: number` -- sem este parser o
// valor chegaria como "8.50" e quebraria silenciosamente qualquer conta.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number.parseFloat(value));

// DATE (OID 1082): o padrao converte para Date na timezone local do processo, o que
// desloca o dia em qualquer fuso a oeste de Greenwich. As colunas `data` de notas e
// faltas sao dia civil, nao instante -- devolvemos a string YYYY-MM-DD crua.
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => value);

export interface PostgresOptions {
  url: string;
  ssl: boolean;
  /**
   * Ambientes serverless (Vercel) criam uma instancia por invocacao e usam o
   * transaction pooler do Supabase, que ja faz o pooling do lado do servidor.
   * Mais de uma conexao por instancia so consome slot do pgbouncer.
   */
  maxConnections?: number;
}

export function createPostgresPool(options: PostgresOptions): Pool {
  return new pg.Pool({
    connectionString: options.url,
    max: options.maxConnections ?? (process.env.VERCEL ? 1 : 10),
    // Serverless: nao segurar conexao ociosa entre invocacoes.
    idleTimeoutMillis: process.env.VERCEL ? 10_000 : 30_000,
    connectionTimeoutMillis: 10_000,
    // A verificacao continua ligada: a CA do Supabase entra como ancora extra
    // porque nao esta no trust store do Node (ver supabase-ca.ts).
    ...(options.ssl
      ? { ssl: { minVersion: "TLSv1.2" as const, rejectUnauthorized: true, ca: SUPABASE_ROOT_CA } }
      : {})
  });
}

export async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export function isoFromDb(value: Date | string | null): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return new Date(value).toISOString();
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
