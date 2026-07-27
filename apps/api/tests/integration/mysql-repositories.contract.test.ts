// Teste de contrato dos repositorios MySQL.
// So roda quando TEST_DATABASE_URL aponta para um MySQL com o schema aplicado
// (ex: mysql://root:root@localhost:3306/polar_test). Sem a variavel, e ignorado
// e o CI permanece verde sem banco.
//
// ATENCAO: o banco de teste e TRUNCADO no inicio de cada execucao.

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  PapelUsuario,
  PrioridadeOcorrencia,
  StatusOcorrencia,
  type Aluno,
  type Ocorrencia,
  type OcorrenciaHistorico,
  type Turma,
  type Usuario
} from "../../src/shared/domain.js";
import { agoraIso, novoId } from "../../src/shared/utils/ids.js";
import type { Repositories } from "../../src/shared/services.js";

const url = process.env.TEST_DATABASE_URL;

describe.runIf(Boolean(url))("repositorios MySQL (contrato)", () => {
  let repos: Repositories;
  let close: () => Promise<void> = async () => {};

  beforeAll(async () => {
    const { createMysqlPool, createMysqlRepositories } = await import("../../src/shared/database/mysql/index.js");
    const pool = createMysqlPool({ url: url as string, ssl: process.env.TEST_DATABASE_SSL === "true" });
    repos = createMysqlRepositories(pool);
    close = async () => {
      await pool.end();
    };

    // Limpa na ordem inversa das FKs.
    const tabelas = [
      "notifications",
      "audit_logs",
      "user_permissions",
      "faltas",
      "notas",
      "ocorrencia_historico",
      "ocorrencias",
      "alunos",
      "turmas",
      "users"
    ];
    await pool.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const tabela of tabelas) {
      await pool.query(`TRUNCATE TABLE ${tabela}`);
    }
    await pool.query("SET FOREIGN_KEY_CHECKS = 1");
  });

  afterAll(async () => {
    await close();
  });

  function novoUsuario(): Usuario {
    const now = agoraIso();
    return {
      id: novoId(),
      nome: `Professor Contrato ${now}`,
      email: `contrato-${novoId()}@escola.demo`,
      papel: PapelUsuario.PROFESSOR,
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

  it("cria e le usuario com datas e booleanos integros", async () => {
    const usuario = novoUsuario();
    await repos.users.create(usuario);

    const lido = await repos.users.findById(usuario.id);
    expect(lido).not.toBeNull();
    expect(lido?.email).toBe(usuario.email);
    expect(lido?.ativo).toBe(true);
    expect(lido?.precisaTrocarSenha).toBe(false);
    expect(lido?.bloqueadoAte).toBeNull();
    expect(new Date(lido?.criadoEm ?? "").getTime()).toBe(new Date(usuario.criadoEm).getTime());

    const porEmail = await repos.users.findByEmailOrNome(usuario.email.toUpperCase());
    expect(porEmail?.id).toBe(usuario.id);
  });

  it("preserva acentuacao PT-BR em turmas, alunos e ocorrencias (utf8mb4)", async () => {
    const now = agoraIso();
    const usuario = novoUsuario();
    await repos.users.create(usuario);

    const turma: Turma = {
      id: novoId(),
      nome: `3ºB - Programação ${novoId().slice(0, 6)}`,
      anoLetivo: 2026,
      turno: "Manhã",
      ativa: true,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.turmas.create(turma);

    const aluno: Aluno = {
      id: novoId(),
      nome: "João Não-Silva Àcêntós",
      matricula: `M-${novoId().slice(0, 8)}`,
      turmaId: turma.id,
      responsavelNome: "Responsável Ção",
      responsavelContato: "(11) 90000-0000",
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.alunos.create(aluno);

    const ocorrencia: Ocorrencia = {
      id: novoId(),
      alunoId: aluno.id,
      categoria: "Não fez atividade",
      prioridade: PrioridadeOcorrencia.MEDIA,
      descricao: "Dano ao patrimônio não confirmado; observação com acentuação: ãõçéíú.",
      local: "Pátio",
      testemunhas: "",
      status: StatusOcorrencia.REGISTRADA,
      criadoPorId: usuario.id,
      criadoEm: now,
      atualizadoEm: now
    };
    const historico: OcorrenciaHistorico = {
      id: novoId(),
      ocorrenciaId: ocorrencia.id,
      status: StatusOcorrencia.REGISTRADA,
      acao: "Ocorrencia registrada",
      observacao: null,
      usuarioId: usuario.id,
      criadoEm: now
    };
    await repos.ocorrencias.create(ocorrencia, historico);

    const lida = await repos.ocorrencias.findById(ocorrencia.id);
    expect(lida?.categoria).toBe("Não fez atividade");
    expect(lida?.descricao).toContain("ãõçéíú");

    const alunoLido = await repos.alunos.findById(aluno.id);
    expect(alunoLido?.nome).toBe("João Não-Silva Àcêntós");
  });

  it("grava transicao de status e historico atomicamente", async () => {
    const now = agoraIso();
    const usuario = novoUsuario();
    await repos.users.create(usuario);

    const turma: Turma = {
      id: novoId(),
      nome: `Turma Contrato ${novoId().slice(0, 6)}`,
      anoLetivo: 2026,
      turno: "Tarde",
      ativa: true,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.turmas.create(turma);

    const aluno: Aluno = {
      id: novoId(),
      nome: "Aluno Contrato",
      matricula: `M-${novoId().slice(0, 8)}`,
      turmaId: turma.id,
      responsavelNome: "",
      responsavelContato: "",
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.alunos.create(aluno);

    const ocorrencia: Ocorrencia = {
      id: novoId(),
      alunoId: aluno.id,
      categoria: "Desrespeito",
      prioridade: PrioridadeOcorrencia.ALTA,
      descricao: "Ocorrencia para teste de transicao.",
      local: "",
      testemunhas: "",
      status: StatusOcorrencia.REGISTRADA,
      criadoPorId: usuario.id,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.ocorrencias.create(ocorrencia, {
      id: novoId(),
      ocorrenciaId: ocorrencia.id,
      status: StatusOcorrencia.REGISTRADA,
      acao: "Ocorrencia registrada",
      observacao: null,
      usuarioId: usuario.id,
      criadoEm: now
    });

    const depois = agoraIso();
    const atualizada = await repos.ocorrencias.updateWithHistorico(
      ocorrencia.id,
      (atual) => ({ ...atual, status: StatusOcorrencia.EM_ANALISE, atualizadoEm: depois }),
      {
        id: novoId(),
        ocorrenciaId: ocorrencia.id,
        status: StatusOcorrencia.EM_ANALISE,
        acao: "Status alterado de REGISTRADA para EM_ANALISE",
        observacao: "Assumido pela coordenação.",
        usuarioId: usuario.id,
        criadoEm: depois
      }
    );

    expect(atualizada?.status).toBe(StatusOcorrencia.EM_ANALISE);

    const historico = await repos.ocorrencias.listHistorico(ocorrencia.id);
    expect(historico).toHaveLength(2);
    expect(historico[1]?.observacao).toBe("Assumido pela coordenação.");

    // updateWithHistorico de id inexistente nao grava nada.
    const inexistente = await repos.ocorrencias.updateWithHistorico(novoId(), (atual) => atual);
    expect(inexistente).toBeNull();
  });

  it("detecta duplicata em janela curta e filtra por criador", async () => {
    const now = agoraIso();
    const usuario = novoUsuario();
    await repos.users.create(usuario);

    const turma: Turma = {
      id: novoId(),
      nome: `Turma Dup ${novoId().slice(0, 6)}`,
      anoLetivo: 2026,
      turno: "Manhã",
      ativa: true,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.turmas.create(turma);

    const aluno: Aluno = {
      id: novoId(),
      nome: "Aluno Dup",
      matricula: `M-${novoId().slice(0, 8)}`,
      turmaId: turma.id,
      responsavelNome: "",
      responsavelContato: "",
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.alunos.create(aluno);

    const ocorrencia: Ocorrencia = {
      id: novoId(),
      alunoId: aluno.id,
      categoria: "Atraso",
      prioridade: PrioridadeOcorrencia.BAIXA,
      descricao: "Chegou atrasado após o intervalo.",
      local: "",
      testemunhas: "",
      status: StatusOcorrencia.REGISTRADA,
      criadoPorId: usuario.id,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.ocorrencias.create(ocorrencia, {
      id: novoId(),
      ocorrenciaId: ocorrencia.id,
      status: StatusOcorrencia.REGISTRADA,
      acao: "Ocorrencia registrada",
      observacao: null,
      usuarioId: usuario.id,
      criadoEm: now
    });

    const duplicata = await repos.ocorrencias.findDuplicate({
      alunoId: aluno.id,
      categoria: "atraso",
      descricao: "chegou atrasado após o intervalo.",
      criadoPorId: usuario.id,
      desde: new Date(Date.now() - 5 * 60 * 1000)
    });
    expect(duplicata?.id).toBe(ocorrencia.id);

    const outroCriador = await repos.ocorrencias.findDuplicate({
      alunoId: aluno.id,
      categoria: "atraso",
      descricao: "chegou atrasado após o intervalo.",
      criadoPorId: novoId(),
      desde: new Date(Date.now() - 5 * 60 * 1000)
    });
    expect(outroCriador).toBeNull();
  });
});
