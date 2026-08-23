import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app.js";
import type { AppConfig } from "../../src/shared/config.js";
import { createInitialState, createMemoryDatabase, type DatabaseClient } from "../../src/shared/database/database.js";
import { PapelUsuario, TipoEnsino, type Usuario } from "../../src/shared/domain.js";
import { agoraIso, novoId } from "../../src/shared/utils/ids.js";

const valorAleatorioDeTeste = (): string => randomBytes(24).toString("base64url");

export const SENHAS_TESTE = {
  adm: valorAleatorioDeTeste(),
  professor: valorAleatorioDeTeste(),
  coordenador: valorAleatorioDeTeste(),
  diretor: valorAleatorioDeTeste(),
  estudante: valorAleatorioDeTeste()
} as const;

const segredoJwtDeTeste = randomBytes(48).toString("base64url");

export interface TestContext {
  app: Express;
  db: DatabaseClient;
  ids: {
    adm: string;
    professor: string;
    coordenador: string;
    diretor: string;
    estudante: string;
    turma: string;
    aluno: string;
  };
}

export const testConfig: AppConfig = {
  nodeEnv: "test",
  port: 3000,
  corsOrigin: "*",
  jwtSecret: segredoJwtDeTeste,
  jwtExpiresIn: "1h",
  databaseProvider: "json",
  databaseJsonPath: "apps/api/data/test.json",
  databaseSsl: false,
  bootstrapAdminEmail: "admin@pola.local"
};

function usuario(nome: string, email: string, papel: PapelUsuario, senhaHash: string): Usuario {
  const now = agoraIso();
  return {
    id: novoId(),
    nome,
    email,
    papel,
    senhaHash,
    ativo: true,
    precisaTrocarSenha: false,
    tentativasLoginInvalidas: 0,
    bloqueadoAte: null,
    ultimoLoginEm: null,
    criadoEm: now,
    atualizadoEm: now
  };
}

export async function buildTestContext(): Promise<TestContext> {
  const state = createInitialState();
  const [admHash, professorHash, coordenadorHash, diretorHash, estudanteHash] = await Promise.all([
    bcrypt.hash(SENHAS_TESTE.adm, 10),
    bcrypt.hash(SENHAS_TESTE.professor, 10),
    bcrypt.hash(SENHAS_TESTE.coordenador, 10),
    bcrypt.hash(SENHAS_TESTE.diretor, 10),
    bcrypt.hash(SENHAS_TESTE.estudante, 10)
  ]);

  const adm = usuario("Admin", "adm@pola.test", PapelUsuario.ADM, admHash);
  const professor = usuario("Professor", "professor@pola.test", PapelUsuario.PROFESSOR, professorHash);
  const coordenador = usuario("Coordenador", "coordenador@pola.test", PapelUsuario.COORDENADOR, coordenadorHash);
  const diretor = usuario("Diretor", "diretor@pola.test", PapelUsuario.DIRETOR, diretorHash);
  // Conta com papel ALUNO. "estudante" para nao colidir com o registro de Aluno abaixo.
  const estudante = usuario("Estudante", "estudante@pola.test", PapelUsuario.ALUNO, estudanteHash);
  state.usuarios.push(adm, professor, coordenador, diretor, estudante);

  const now = agoraIso();
  const turma = {
    id: novoId(),
    nome: "8A",
    anoLetivo: 2026,
    turno: "Manha",
    tipoEnsino: TipoEnsino.REGULAR,
    ativa: true,
    criadoEm: now,
    atualizadoEm: now
  };
  state.turmas.push(turma);

  const aluno = {
    id: novoId(),
    nome: "Estudante de teste",
    matricula: "2026001",
    turmaId: turma.id,
    responsavelNome: "Responsavel de teste",
    responsavelContato: "nao-informado",
    ativo: true,
    criadoEm: now,
    atualizadoEm: now
  };
  state.alunos.push(aluno);

  const db = createMemoryDatabase(state);
  const app = await createApp({ config: testConfig, database: db });
  return {
    app,
    db,
    ids: {
      adm: adm.id,
      professor: professor.id,
      coordenador: coordenador.id,
      diretor: diretor.id,
      estudante: estudante.id,
      turma: turma.id,
      aluno: aluno.id
    }
  };
}

export async function login(app: Express, email: string, senha: string): Promise<string> {
  const response = await request(app).post("/api/auth/login").send({ email, senha }).expect(200);
  return response.body.token as string;
}

export async function tokens(app: Express) {
  return {
    adm: await login(app, "adm@pola.test", SENHAS_TESTE.adm),
    professor: await login(app, "professor@pola.test", SENHAS_TESTE.professor),
    coordenador: await login(app, "coordenador@pola.test", SENHAS_TESTE.coordenador),
    diretor: await login(app, "diretor@pola.test", SENHAS_TESTE.diretor),
    estudante: await login(app, "estudante@pola.test", SENHAS_TESTE.estudante)
  };
}
