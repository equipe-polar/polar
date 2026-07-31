import { describe, expect, it } from "vitest";
import type { DashboardResumo } from "../../services/domain";
import { contarPendencias, descricaoPendencias, statusPendentes } from "./pendencias";

const resumo: DashboardResumo = {
  totalOcorrencias: 10,
  ocorrenciasPorStatus: { REGISTRADA: 4, EM_ANALISE: 3, RESOLVIDA: 2, ENCERRADA: 1 },
  ocorrenciasPorPrioridade: {},
  ocorrenciasPorCategoria: {}
};

describe("pendencias", () => {
  it("conta para o coordenador o que ele pode analisar e resolver", () => {
    expect(statusPendentes("COORDENADOR")).toEqual(["REGISTRADA", "EM_ANALISE"]);
    expect(contarPendencias("COORDENADOR", resumo)).toBe(7);
  });

  it("conta para o diretor apenas o que ele pode encerrar", () => {
    expect(statusPendentes("DIRETOR")).toEqual(["RESOLVIDA"]);
    expect(contarPendencias("DIRETOR", resumo)).toBe(2);
  });

  // O ADM tem todas as permissoes, mas o backend restringe as transicoes ao papel
  // exato -- entao ele nao pode mover nada e nao deve receber pendencia.
  it("nao atribui pendencia a quem nao muda status", () => {
    for (const papel of ["PROFESSOR", "ADM", "ALUNO"] as const) {
      expect(statusPendentes(papel)).toEqual([]);
      expect(contarPendencias(papel, resumo)).toBe(0);
    }
  });

  it("ignora status ausentes no resumo", () => {
    const vazio: DashboardResumo = { ...resumo, ocorrenciasPorStatus: {} };
    expect(contarPendencias("COORDENADOR", vazio)).toBe(0);
  });

  it("descreve a pendencia conforme o papel e o total", () => {
    expect(descricaoPendencias("COORDENADOR", 1)).toMatch(/1 ocorrencia aguarda sua analise/i);
    expect(descricaoPendencias("COORDENADOR", 5)).toMatch(/5 ocorrencias aguardam sua analise/i);
    expect(descricaoPendencias("DIRETOR", 2)).toMatch(/aguardam encerramento/i);
    expect(descricaoPendencias("COORDENADOR", 0)).toMatch(/nada aguardando/i);
    expect(descricaoPendencias("PROFESSOR", 0)).toMatch(/nao executa mudancas de status/i);
  });
});
