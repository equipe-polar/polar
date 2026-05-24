import bcrypt from "bcryptjs";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../../src/app.js";
import type { AppConfig } from "../../src/shared/config.js";
import { createInitialState, createMemoryDatabase, type DatabaseClient } from "../../src/shared/database/database.js";
import { PapelUsuario, type Usuario } from "../../src/shared/domain.js";
import { agoraIso, novoId } from "../../src/shared/utils/ids.js";

export interface TestContext {
  app: Express;
  db: DatabaseClient;
  ids: {
    adm: string;
    professor: string;
    coordenador: string;
    diretor: string;
    turma: string;
    aluno: string;
  };
}

export const testConfig: AppConfig = {
  nodeEnv: "test",
  port: 3000,
  corsOrigin: "*",
  jwtSecret: "teste-jwt-secret-com-mais-de-32-caracteres",
  jwtExpiresIn: "1h",
  databaseProvider: "json",
  databaseJsonPath: "apps/api/data/test.json",
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
  const [admHash, professorHash, coordenadorHash, diretorHash] = await Promise.all([
    bcrypt.hash("Adm12345!", 10),
    bcrypt.hash("Professor123!", 10),
    bcrypt.hash("Coord12345!", 10),
    bcrypt.hash("Diretor123!", 10)
  ]);

  const adm = usuario("Admin", "adm@pola.test", PapelUsuario.ADM, admHash);
  const professor = usuario("Professor", "professor@pola.test", PapelUsuario.PROFESSOR, professorHash);
  const coordenador = usuario("Coordenador", "coordenador@pola.test", PapelUsuario.COORDENADOR, coordenadorHash);
  const diretor = usuario("Diretor", "diretor@pola.test", PapelUsuario.DIRETOR, diretorHash);
  state.usuarios.push(adm, professor, coordenador, diretor);

  const now = agoraIso();
  const turma = {
    id: novoId(),
    nome: "8A",
    anoLetivo: 2026,
    turno: "Manha",
    ativa: true,
    criadoEm: now,
    atualizadoEm: now
  };
  state.turmas.push(turma);

  const aluno = {
    id: novoId(),
    nome: "Maria Eduarda",
    matricula: "2026001",
    turmaId: turma.id,
    responsavelNome: "Maria Silva",
    responsavelContato: "(11) 99999-0000",
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
      turma: turma.id,
      aluno: aluno.id
    }
  };
}

export async function login(app: Express, email: string, senha: string): Promise<string> {
  const response = await request(app).post("/auth/login").send({ email, senha }).expect(200);
  return response.body.token as string;
}

export async function tokens(app: Express) {
  return {
    adm: await login(app, "adm@pola.test", "Adm12345!"),
    professor: await login(app, "professor@pola.test", "Professor123!"),
    coordenador: await login(app, "coordenador@pola.test", "Coord12345!"),
    diretor: await login(app, "diretor@pola.test", "Diretor123!")
  };
}
