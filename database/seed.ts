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

function turma(nome: string, turno: string, criadoDias: number): Turma {
  const criadoEm = diasAtras(criadoDias, 8);
  return {
    id: novoId(),
    nome,
    anoLetivo: 2026,
    turno,
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

    const turma1A = turma("1ºA - Informática", "Manhã", 42);
    const turma2B = turma("2ºB - Desenvolvimento de Sistemas", "Tarde", 42);
    const turma3B = turma("3ºB - Desenvolvimento de Sistemas", "Manhã", 42);
    for (const t of [turma1A, turma2B, turma3B]) {
      await repos.turmas.create(t);
    }

    const alunos = [
      aluno("Ana Clara Ribeiro", "2026001", turma1A.id, "Cláudia Ribeiro", "(11) 98801-0001"),
      aluno("Bruno Ferreira", "2026002", turma1A.id, "Marcos Ferreira", "(11) 98801-0002"),
      aluno("Camila Duarte", "2026003", turma1A.id, "Rosana Duarte", "(11) 98801-0003"),
      aluno("Diego Martins", "2026004", turma1A.id, "Sérgio Martins", "(11) 98801-0004"),
      aluno("Eduarda Nogueira", "2026005", turma1A.id, "Patrícia Nogueira", "(11) 98801-0005"),
      aluno("Felipe Cardoso", "2026006", turma2B.id, "André Cardoso", "(11) 98801-0006"),
      aluno("Gabriela Pinto", "2026007", turma2B.id, "Luciana Pinto", "(11) 98801-0007"),
      aluno("Henrique Barros", "2026008", turma2B.id, "Fátima Barros", "(11) 98801-0008"),
      aluno("Isabela Freitas", "2026009", turma2B.id, "Paulo Freitas", "(11) 98801-0009"),
      aluno("João Pedro Amaral", "2026010", turma2B.id, "Silvia Amaral", "(11) 98801-0010"),
      aluno("Larissa Campos", "2026011", turma3B.id, "Rogério Campos", "(11) 98801-0011"),
      aluno("Mateus Oliveira", "2026012", turma3B.id, "Denise Oliveira", "(11) 98801-0012"),
      aluno("Natália Souza", "2026013", turma3B.id, "Carla Souza", "(11) 98801-0013"),
      aluno("Otávio Mendes", "2026014", turma3B.id, "Ricardo Mendes", "(11) 98801-0014"),
      aluno("Paula Vasconcelos", "2026015", turma3B.id, "Helena Vasconcelos", "(11) 98801-0015")
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
        categoria: "Atraso",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Aluna chegou 25 minutos atrasada na primeira aula sem justificativa dos responsáveis.",
        local: "Sala 12",
        testemunhas: "",
        criadoPorId: professor.id,
        registradaDias: 1,
        registradaHora: 7,
        transicoes: []
      },
      {
        alunoId: alunoPorIndice(5).id,
        categoria: "Não fez atividade",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Não entregou a atividade avaliativa de Banco de Dados pela segunda semana consecutiva.",
        local: "Laboratório 2",
        testemunhas: "",
        criadoPorId: admin.id,
        registradaDias: 1,
        registradaHora: 14,
        transicoes: []
      },
      {
        alunoId: alunoPorIndice(11).id,
        categoria: "Desrespeito",
        prioridade: PrioridadeOcorrencia.MEDIA,
        descricao: "Respondeu de forma desrespeitosa à professora ao ser orientado a guardar o celular durante a explicação.",
        local: "Sala 8",
        testemunhas: "Monitora de corredor",
        criadoPorId: admin.id,
        registradaDias: 2,
        registradaHora: 9,
        transicoes: []
      },
      {
        alunoId: alunoPorIndice(7).id,
        categoria: "Atraso",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Terceiro atraso na mesma semana; aluno informou problema no transporte público.",
        local: "Portaria",
        testemunhas: "",
        criadoPorId: professor.id,
        registradaDias: 3,
        registradaHora: 7,
        transicoes: []
      },
      {
        alunoId: alunoPorIndice(2).id,
        categoria: "Agressão verbal",
        prioridade: PrioridadeOcorrencia.ALTA,
        descricao: "Discussão exaltada com colega durante o intervalo, com ofensas verbais de ambas as partes.",
        local: "Pátio",
        testemunhas: "Inspetora Renata",
        criadoPorId: professor.id,
        registradaDias: 4,
        registradaHora: 10,
        transicoes: [
          { status: StatusOcorrencia.EM_ANALISE, autorId: coordenacao.id, dias: 4, hora: 13, observacao: null }
        ]
      },
      {
        alunoId: alunoPorIndice(9).id,
        categoria: "Má conduta",
        prioridade: PrioridadeOcorrencia.MEDIA,
        descricao: "Uso de celular durante avaliação, recolhido pelo professor conforme o regimento interno.",
        local: "Sala 5",
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
        categoria: "Desrespeito",
        prioridade: PrioridadeOcorrencia.MEDIA,
        descricao: "Recusou-se a participar da atividade em grupo e debochou da orientação do professor.",
        local: "Quadra",
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
        categoria: "Não fez atividade",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Acúmulo de três atividades não entregues no bimestre na disciplina de Programação Front-End.",
        local: "Sala 12",
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
            observacao: "Conversa individual com o aluno e plano de reposição das atividades acordado com a professora."
          }
        ]
      },
      {
        alunoId: alunoPorIndice(6).id,
        categoria: "Atraso",
        prioridade: PrioridadeOcorrencia.BAIXA,
        descricao: "Atrasos recorrentes no retorno do intervalo, registrados em três dias distintos.",
        local: "Sala 7",
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
            observacao: "Responsáveis comunicados por telefone; aluna se comprometeu com a pontualidade."
          }
        ]
      },
      {
        alunoId: alunoPorIndice(12).id,
        categoria: "Má conduta",
        prioridade: PrioridadeOcorrencia.MEDIA,
        descricao: "Saiu da sala sem autorização durante a troca de professores e retornou apenas na aula seguinte.",
        local: "Corredor Bloco B",
        testemunhas: "Inspetor Jorge",
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
            observacao: "Advertência verbal aplicada e registro comunicado à família."
          }
        ]
      },
      {
        alunoId: alunoPorIndice(4).id,
        categoria: "Dano ao patrimônio",
        prioridade: PrioridadeOcorrencia.ALTA,
        descricao: "Quebrou o vidro da porta do laboratório ao arremessar uma mochila durante discussão.",
        local: "Laboratório 1",
        testemunhas: "Técnico de laboratório",
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
            observacao: "Reunião com os responsáveis realizada; família assumiu o custo do reparo."
          },
          {
            status: StatusOcorrencia.ENCERRADA,
            autorId: direcao.id,
            dias: 20,
            hora: 11,
            observacao: "Caso encerrado após reparo concluído e termo de compromisso assinado."
          }
        ]
      },
      {
        alunoId: alunoPorIndice(11).id,
        categoria: "Agressão verbal",
        prioridade: PrioridadeOcorrencia.ALTA,
        descricao: "Ofensas dirigidas a colega em rede social da turma, com prints apresentados pela família.",
        local: "Fora da escola (grupo online da turma)",
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
            observacao: "Mediação de conflito realizada entre os alunos com pedido de desculpas formal."
          },
          {
            status: StatusOcorrencia.ENCERRADA,
            autorId: direcao.id,
            dias: 26,
            hora: 10,
            observacao: "Encerrado pela direção após acompanhamento de uma semana sem reincidência."
          }
        ]
      }
    ];

    for (const seedOcorrencia of ocorrencias) {
      await inserirOcorrencia(repos, seedOcorrencia);
    }

    const notas = [
      { aluno: 11, disciplina: "Programação Back-End", valor: 7.5, etapa: "2º Bimestre", dias: 20 },
      { aluno: 11, disciplina: "Banco de Dados", valor: 8.0, etapa: "2º Bimestre", dias: 18 },
      { aluno: 0, disciplina: "Lógica de Programação", valor: 6.5, etapa: "2º Bimestre", dias: 20 },
      { aluno: 0, disciplina: "Banco de Dados", valor: 9.0, etapa: "2º Bimestre", dias: 18 },
      { aluno: 5, disciplina: "Programação Front-End", valor: 5.5, etapa: "2º Bimestre", dias: 15 },
      { aluno: 5, disciplina: "Banco de Dados", valor: 4.0, etapa: "2º Bimestre", dias: 15 }
    ];
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
    const faltas = [
      { aluno: 7, dias: 3, justificativa: "Atestado médico apresentado." },
      { aluno: 7, dias: 10, justificativa: null },
      { aluno: 2, dias: 6, justificativa: null },
      { aluno: 13, dias: 8, justificativa: "Consulta odontológica com comprovante." },
      { aluno: 5, dias: 4, justificativa: null }
    ];
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
  test: validar typecheck do database
});
