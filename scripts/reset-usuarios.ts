// Reset das contas de controle do POLAR.
//
// Apaga TODOS os usuarios e recria apenas as cinco contas fixas (uma por papel).
// Usa SQL direto, e nao a camada de repositorios, porque a interface compartilhada
// nao expoe delete de usuario de proposito -- e o sistema nunca deve apagar usuario
// pela API. Este script e uma ferramenta de operacao, nao um caminho da aplicacao.
//
// Executar da raiz:
//   DATABASE_URL=... DATABASE_SSL=true SEED_SENHA_PADRAO=... pnpm reset:usuarios
//
// As tabelas que referenciam users por FK sao limpas junto, na ordem das dependencias.
// Isso significa que ocorrencias, historico, notas, faltas, notificacoes e auditoria
// tambem sao apagados: e um reset de base de teste, nao uma migracao de dados.

import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PapelUsuario, type Usuario } from "../apps/api/src/shared/domain.js";
import { novoId } from "../apps/api/src/shared/utils/ids.js";
import { CONTAS, type Conta } from "../database/contas.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.resolve(repoRoot, "apps/api/.env"), quiet: true });

// Ordem importa: filhas antes das pais.
const TABELAS_DEPENDENTES = [
  "ocorrencia_historico",
  "notas",
  "faltas",
  "notifications",
  "audit_logs",
  "ocorrencias"
];

function contaFixa(nome: string, email: string, papel: PapelUsuario, senhaHash: string): Usuario {
  const agora = new Date().toISOString();
  return {
    id: novoId(),
    nome,
    email,
    papel,
    senhaHash,
    ativo: true,
    // Contas de controle e teste: entram direto, sem tela de troca de senha.
    precisaTrocarSenha: false,
    tentativasLoginInvalidas: 0,
    bloqueadoAte: null,
    ultimoLoginEm: null,
    criadoEm: agora,
    atualizadoEm: agora
  };
}

async function main(): Promise<void> {
  const senha = process.env.SEED_SENHA_PADRAO;
  if (!senha || senha.length < 8) {
    throw new Error("Defina SEED_SENHA_PADRAO (minimo 8 caracteres) para executar o reset.");
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL e obrigatorio para o reset de usuarios.");
  }

  const { createPostgresPool, createPostgresRepositories } = await import(
    "../apps/api/src/shared/database/postgres/index.js"
  );
  const pool = createPostgresPool({
    url,
    ssl: process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1"
  });

  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const tabela of TABELAS_DEPENDENTES) {
        await client.query(`DELETE FROM ${tabela}`);
      }
      const { rowCount } = await client.query("DELETE FROM users");
      await client.query("COMMIT");
      console.log(`${rowCount ?? 0} usuario(s) removido(s).`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    const senhaHash = await bcrypt.hash(senha, 10);
    const repos = createPostgresRepositories(pool);
    const contas: Array<[Conta, PapelUsuario]> = [
      [CONTAS.professor, PapelUsuario.PROFESSOR],
      [CONTAS.coordenacao, PapelUsuario.COORDENADOR],
      [CONTAS.direcao, PapelUsuario.DIRETOR],
      [CONTAS.adm, PapelUsuario.ADM],
      [CONTAS.aluno, PapelUsuario.ALUNO]
    ];

    for (const [conta, papel] of contas) {
      await repos.users.create(contaFixa(conta.nome, conta.email, papel, senhaHash));
      console.log(`  ${papel.padEnd(11)} ${conta.email}`);
    }

    console.log("Reset concluído. Todas as contas usam a senha de SEED_SENHA_PADRAO.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  // 42P01 = undefined_table no PostgreSQL.
  if (typeof error === "object" && error !== null && "code" in error && error.code === "42P01") {
    console.error('Tabelas nao encontradas. Aplique o schema antes: psql "$DATABASE_URL" -f database/schema.sql');
  }
  console.error(error);
  process.exitCode = 1;
});
