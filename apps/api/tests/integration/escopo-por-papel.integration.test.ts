// Matriz negativa de escopo por papel: o que cada papel NAO pode ler.
//
// Este arquivo cobre dois furos que so aparecem quando se olha o agregado, e nao
// o CRUD:
//
// 1. O dashboard nao aplicava escopo. `DashboardService.resumo()` chamava
//    `ocorrencias.list()` -- a listagem global -- enquanto a rota exige apenas
//    CONSULTAR_OCORRENCIAS, permissao que o professor possui. Resultado: o
//    professor nao conseguia listar as ocorrencias dos colegas, mas recebia os
//    numeros agregados da escola inteira.
//
// 2. O papel ALUNO tem CONSULTAR_OCORRENCIAS (a permissao abre a rota), mas o
//    modelo ainda nao vincula Usuario a Aluno. Sem escopo explicito ele cairia no
//    caso global. A regra e negar por padrao: lista vazia, agregado zerado.

import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestContext, tokens, type TestContext } from "./helpers.js";

describe("Escopo de leitura por papel", () => {
  let ctx: TestContext;
  let t: Awaited<ReturnType<typeof tokens>>;

  beforeEach(async () => {
    ctx = await buildTestContext();
    t = await tokens(ctx.app);
  });

  async function criarOcorrencia(token: string, descricao: string): Promise<string> {
    const response = await request(ctx.app)
      .post("/api/ocorrencias")
      .set("Authorization", `Bearer ${token}`)
      .send({
        alunoId: ctx.ids.aluno,
        categoria: "Desrespeito",
        prioridade: "ALTA",
        descricao
      })
      .expect(201);
    return response.body.data.id as string;
  }

  it("dashboard do professor conta apenas as ocorrencias que ele registrou", async () => {
    await criarOcorrencia(t.professor, "Ocorrencia registrada pelo professor de teste.");
    await criarOcorrencia(t.adm, "Ocorrencia registrada pelo ADM, fora do escopo do professor.");

    const global = await request(ctx.app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${t.adm}`)
      .expect(200);
    expect(global.body.data.totalOcorrencias).toBe(2);

    const doProfessor = await request(ctx.app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${t.professor}`)
      .expect(200);
    expect(doProfessor.body.data.totalOcorrencias).toBe(1);

    // O agregado por categoria tambem nao pode vazar a contagem alheia.
    expect(doProfessor.body.data.ocorrenciasPorCategoria.Desrespeito).toBe(1);
  });

  it("dashboard e listagem do professor concordam entre si", async () => {
    await criarOcorrencia(t.professor, "Primeira do professor.");
    await criarOcorrencia(t.adm, "Do ADM, invisivel para o professor.");

    const lista = await request(ctx.app)
      .get("/api/ocorrencias")
      .set("Authorization", `Bearer ${t.professor}`)
      .expect(200);
    const resumo = await request(ctx.app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${t.professor}`)
      .expect(200);

    expect(resumo.body.data.totalOcorrencias).toBe(lista.body.data.length);
  });

  it("coordenacao e direcao continuam vendo o agregado global", async () => {
    await criarOcorrencia(t.professor, "Uma do professor.");
    await criarOcorrencia(t.adm, "Uma do ADM.");

    for (const token of [t.coordenador, t.diretor]) {
      const resumo = await request(ctx.app)
        .get("/api/dashboard")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);
      expect(resumo.body.data.totalOcorrencias).toBe(2);
    }
  });

  it("ALUNO nao le ocorrencia alguma: lista vazia e agregado zerado", async () => {
    const idAlheia = await criarOcorrencia(t.professor, "Ocorrencia de terceiro, invisivel para o aluno.");

    const lista = await request(ctx.app)
      .get("/api/ocorrencias")
      .set("Authorization", `Bearer ${t.estudante}`)
      .expect(200);
    expect(lista.body.data).toHaveLength(0);

    const resumo = await request(ctx.app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${t.estudante}`)
      .expect(200);
    expect(resumo.body.data.totalOcorrencias).toBe(0);
    expect(resumo.body.data.ocorrenciasPorCategoria).toEqual({});

    // Acesso direto por id tambem e negado, e nao apenas omitido da lista.
    await request(ctx.app)
      .get(`/api/ocorrencias/${idAlheia}`)
      .set("Authorization", `Bearer ${t.estudante}`)
      .expect(403);
    await request(ctx.app)
      .get(`/api/ocorrencias/${idAlheia}/historico`)
      .set("Authorization", `Bearer ${t.estudante}`)
      .expect(403);
  });

  it("ALUNO nao registra ocorrencia, nem gerencia usuarios, turmas ou alunos", async () => {
    await request(ctx.app)
      .post("/api/ocorrencias")
      .set("Authorization", `Bearer ${t.estudante}`)
      .send({
        alunoId: ctx.ids.aluno,
        categoria: "Atraso",
        prioridade: "BAIXA",
        descricao: "Tentativa de registro por conta de aluno."
      })
      .expect(403);

    await request(ctx.app).get("/api/usuarios").set("Authorization", `Bearer ${t.estudante}`).expect(403);

    await request(ctx.app)
      .post("/api/turmas")
      .set("Authorization", `Bearer ${t.estudante}`)
      .send({ nome: "Turma do aluno", anoLetivo: 2026, turno: "Manha" })
      .expect(403);

    await request(ctx.app)
      .post("/api/alunos")
      .set("Authorization", `Bearer ${t.estudante}`)
      .send({ nome: "Novo", matricula: "9999", turmaId: ctx.ids.turma })
      .expect(403);
  });

  it("ALUNO nao acessa relatorios nem auditoria", async () => {
    await request(ctx.app).get("/api/relatorios/ocorrencias").set("Authorization", `Bearer ${t.estudante}`).expect(403);
    await request(ctx.app).get("/api/auditoria").set("Authorization", `Bearer ${t.estudante}`).expect(403);
  });
});
