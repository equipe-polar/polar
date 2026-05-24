import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestContext, tokens } from "./helpers.js";

async function criarOcorrencia(app: Awaited<ReturnType<typeof buildTestContext>>["app"], token: string, alunoId: string) {
  return request(app)
    .post("/ocorrencias")
    .set("Authorization", `Bearer ${token}`)
    .send({
      alunoId,
      categoria: "Desrespeito",
      prioridade: "ALTA",
      descricao: "Aluno desrespeitou orientacao institucional em sala."
    })
    .expect(201);
}

describe("Ocorrencias", () => {
  it("permite professor criar ocorrencia e valida campos obrigatorios", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);

    const response = await criarOcorrencia(app, auth.professor, ids.aluno);
    expect(response.body.data.status).toBe("REGISTRADA");

    await request(app)
      .post("/ocorrencias")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ alunoId: ids.aluno, categoria: "Atraso", prioridade: "BAIXA", descricao: "" })
      .expect(400);
  });

  it("bloqueia alteracao de status por professor e salto de etapas", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);
    const created = await criarOcorrencia(app, auth.professor, ids.aluno);

    await request(app)
      .patch(`/ocorrencias/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ status: "EM_ANALISE" })
      .expect(403);

    await request(app)
      .patch(`/ocorrencias/${created.body.data.id}/status`)
      .set("Authorization", `Bearer ${auth.coordenador}`)
      .send({ status: "RESOLVIDA" })
      .expect(409);
  });

  it("segue fluxo coordenador/diretor e cria historico automatico", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);
    const created = await criarOcorrencia(app, auth.professor, ids.aluno);
    const id = created.body.data.id as string;

    await request(app)
      .patch(`/ocorrencias/${id}/status`)
      .set("Authorization", `Bearer ${auth.coordenador}`)
      .send({ status: "EM_ANALISE" })
      .expect(200);

    await request(app)
      .patch(`/ocorrencias/${id}/status`)
      .set("Authorization", `Bearer ${auth.coordenador}`)
      .send({ status: "RESOLVIDA" })
      .expect(200);

    await request(app)
      .patch(`/ocorrencias/${id}/status`)
      .set("Authorization", `Bearer ${auth.diretor}`)
      .send({ status: "ENCERRADA" })
      .expect(200);

    const historico = await request(app)
      .get(`/ocorrencias/${id}/historico`)
      .set("Authorization", `Bearer ${auth.professor}`)
      .expect(200);
    expect(historico.body.data.map((item: { status: string }) => item.status)).toEqual([
      "REGISTRADA",
      "EM_ANALISE",
      "RESOLVIDA",
      "ENCERRADA"
    ]);

    await request(app)
      .patch(`/ocorrencias/${id}`)
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ descricao: "Tentativa de alterar ocorrencia encerrada." })
      .expect(409);
  });

  it("impede edicao manual de historico e ocorrencia duplicada", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);
    const created = await criarOcorrencia(app, auth.professor, ids.aluno);

    await request(app)
      .put(`/ocorrencias/${created.body.data.id}/historico/qualquer`)
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ status: "ENCERRADA" })
      .expect(405);

    await request(app)
      .post("/ocorrencias")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({
        alunoId: ids.aluno,
        categoria: "Desrespeito",
        prioridade: "ALTA",
        descricao: "Aluno desrespeitou orientacao institucional em sala."
      })
      .expect(409);
  });
});
