// Seed de demonstracao do POLAR.
// Cria usuarios (um por papel), turmas, alunos e ocorrencias nos 4 estados,
// com historico coerente, notas e faltas. Funciona nos dois providers:
//   DATABASE_PROVIDER=postgres -> insere no PostgreSQL (schema.sql deve ter sido aplicado antes)
//   DATABASE_PROVIDER=json     -> escreve no arquivo JSON de desenvolvimento
// Idempotente: nao faz nada se ja existirem usuarios.

import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { createJsonDatabase } from "../apps/api/src/shared/database/database.js";
import { createJsonRepositories, type Repositories } from "../apps/api/src/shared/services.js";
import {
  PapelUsuario,
  PrioridadeOcorrencia,
  StatusOcorrencia,
  TipoEnsino,
  type Aluno,
  type Ocorrencia,
  type OcorrenciaHistorico,
  type Turma,
  type Usuario
} from "../apps/api/src/shared/domain.js";
import { novoId } from "../apps/api/src/shared/utils/ids.js";
import { CONTAS } from "./contas.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.resolve(repoRoot, "apps/api/.env"), quiet: true });

function diasAtras(dias: number, hora = 10, minuto = 0): string {
  const data = new Date();
  data.setUTCDate(data.getUTCDate() - dias);
  data.setUTCHours(hora, minuto, 0, 0);
  return data.toISOString();
}

function dataOnly(dias: number): string {
  return diasAtras(dias).slice(0, 10);
}

interface SeedContext {
  repos: Repositories;
  close: () => Promise<void>;
}

async function criarContexto(): Promise<SeedContext> {
  const provider = process.env.DATABASE_PROVIDER ?? "json";

  if (provider === "postgres") {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL e obrigatorio quando DATABASE_PROVIDER=postgres.");
    }
    const { createPostgresPool, createPostgresRepositories } = await import(
      "../apps/api/src/shared/database/postgres/index.js"
    );
    const pool = createPostgresPool({
      url,
      ssl: process.env.DATABASE_SSL === "true" || process.env.DATABASE_SSL === "1"
    });
    return {
      repos: createPostgresRepositories(pool),
      close: async () => {
        await pool.end();
      }
    };
  }

  const jsonPath = path.resolve(repoRoot, process.env.DATABASE_JSON_PATH ?? "apps/api/data/dev-db.json");
  const db = createJsonDatabase(jsonPath);
  return {
    repos: createJsonRepositories(db),
    close: async () => {}
  };
}

function usuario(nome: string, email: string, papel: PapelUsuario, senhaHash: string, criadoDias: number): Usuario {
  const criadoEm = diasAtras(criadoDias, 8);
  return {
    id: novoId(),
    nome,
    email,
    papel,
    senhaHash,
    ativo: true,
    precisaTrocarSenha: false,
    tentativasLoginInvalidas: 0,
    bloqueadoAte: null,
    ultimoLoginEm: null,
    criadoEm,
    atualizadoEm: criadoEm
  };
}

function turma(nome: string, turno: string, tipoEnsino: TipoEnsino, criadoDias: number): Turma {
  const criadoEm = diasAtras(criadoDias, 8);
  return {
    id: novoId(),
    nome,
    anoLetivo: 2026,
    turno,
    tipoEnsino,
    ativa: true,
    criadoEm,
    atualizadoEm: criadoEm
  };
}

function aluno(nome: string, matricula: string, turmaId: string, responsavel: string, contato: string): Aluno {
  const criadoEm = diasAtras(45, 9);
  return {
    id: novoId(),
    nome,
    matricula,
    turmaId,
    responsavelNome: responsavel,
    responsavelContato: contato,
    ativo: true,
    criadoEm,
    atualizadoEm: criadoEm
  };
}

interface Transicao {
  status: StatusOcorrencia;
  autorId: string;
  dias: number;
  hora: number;
  observacao: string | null;
}

interface OcorrenciaSeed {
  alunoId: string;
  categoria: string;
  prioridade: PrioridadeOcorrencia;
  descricao: string;
  local: string;
  testemunhas: string;
  criadoPorId: string;
  registradaDias: number;
  registradaHora: number;
  transicoes: Transicao[];
}

