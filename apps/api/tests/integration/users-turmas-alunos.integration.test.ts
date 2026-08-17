import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestContext, tokens } from "./helpers.js";

describe("Users, turmas e alunos", () => {
  it("permite ADM criar usuario e impede usuario comum", async () => {
    const { app } = await buildTestContext();
    const auth = await tokens(app);

    await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${auth.adm}`)
      .send({ nome: "Novo Coord", email: "novo.coord@pola.test", papel: "COORDENADOR", senha: "Coord12345!" })
      .expect(201);

    await request(app)
      .post("/api/usuarios")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ nome: "Sem Permissao", email: "sem@pola.test", papel: "PROFESSOR", senha: "Professor123!" })
      .expect(403);
  });

  it("lista usuarios sem vazar senha_hash", async () => {
    const { app } = await buildTestContext();
    const auth = await tokens(app);

    const response = await request(app).get("/api/usuarios").set("Authorization", `Bearer ${auth.adm}`).expect(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((item: Record<string, unknown>) => item.senhaHash === undefined)).toBe(true);
    expect(response.body.data.every((item: Record<string, unknown>) => item.password_hash === undefined)).toBe(true);
  });

  it("permite ADM criar e editar turma", async () => {
    const { app } = await buildTestContext();
    const auth = await tokens(app);

    const created = await request(app)
      .post("/api/turmas")
      .set("Authorization", `Bearer ${auth.adm}`)
      .send({ nome: "9B", anoLetivo: 2026, turno: "Tarde" })
      .expect(201);

    await request(app)
      .patch(`/api/turmas/${created.body.data.id}`)
      .set("Authorization", `Bearer ${auth.adm}`)
      .send({ turno: "Integral" })
      .expect(200);
  });

  it("bloqueia remocao de turma com aluno vinculado", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);

    await request(app).delete(`/api/turmas/${ids.turma}`).set("Authorization", `Bearer ${auth.adm}`).expect(409);
  });

  it("cria aluno apenas com turma valida e desativa aluno sem apagar historico", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);

    await request(app)
      .post("/api/alunos")
      .set("Authorization", `Bearer ${auth.adm}`)
      .send({ nome: "Lucas", matricula: "2026002", turmaId: ids.turma })
      .expect(201);

    await request(app)
      .post("/api/alunos")
      .set("Authorization", `Bearer ${auth.adm}`)
      .send({ nome: "Sem Turma", matricula: "2026003", turmaId: "turma-inexistente" })
      .expect(400);

    const ocorrencia = await request(app)
      .post("/api/ocorrencias")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({
        alunoId: ids.aluno,
        categoria: "Desrespeito",
        prioridade: "MEDIA",
        descricao: "Aluno interrompeu a explicacao de forma recorrente."
      })
      .expect(201);

    const removed = await request(app).delete(`/api/alunos/${ids.aluno}`).set("Authorization", `Bearer ${auth.adm}`).expect(200);
    expect(removed.body.data.ativo).toBe(false);

    const historico = await request(app)
      .get(`/api/ocorrencias/${ocorrencia.body.data.id}/historico`)
      .set("Authorization", `Bearer ${auth.professor}`)
      .expect(200);
    expect(historico.body.data).toHaveLength(1);
  });
});
