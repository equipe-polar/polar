// Regras fechadas na v3:
// 1. Professor consulta apenas as proprias ocorrencias.
// 2. Edicao: so o autor, so em REGISTRADA, com registro de historico.
// 3. Transicao de status aceita observacao opcional gravada no historico.

import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { buildTestContext, login, tokens, type TestContext } from "./helpers.js";

describe("Ocorrencias - regras v3", () => {
  let ctx: TestContext;

  beforeEach(async () => {
    ctx = await buildTestContext();
  });

  async function criarOcorrencia(token: string): Promise<string> {
    const response = await request(ctx.app)
      .post("/ocorrencias")
      .set("Authorization", `Bearer ${token}`)
      .send({
        alunoId: ctx.ids.aluno,
        categoria: "Não fez atividade",
        prioridade: "MEDIA",
        descricao: "Aluno não entregou a atividade de Programação."
      })
      .expect(201);
    return response.body.data.id as string;
  }

  it("professor ve apenas as proprias ocorrencias; coordenacao ve todas", async () => {
    const t = await tokens(ctx.app);

    // ADM cria um segundo professor.
    await request(ctx.app)
      .post("/usuarios")
      .set("Authorization", `Bearer ${t.adm}`)
      .send({
        nome: "Professora Dois",
        email: "professora2@pola.test",
        papel: "PROFESSOR",
        senha: "SenhaForte2!"
      })
      .expect(201);
    const professor2 = await login(ctx.app, "professora2@pola.test", "SenhaForte2!");

    const idProfessor1 = await criarOcorrencia(t.professor);

    // Professor 2 nao ve a ocorrencia do professor 1 na lista.
    const listaProfessor2 = await request(ctx.app)
      .get("/ocorrencias")
      .set("Authorization", `Bearer ${professor2}`)
      .expect(200);
    expect(listaProfessor2.body.data).toHaveLength(0);

    // Professor 1 ve a propria.
    const listaProfessor1 = await request(ctx.app)
      .get("/ocorrencias")
      .set("Authorization", `Bearer ${t.professor}`)
      .expect(200);
    expect(listaProfessor1.body.data).toHaveLength(1);

    // Professor 2 nao acessa o detalhe nem o historico da ocorrencia alheia.
    await request(ctx.app)
      .get(`/ocorrencias/${idProfessor1}`)
      .set("Authorization", `Bearer ${professor2}`)
      .expect(403);
    await request(ctx.app)
      .get(`/ocorrencias/${idProfessor1}/historico`)
      .set("Authorization", `Bearer ${professor2}`)
      .expect(403);

    // Coordenacao ve todas.
    const listaCoordenacao = await request(ctx.app)
      .get("/ocorrencias")
      .set("Authorization", `Bearer ${t.coordenador}`)
      .expect(200);
    expect(listaCoordenacao.body.data).toHaveLength(1);
  });

  it("edicao permitida apenas ao autor, apenas em REGISTRADA, gerando historico", async () => {
    const t = await tokens(ctx.app);
    const id = await criarOcorrencia(t.professor);

    // ADM (nao autor) nao pode editar, mesmo com permissao ampla.
    await request(ctx.app)
      .patch(`/ocorrencias/${id}`)
      .set("Authorization", `Bearer ${t.adm}`)
      .send({ descricao: "Tentativa de edicao por terceiro nao autor." })
      .expect(403);

    // Autor edita em REGISTRADA.
    await request(ctx.app)
      .patch(`/ocorrencias/${id}`)
      .set("Authorization", `Bearer ${t.professor}`)
      .send({ descricao: "Descrição corrigida pelo autor com acentuação." })
      .expect(200);

    // A edicao gerou historico.
    const historico = await request(ctx.app)
      .get(`/ocorrencias/${id}/historico`)
      .set("Authorization", `Bearer ${t.professor}`)
      .expect(200);
    const acoes = historico.body.data.map((h: { acao: string }) => h.acao);
    expect(acoes).toContain("Ocorrencia editada pelo autor");

    // Depois de EM_ANALISE, nem o autor edita.
    await request(ctx.app)
      .patch(`/ocorrencias/${id}/status`)
      .set("Authorization", `Bearer ${t.coordenador}`)
      .send({ status: "EM_ANALISE" })
      .expect(200);
    await request(ctx.app)
      .patch(`/ocorrencias/${id}`)
      .set("Authorization", `Bearer ${t.professor}`)
      .send({ descricao: "Tentativa de edicao fora de REGISTRADA." })
      .expect(409);
  });

  it("observacao da transicao e gravada no historico e visivel na consulta", async () => {
    const t = await tokens(ctx.app);
    const id = await criarOcorrencia(t.professor);

    await request(ctx.app)
      .patch(`/ocorrencias/${id}/status`)
      .set("Authorization", `Bearer ${t.coordenador}`)
      .send({ status: "EM_ANALISE" })
      .expect(200);

    await request(ctx.app)
      .patch(`/ocorrencias/${id}/status`)
      .set("Authorization", `Bearer ${t.coordenador}`)
      .send({
        status: "RESOLVIDA",
        observacao: "Conversa com o aluno realizada; encaminhamento à família registrado."
      })
      .expect(200);

    await request(ctx.app)
      .patch(`/ocorrencias/${id}/status`)
      .set("Authorization", `Bearer ${t.diretor}`)
      .send({ status: "ENCERRADA", observacao: "Encerrado após acompanhamento." })
      .expect(200);

    const historico = await request(ctx.app)
      .get(`/ocorrencias/${id}/historico`)
      .set("Authorization", `Bearer ${t.coordenador}`)
      .expect(200);

    const observacoes = historico.body.data
      .map((h: { observacao: string | null }) => h.observacao)
      .filter(Boolean);
    expect(observacoes).toContain("Conversa com o aluno realizada; encaminhamento à família registrado.");
    expect(observacoes).toContain("Encerrado após acompanhamento.");
  });

  it("rejeita caracteres de controle e remove HTML da descricao", async () => {
    const t = await tokens(ctx.app);

    // Caracteres de controle -> 400.
    await request(ctx.app)
      .post("/ocorrencias")
      .set("Authorization", `Bearer ${t.professor}`)
      .send({
        alunoId: ctx.ids.aluno,
        categoria: "Desrespeito",
        prioridade: "MEDIA",
        descricao: `Descricao com controle ${String.fromCharCode(7)} invisivel no meio.`
      })
      .expect(400);

    // HTML e removido antes de persistir.
    const response = await request(ctx.app)
      .post("/ocorrencias")
      .set("Authorization", `Bearer ${t.professor}`)
      .send({
        alunoId: ctx.ids.aluno,
        categoria: "Desrespeito",
        prioridade: "MEDIA",
        descricao: "Aluno usou <script>alert('xss')</script> palavras inadequadas com colegas."
      })
      .expect(201);
    expect(response.body.data.descricao).not.toContain("<script>");
    expect(response.body.data.descricao).toContain("palavras inadequadas");
  });
});
