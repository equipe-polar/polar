import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestContext, tokens } from "./helpers.js";

describe("Notas, faltas e dashboard", () => {
  it("registra nota, valida valor e consulta por aluno", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);

    await request(app)
      .post("/api/notas")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ alunoId: ids.aluno, disciplina: "Matematica", valor: 8.5, etapa: "1 bimestre", data: "2026-05-20" })
      .expect(201);

    await request(app)
      .post("/api/notas")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ alunoId: ids.aluno, disciplina: "Matematica", valor: 11, etapa: "1 bimestre", data: "2026-05-20" })
      .expect(400);

    const response = await request(app)
      .get(`/api/notas/alunos/${ids.aluno}`)
      .set("Authorization", `Bearer ${auth.professor}`)
      .expect(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("registra falta, consulta por aluno e valida data", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);

    await request(app)
      .post("/api/faltas")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ alunoId: ids.aluno, data: "2026-05-21", justificativa: null })
      .expect(201);

    await request(app)
      .post("/api/faltas")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ alunoId: ids.aluno, data: "data-invalida" })
      .expect(400);

    const response = await request(app)
      .get(`/api/faltas/alunos/${ids.aluno}`)
      .set("Authorization", `Bearer ${auth.professor}`)
      .expect(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("retorna totais do dashboard por status, prioridade e categoria", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);

    await request(app)
      .post("/api/ocorrencias")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({
        alunoId: ids.aluno,
        categoria: "Atraso",
        prioridade: "BAIXA",
        descricao: "Aluno chegou atrasado apos o intervalo escolar."
      })
      .expect(201);

    const response = await request(app).get("/api/dashboard").set("Authorization", `Bearer ${auth.coordenador}`).expect(200);
    expect(response.body.data.totalOcorrencias).toBe(1);
    expect(response.body.data.ocorrenciasPorStatus.REGISTRADA).toBe(1);
    expect(response.body.data.ocorrenciasPorPrioridade.BAIXA).toBe(1);
    expect(response.body.data.ocorrenciasPorCategoria.Atraso).toBe(1);
  });
});
