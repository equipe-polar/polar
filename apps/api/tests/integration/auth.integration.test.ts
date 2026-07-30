import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestContext } from "./helpers.js";

describe("Auth", () => {
  it("realiza login valido sem vazar senha ou hash", async () => {
    const { app } = await buildTestContext();
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "adm@pola.test", senha: "Adm12345!" })
      .expect(200);

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("adm@pola.test");
    expect(response.body.user.senhaHash).toBeUndefined();
    expect(response.body.user.password_hash).toBeUndefined();
  });

  it("recusa usuario inexistente e senha incorreta", async () => {
    const { app } = await buildTestContext();
    await request(app).post("/api/auth/login").send({ email: "nada@pola.test", senha: "Adm12345!" }).expect(401);
    await request(app).post("/api/auth/login").send({ email: "adm@pola.test", senha: "senha-errada" }).expect(401);
  });

  it("bloqueia usuario apos multiplas tentativas invalidas", async () => {
    const { app } = await buildTestContext();
    for (let index = 0; index < 5; index += 1) {
      await request(app).post("/api/auth/login").send({ email: "adm@pola.test", senha: "senha-errada" }).expect(401);
    }

    await request(app).post("/api/auth/login").send({ email: "adm@pola.test", senha: "Adm12345!" }).expect(423);
  });

  it("recusa token ausente e token invalido", async () => {
    const { app } = await buildTestContext();
    await request(app).get("/api/usuarios").expect(401);
    await request(app).get("/api/usuarios").set("Authorization", "Bearer token-invalido").expect(401);
  });
});
