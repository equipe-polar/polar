import request from "supertest";
import { describe, expect, it } from "vitest";
import { buildTestContext, tokens } from "./helpers.js";

describe("FE-09, FE-10, BE-03, BD-05 e BE-01", () => {
  it("registra tipo de ensino e encaminha ocorrencia técnica para PAET, coordenação e direção", async () => {
    const { app } = await buildTestContext();
    const auth = await tokens(app);
    const turma = await request(app)
      .post("/api/turmas")
      .set("Authorization", `Bearer ${auth.adm}`)
      .send({ nome: "9T", anoLetivo: 2026, turno: "Tarde", tipoEnsino: "TECNICO" })
      .expect(201);

    const aluno = await request(app)
      .post("/api/alunos")
      .set("Authorization", `Bearer ${auth.adm}`)
      .send({ nome: "Aluno Técnico", matricula: "2026999", turmaId: turma.body.data.id })
      .expect(201);

    const ocorrencia = await request(app)
      .post("/api/ocorrencias")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ alunoId: aluno.body.data.id, categoria: "Atraso", prioridade: "MEDIA", descricao: "Atraso em aula técnica." })
      .expect(201);

    const notificacoes = await request(app)
      .get(`/api/ocorrencias/${ocorrencia.body.data.id}/notificacoes`)
      .set("Authorization", `Bearer ${auth.professor}`)
      .expect(200);

    expect(notificacoes.body.data.map((item: { destinatario: string }) => item.destinatario).sort()).toEqual([
      "COORDENACAO", "DIRECAO", "PAET"
    ]);
    expect(notificacoes.body.data.every((item: { resultado: string }) => item.resultado === "ENVIADO")).toBe(true);
  });

  it("preserva os vínculos de origem e destino ao virar o ano letivo", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);

    await request(app)
      .post("/api/turmas/copiar-ano")
      .set("Authorization", `Bearer ${auth.adm}`)
      .send({
        anoOrigem: 2026,
        anoDestino: 2027,
        turmas: [{ origemId: ids.turma, nome: "9A", turno: "Manha", alunos: [ids.aluno] }]
      })
      .expect(201);

    const historico = await request(app)
      .get(`/api/alunos/${ids.aluno}/historico-turmas`)
      .set("Authorization", `Bearer ${auth.adm}`)
      .expect(200);

    expect(historico.body.data.map((item: { anoLetivo: number }) => item.anoLetivo).sort()).toEqual([2026, 2027]);
  });

  it("fornece movimentações recentes e dados de relatório filtráveis", async () => {
    const { app, ids } = await buildTestContext();
    const auth = await tokens(app);

    await request(app)
      .post("/api/ocorrencias")
      .set("Authorization", `Bearer ${auth.professor}`)
      .send({ alunoId: ids.aluno, categoria: "Desrespeito", prioridade: "ALTA", descricao: "Ocorrência para painel e relatório." })
      .expect(201);

    const movimentacoes = await request(app)
      .get("/api/dashboard/movimentacoes-recentes")
      .set("Authorization", `Bearer ${auth.professor}`)
      .expect(200);
    expect(movimentacoes.body.data).toHaveLength(1);
    expect(movimentacoes.body.data[0].usuarioNome).toBe("Professor");

    const relatorio = await request(app)
      .get(`/api/relatorios/ocorrencias?turmaId=${ids.turma}`)
      .set("Authorization", `Bearer ${auth.adm}`)
      .expect(200);
    expect(relatorio.body.data.total).toBe(1);
    expect(relatorio.body.data.byTurma).toEqual([{ nome: "8A", total: 1 }]);
    expect(relatorio.body.data.byPeriodo).toHaveLength(1);
  });
});