async function inserirOcorrencia(repos: Repositories, seed: OcorrenciaSeed): Promise<void> {
  const criadoEm = diasAtras(seed.registradaDias, seed.registradaHora);
  const ultima = seed.transicoes[seed.transicoes.length - 1];
  const atualizadoEm = ultima ? diasAtras(ultima.dias, ultima.hora) : criadoEm;
  const statusFinal = ultima ? ultima.status : StatusOcorrencia.REGISTRADA;

  const ocorrencia: Ocorrencia = {
    id: novoId(),
    alunoId: seed.alunoId,
    categoria: seed.categoria,
    prioridade: seed.prioridade,
    descricao: seed.descricao,
    local: seed.local,
    testemunhas: seed.testemunhas,
    status: statusFinal,
    criadoPorId: seed.criadoPorId,
    criadoEm,
    atualizadoEm
  };

  const primeiroHistorico: OcorrenciaHistorico = {
    id: novoId(),
    ocorrenciaId: ocorrencia.id,
    status: StatusOcorrencia.REGISTRADA,
    acao: "Ocorrencia registrada",
    observacao: null,
    usuarioId: seed.criadoPorId,
    criadoEm
  };

  await repos.ocorrencias.create(ocorrencia, primeiroHistorico);

  let statusAnterior: StatusOcorrencia = StatusOcorrencia.REGISTRADA;
  for (const transicao of seed.transicoes) {
    await repos.ocorrencias.createHistorico({
      id: novoId(),
      ocorrenciaId: ocorrencia.id,
      status: transicao.status,
      acao: `Status alterado de ${statusAnterior} para ${transicao.status}`,
      observacao: transicao.observacao,
      usuarioId: transicao.autorId,
      criadoEm: diasAtras(transicao.dias, transicao.hora)
    });
    statusAnterior = transicao.status;
  }
}

