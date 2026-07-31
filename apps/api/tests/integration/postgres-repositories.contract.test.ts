// Teste de contrato dos repositorios PostgreSQL.
// So roda quando TEST_DATABASE_URL aponta para um Postgres com o schema aplicado
// (ex: postgresql://polar:senha@localhost:5432/polar_test). Sem a variavel, e
// ignorado e o CI permanece verde sem banco.
//
// E a prova real da migracao MySQL -> PostgreSQL: cobre acentuacao PT-BR,
// integridade de boolean e data, NUMERIC voltando como number, atomicidade da
// transacao de status + historico e deteccao de duplicata.
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

describe.runIf(Boolean(url))("repositorios PostgreSQL (contrato)", () => {
  let repos: Repositories;
  let close: () => Promise<void> = async () => {};

  beforeAll(async () => {
    const { createPostgresPool, createPostgresRepositories } = await import(
      "../../src/shared/database/postgres/index.js"
    );
    const pool = createPostgresPool({ url: url as string, ssl: process.env.TEST_DATABASE_SSL === "true" });
    repos = createPostgresRepositories(pool);
    close = async () => {
      await pool.end();
    };

    // TRUNCATE unico com CASCADE: o Postgres resolve a ordem das FKs sozinho,
    // sem precisar desligar a checagem de chave estrangeira como no MySQL.
    await pool.query(
      "TRUNCATE TABLE audit_logs, faltas, notas, ocorrencia_historico, ocorrencias, alunos, turmas, users RESTART IDENTITY CASCADE"
    );
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

  // DECIMAL(4,2) virou NUMERIC(4,2). O driver pg devolve NUMERIC como string por
  // padrao, e o dominio tipa `valor: number` -- este teste guarda o parser de tipo
  // registrado em postgres-client.ts. Sem ele, a quebra e silenciosa.
  it("devolve nota NUMERIC como number, e nao string", async () => {
    const now = agoraIso();
    const usuario = novoUsuario();
    await repos.users.create(usuario);

    const turma: Turma = {
      id: novoId(),
      nome: `Turma Nota ${novoId().slice(0, 6)}`,
      anoLetivo: 2026,
      turno: "Manhã",
      ativa: true,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.turmas.create(turma);

    const aluno: Aluno = {
      id: novoId(),
      nome: "Aluno Nota",
      matricula: `M-${novoId().slice(0, 8)}`,
      turmaId: turma.id,
      responsavelNome: "",
      responsavelContato: "",
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    };
    await repos.alunos.create(aluno);

    await repos.notas.create({
      id: novoId(),
      alunoId: aluno.id,
      disciplina: "Banco de Dados",
      valor: 8.5,
      etapa: "1º bimestre",
      professorId: usuario.id,
      data: "2026-03-10",
      criadoEm: now
    });

    const notas = await repos.notas.listByAluno(aluno.id);
    expect(notas).toHaveLength(1);
    expect(typeof notas[0]?.valor).toBe("number");
    expect(notas[0]?.valor).toBe(8.5);
    // DATE e dia civil: precisa voltar exatamente como foi gravado, sem
    // deslocamento de fuso ao passar por Date.
    expect(notas[0]?.data).toBe("2026-03-10");
  });

  it("preserva acentuacao PT-BR em turmas, alunos e ocorrencias (UTF8)", async () => {
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
