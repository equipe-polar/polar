import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInitialState } from "../apps/api/src/shared/database/database.js";
import { PapelUsuario, PrioridadeOcorrencia, StatusOcorrencia, type DatabaseState } from "../apps/api/src/shared/domain.js";
import { agoraIso, novoId } from "../apps/api/src/shared/utils/ids.js";

interface LegacyData {
  usuarios?: Array<Record<string, unknown>>;
  salas?: Array<Record<string, unknown>>;
  turmas?: Array<Record<string, unknown>>;
  alunos?: Array<Record<string, unknown>>;
  ocorrencias?: Array<Record<string, unknown>>;
  notas?: Array<Record<string, unknown>>;
  faltas?: Array<Record<string, unknown>>;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function papel(value: unknown): PapelUsuario {
  const normalized = text(value, "PROFESSOR").toUpperCase();
  return Object.values(PapelUsuario).includes(normalized as PapelUsuario)
    ? (normalized as PapelUsuario)
    : PapelUsuario.PROFESSOR;
}

function prioridade(value: unknown): PrioridadeOcorrencia {
  const normalized = text(value, "MEDIA").toUpperCase();
  return Object.values(PrioridadeOcorrencia).includes(normalized as PrioridadeOcorrencia)
    ? (normalized as PrioridadeOcorrencia)
    : PrioridadeOcorrencia.MEDIA;
}

function status(value: unknown): StatusOcorrencia {
  const normalized = text(value, "REGISTRADA").toUpperCase();
  return Object.values(StatusOcorrencia).includes(normalized as StatusOcorrencia)
    ? (normalized as StatusOcorrencia)
    : StatusOcorrencia.REGISTRADA;
}

async function readLegacyFile(): Promise<LegacyData> {
  const candidates = [
    path.resolve(repoRoot, "backend/banco_dados.json"),
    path.resolve(repoRoot, "legacy/python/backend/banco_dados.json")
  ];

  for (const candidate of candidates) {
    try {
      return JSON.parse(await fs.readFile(candidate, "utf8")) as LegacyData;
    } catch {
      // Tenta o proximo local conhecido.
    }
  }

  throw new Error("Arquivo legado backend/banco_dados.json nao encontrado.");
}

function migrate(data: LegacyData): DatabaseState {
  const state = createInitialState();
  const now = agoraIso();
  const turmaByLegacyName = new Map<string, string>();
  const userByLegacyName = new Map<string, string>();
  const alunoByLegacyName = new Map<string, string>();

  for (const item of data.usuarios ?? []) {
    const id = text(item.id, novoId());
    const nome = text(item.nome ?? item.username ?? item.name, "Usuario legado");
    userByLegacyName.set(nome.toLowerCase(), id);
    state.usuarios.push({
      id,
      nome,
      email: text(item.email, `${id}@legacy.local`),
      papel: papel(item.papel ?? item.role),
      senhaHash: text(item.senha_hash ?? item.password_hash, "MIGRAR_HASH_MANUALMENTE"),
      ativo: true,
      precisaTrocarSenha: true,
      tentativasLoginInvalidas: 0,
      bloqueadoAte: null,
      ultimoLoginEm: null,
      criadoEm: text(item.criado_em ?? item.createdAt, now),
      atualizadoEm: now
    });
  }

  for (const item of [...(data.turmas ?? []), ...(data.salas ?? [])]) {
    const id = text(item.id, novoId());
    const nome = text(item.nome ?? item.name, "Turma legado");
    turmaByLegacyName.set(nome.toLowerCase(), id);
    state.turmas.push({
      id,
      nome,
      anoLetivo: Number(item.anoLetivo ?? new Date().getFullYear()),
      turno: text(item.turno, "Integral"),
      ativa: true,
      criadoEm: now,
      atualizadoEm: now
    });
  }

  for (const item of data.alunos ?? []) {
    const id = text(item.id, novoId());
    const nome = text(item.nome ?? item.name, "Aluno legado");
    const turmaNome = text(item.turma ?? item.sala ?? item.class, "");
    const turmaId = text(item.turmaId, turmaByLegacyName.get(turmaNome.toLowerCase()) ?? "");
    alunoByLegacyName.set(nome.toLowerCase(), id);
    state.alunos.push({
      id,
      nome,
      matricula: text(item.matricula ?? item.registration, id),
      turmaId,
      responsavelNome: text(item.responsavelNome ?? item.responsibleName, ""),
      responsavelContato: text(item.responsavelContato ?? item.responsibleContact, ""),
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    });
  }

  for (const item of data.ocorrencias ?? []) {
    const id = text(item.id, novoId());
    const alunoNome = text(item.aluno ?? item.studentName, "");
    const alunoId = text(item.alunoId ?? item.aluno_id ?? item.studentId, alunoByLegacyName.get(alunoNome.toLowerCase()) ?? "");
    const criadoPorNome = text(item.criado_por ?? item.createdBy, "");
    const criadoPorId = text(item.criadoPorId, userByLegacyName.get(criadoPorNome.toLowerCase()) ?? state.usuarios[0]?.id ?? "");
    const createdAt = text(item.criado_em ?? item.createdAt, now);
    state.ocorrencias.push({
      id,
      alunoId,
      categoria: text(item.categoria ?? item.type, "Legado"),
      prioridade: prioridade(item.prioridade ?? item.severity),
      descricao: text(item.descricao ?? item.description, "Ocorrencia migrada do legado."),
      local: text(item.local, ""),
      testemunhas: text(item.testemunhas ?? item.witnesses, ""),
      status: status(item.status),
      criadoPorId,
      criadoEm: createdAt,
      atualizadoEm: text(item.atualizado_em ?? item.updatedAt, createdAt)
    });
    state.ocorrenciaHistorico.push({
      id: novoId(),
      ocorrenciaId: id,
      status: status(item.status),
      acao: "Ocorrencia migrada do JSON legado",
      observacao: null,
      usuarioId: criadoPorId,
      criadoEm: createdAt
    });
  }

  return state;
}

async function insertIntoMysql(state: DatabaseState): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL e obrigatorio para inserir a migracao no MySQL.");
  }

  const { createMysqlPool, createMysqlRepositories } = await import("../apps/api/src/shared/database/mysql/index.js");
  const pool = createMysqlPool({
    url,
    ssl: process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1"
  });
  const repos = createMysqlRepositories(pool);

  try {
    const existentes = await repos.users.list();
    if (existentes.length > 0) {
      console.log("MySQL ja possui usuarios; insercao ignorada para nao duplicar dados.");
      return;
    }

    for (const usuarioMigrado of state.usuarios) {
      await repos.users.create(usuarioMigrado);
    }
    for (const turmaMigrada of state.turmas) {
      await repos.turmas.create(turmaMigrada);
    }

    const turmasValidas = new Set(state.turmas.map((t) => t.id));
    let alunosPulados = 0;
    for (const alunoMigrado of state.alunos) {
      if (!turmasValidas.has(alunoMigrado.turmaId)) {
        alunosPulados += 1;
        continue;
      }
      await repos.alunos.create(alunoMigrado);
    }

    const alunosValidos = new Set(state.alunos.filter((a) => turmasValidas.has(a.turmaId)).map((a) => a.id));
    const usuariosValidos = new Set(state.usuarios.map((u) => u.id));
    let ocorrenciasPuladas = 0;
    for (const ocorrenciaMigrada of state.ocorrencias) {
      if (!alunosValidos.has(ocorrenciaMigrada.alunoId) || !usuariosValidos.has(ocorrenciaMigrada.criadoPorId)) {
        ocorrenciasPuladas += 1;
        continue;
      }
      const historicos = state.ocorrenciaHistorico.filter((h) => h.ocorrenciaId === ocorrenciaMigrada.id);
      const primeiro = historicos[0];
      if (!primeiro) {
        ocorrenciasPuladas += 1;
        continue;
      }
      await repos.ocorrencias.create(ocorrenciaMigrada, primeiro);
      for (const historico of historicos.slice(1)) {
        await repos.ocorrencias.createHistorico(historico);
      }
    }

    if (alunosPulados > 0 || ocorrenciasPuladas > 0) {
      console.warn(
        `Atencao: ${alunosPulados} aluno(s) e ${ocorrenciasPuladas} ocorrencia(s) pulados por vinculos invalidos no legado. Revise manualmente.`
      );
    }
    console.log("Dados legados inseridos no MySQL.");
  } finally {
    await pool.end();
  }
}

async function main(): Promise<void> {
  const legacy = await readLegacyFile();
  const migrated = migrate(legacy);
  const outputPath = path.resolve(repoRoot, "apps/api/data/migrated-from-legacy.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(migrated, null, 2)}\n`, "utf8");
  console.log(`Migracao inicial gerada em ${outputPath}`);

  if (process.env.DATABASE_PROVIDER === "mysql") {
    await insertIntoMysql(migrated);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
