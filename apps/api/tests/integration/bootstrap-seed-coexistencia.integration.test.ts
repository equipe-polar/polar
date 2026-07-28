// Regra fechada no reset v3: bootstrap (admin real) e seed (dados de
// demonstracao) nao podem mais competir por "banco vazio" em silencio.
// Cada um guarda pelo proprio email sentinela, entao coexistem em qualquer ordem.

import { describe, expect, it } from "vitest";
import { createMemoryDatabase } from "../../src/shared/database/database.js";
import { JsonUserRepository } from "../../src/shared/database/repositories/user.repository.js";
import { JsonAuditRepository } from "../../src/shared/database/repositories/audit.repository.js";
import { AuthService } from "../../src/modules/auth/auth.service.js";
import { PapelUsuario, type Usuario } from "../../src/shared/domain.js";
import { agoraIso, novoId } from "../../src/shared/utils/ids.js";
import { testConfig } from "./helpers.js";

function usuarioDemo(email: string): Usuario {
  const now = agoraIso();
  return {
    id: novoId(),
    nome: "Usuario Demo",
    email,
    papel: PapelUsuario.ADM,
    senhaHash: "$2a$10$hashficticiodetestesomente0000000000000000000000000",
    ativo: true,
    precisaTrocarSenha: false,
    tentativasLoginInvalidas: 0,
    bloqueadoAte: null,
    ultimoLoginEm: null,
    criadoEm: now,
    atualizadoEm: now
  };
}

describe("Coexistencia seed/bootstrap", () => {
  it("seed rodando primeiro nao impede o bootstrap de criar o admin real depois", async () => {
    const db = createMemoryDatabase();
    const users = new JsonUserRepository(db);
    const audit = new JsonAuditRepository(db);

    // Simula o seed: cria o admin de demonstracao "admin@escola.demo" primeiro.
    await users.create(usuarioDemo("admin@escola.demo"));

    // Bootstrap roda depois, com um email de admin real diferente.
    const auth = new AuthService(users, audit, {
      ...testConfig,
      bootstrapAdminEmail: "admin@escola.real",
      bootstrapAdminPassword: "SenhaRealForte1!"
    });
    await auth.bootstrapAdminIfNeeded();

    const adminReal = await users.findByEmailOrNome("admin@escola.real");
    expect(adminReal).not.toBeNull();
    expect(adminReal?.papel).toBe(PapelUsuario.ADM);

    // O usuario de demonstracao continua existindo, intacto.
    const adminDemo = await users.findByEmailOrNome("admin@escola.demo");
    expect(adminDemo).not.toBeNull();
  });

  it("bootstrap rodando primeiro nao bloqueia o guard do seed (email sentinela do seed continua livre)", async () => {
    const db = createMemoryDatabase();
    const users = new JsonUserRepository(db);
    const audit = new JsonAuditRepository(db);

    // Bootstrap roda primeiro: cria o admin real.
    const auth = new AuthService(users, audit, {
      ...testConfig,
      bootstrapAdminEmail: "admin@escola.real",
      bootstrapAdminPassword: "SenhaRealForte1!"
    });
    await auth.bootstrapAdminIfNeeded();

    // O guard do seed (replicado aqui) verifica especificamente "admin@escola.demo",
    // nao "existe algum usuario" — por isso continua null, e o seed prosseguiria.
    const seedJaAplicado = await users.findByEmailOrNome("admin@escola.demo");
    expect(seedJaAplicado).toBeNull();
  });

  it("bootstrap chamado duas vezes com o mesmo email nao duplica o admin", async () => {
    const db = createMemoryDatabase();
    const users = new JsonUserRepository(db);
    const audit = new JsonAuditRepository(db);
    const auth = new AuthService(users, audit, {
      ...testConfig,
      bootstrapAdminEmail: "admin@escola.real",
      bootstrapAdminPassword: "SenhaRealForte1!"
    });

    await auth.bootstrapAdminIfNeeded();
    await auth.bootstrapAdminIfNeeded();

    const todos = await users.list();
    const admins = todos.filter((u) => u.email === "admin@escola.real");
    expect(admins).toHaveLength(1);
  });
});