async function main(): Promise<void> {
  const senha = process.env.SEED_SENHA_PADRAO;
  if (!senha || senha.length < 8) {
    throw new Error("Defina SEED_SENHA_PADRAO (minimo 8 caracteres) para executar o seed.");
  }

  const { repos, close } = await criarContexto();

  try {
    // Guarda pelo e-mail sentinela do seed (nao por "banco vazio"): permite que
    // o seed rode mesmo depois do bootstrap ja ter criado um admin real, e
    // vice-versa. As duas rotinas coexistem em qualquer ordem de execucao.
    const seedJaAplicado = await repos.users.findByEmailOrNome(CONTAS.adm.email);
    if (seedJaAplicado) {
      console.log(`Seed ja aplicado (${CONTAS.adm.email} existe); seed ignorado.`);
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // Contas fixas de controle e teste: uma por papel, sem excecao.
    // Sao as unicas contas que o sistema cria; nao existem usuarios extras.
    const admin = usuario(CONTAS.adm.nome, CONTAS.adm.email, PapelUsuario.ADM, senhaHash, 40);
    const professor = usuario(CONTAS.professor.nome, CONTAS.professor.email, PapelUsuario.PROFESSOR, senhaHash, 40);
    const coordenacao = usuario(
      CONTAS.coordenacao.nome,
      CONTAS.coordenacao.email,
      PapelUsuario.COORDENADOR,
      senhaHash,
      40
    );
    const direcao = usuario(CONTAS.direcao.nome, CONTAS.direcao.email, PapelUsuario.DIRETOR, senhaHash, 40);
    const contaAluno = usuario(CONTAS.aluno.nome, CONTAS.aluno.email, PapelUsuario.ALUNO, senhaHash, 40);
    for (const u of [admin, professor, coordenacao, direcao, contaAluno]) {
      await repos.users.create(u);
    }

    const turma1A = turma("1ºA - Informática", "Manhã", TipoEnsino.REGULAR, 42);
    const turma2B = turma("2ºB - Desenvolvimento de Sistemas", "Tarde", TipoEnsino.TECNICO, 42);
    const turma3B = turma("3ºB - Desenvolvimento de Sistemas", "Manhã", TipoEnsino.TECNICO, 42);
    for (const t of [turma1A, turma2B, turma3B]) {
      await repos.turmas.create(t);
    }

    const alunos = [
      aluno("Estudante 01", "2026001", turma1A.id, "Responsavel 01", "nao-informado"),
      aluno("Estudante 02", "2026002", turma1A.id, "Responsavel 02", "nao-informado"),
      aluno("Estudante 03", "2026003", turma1A.id, "Responsavel 03", "nao-informado"),
      aluno("Estudante 04", "2026004", turma1A.id, "Responsavel 04", "nao-informado"),
      aluno("Estudante 05", "2026005", turma1A.id, "Responsavel 05", "nao-informado"),
      aluno("Estudante 06", "2026006", turma2B.id, "Responsavel 06", "nao-informado"),
      aluno("Estudante 07", "2026007", turma2B.id, "Responsavel 07", "nao-informado"),
      aluno("Estudante 08", "2026008", turma2B.id, "Responsavel 08", "nao-informado"),
      aluno("Estudante 09", "2026009", turma2B.id, "Responsavel 09", "nao-informado"),
      aluno("Estudante 10", "2026010", turma2B.id, "Responsavel 10", "nao-informado"),
      aluno("Estudante 11", "2026011", turma3B.id, "Responsavel 11", "nao-informado"),
      aluno("Estudante 12", "2026012", turma3B.id, "Responsavel 12", "nao-informado"),
      aluno("Estudante 13", "2026013", turma3B.id, "Responsavel 13", "nao-informado"),
      aluno("Estudante 14", "2026014", turma3B.id, "Responsavel 14", "nao-informado"),
      aluno("Estudante 15", "2026015", turma3B.id, "Responsavel 15", "nao-informado")
    ];
    for (const a of alunos) {
      await repos.alunos.create(a);
    }
    const alunoPorIndice = (i: number): Aluno => {
      const encontrado = alunos[i];
      if (!encontrado) {
        throw new Error(`Aluno de seed inexistente no indice ${i}.`);
      }
      return encontrado;
    };

    // 4 REGISTRADA, 3 EM_ANALISE, 3 RESOLVIDA, 2 ENCERRADA, divididas entre dois
    // autores (professor e ADM, que tambem possui REGISTRAR_OCORRENCIA). Com um
    // autor so, o escopo por papel ficaria invisivel na demonstracao.
    const ocorrencias: OcorrenciaSeed[] = [
      {
        alunoId: alunoPorIndice(0).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: professor.id,
        registradaDias: 1,
        registradaHora: 7,
        transicoes: []
      },
      {
        alunoId: alunoPorIndice(5).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: admin.id,
        registradaDias: 1,
        registradaHora: 14,
        transicoes: []
      },
      {
        alunoId: alunoPorIndice(11).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.MEDIA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: admin.id,
        registradaDias: 2,
        registradaHora: 9,
        transicoes: []
      },
      {
        alunoId: alunoPorIndice(7).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: professor.id,
        registradaDias: 3,
        registradaHora: 7,
        transicoes: []
      },
      {
        alunoId: alunoPorIndice(2).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.ALTA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: professor.id,
        registradaDias: 4,
        registradaHora: 10,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 4, hora: 13, observacao: null }
        ]
      },
      {
        alunoId: alunoPorIndice(9).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.MEDIA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: admin.id,
        registradaDias: 5,
        registradaHora: 15,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 5, hora: 17, observacao: null }
        ]
      },
      {
        alunoId: alunoPorIndice(13).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.MEDIA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: professor.id,
        registradaDias: 6,
        registradaHora: 11,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 6, hora: 14, observacao: null }
        ]
      },
      {
        alunoId: alunoPorIndice(3).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: admin.id,
        registradaDias: 12,
        registradaHora: 9,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 11, hora: 10, observacao: null },
          {
            status: StatusOcorrencia.RESOLVIDA,
            autorId: coordenacao.id,
            dias: 10,
            hora: 16,
            observacao: "Fluxo demonstrativo concluído."
          }
        ]
      },
      {
        alunoId: alunoPorIndice(6).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: professor.id,
        registradaDias: 14,
        registradaHora: 13,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 13, hora: 9, observacao: null },
          {
            status: StatusOcorrencia.RESOLVIDA,
            autorId: coordenacao.id,
            dias: 12,
            hora: 11,
            observacao: "Fluxo demonstrativo concluído."
          }
        ]
      },
      {
        alunoId: alunoPorIndice(12).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.MEDIA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: admin.id,
        registradaDias: 16,
        registradaHora: 10,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 15, hora: 14, observacao: null },
          {
            status: StatusOcorrencia.RESOLVIDA,
            autorId: coordenacao.id,
            dias: 14,
            hora: 15,
            observacao: "Fluxo demonstrativo concluído."
          }
        ]
      },
      {
        alunoId: alunoPorIndice(4).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.ALTA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: professor.id,
        registradaDias: 25,
        registradaHora: 9,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 24, hora: 10, observacao: null },
          {
            status: StatusOcorrencia.RESOLVIDA,
            autorId: coordenacao.id,
            dias: 22,
            hora: 15,
            observacao: "Fluxo demonstrativo concluído."
          },
          {
            status: StatusOcorrencia.ENCERRADA,
            autorId: direcao.id,
            dias: 20,
            hora: 11,
            observacao: "Fluxo demonstrativo encerrado."
          }
        ]
      },
      {
        alunoId: alunoPorIndice(11).id,
        categoria: "Registro demonstrativo",
        prioridade: PrioridadeOcorrencia.ALTA,
        descricao: "Registro demonstrativo sem dados pessoais.",
        local: "Ambiente escolar",
        testemunhas: "",
        criadoPorId: admin.id,
        registradaDias: 30,
        registradaHora: 8,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 29, hora: 9, observacao: null },
          {
            status: StatusOcorrencia.RESOLVIDA,
            autorId: coordenacao.id,
            dias: 27,
            hora: 14,
            observacao: "Fluxo demonstrativo concluído."
          },
          {
            status: StatusOcorrencia.ENCERRADA,
            autorId: direcao.id,
            dias: 26,
            hora: 10,
            observacao: "Fluxo demonstrativo encerrado."
          }
        ]
      }
    ];

    for (const seedOcorrencia of ocorrencias) {
      await inserirOcorrencia(repos, seedOcorrencia);
    }

    const notas: Array<{ aluno: number; disciplina: string; valor: number; etapa: string; dias: number }> = [];
    for (const n of notas) {
      await repos.notas.create({
        id: novoId(),
        alunoId: alunoPorIndice(n.aluno).id,
        disciplina: n.disciplina,
        valor: n.valor,
        etapa: n.etapa,
        professorId: admin.id,
        data: dataOnly(n.dias),
        criadoEm: diasAtras(n.dias, 12)
      });
    }

    // Aluno + data sao unicos (uq_faltas_aluno_data).
    const faltas: Array<{ aluno: number; dias: number; justificativa: string | null }> = [];
    for (const f of faltas) {
      await repos.faltas.create({
        id: novoId(),
        alunoId: alunoPorIndice(f.aluno).id,
        data: dataOnly(f.dias),
        justificativa: f.justificativa,
        registradaPorId: professor.id,
        criadoEm: diasAtras(f.dias, 8)
      });
    }

    console.log("Seed concluído com sucesso.");
    console.log("Contas de controle (senha única definida em SEED_SENHA_PADRAO):");
    console.log(`  PROFESSOR:   ${CONTAS.professor.email}`);
    console.log(`  COORDENADOR: ${CONTAS.coordenacao.email}`);
    console.log(`  DIRETOR:     ${CONTAS.direcao.email}`);
    console.log(`  ADM:         ${CONTAS.adm.email}`);
    console.log(`  ALUNO:       ${CONTAS.aluno.email}`);
  } finally {
    await close();
  }
}

main().catch((error: unknown) => {
  // 42P01 = undefined_table no PostgreSQL.
  if (typeof error === "object" && error !== null && "code" in error && error.code === "42P01") {
    console.error('Tabelas nao encontradas. Aplique o schema antes: psql "$DATABASE_URL" -f database/schema.sql');
  }
  console.error(error);
  process.exitCode = 1;
});
