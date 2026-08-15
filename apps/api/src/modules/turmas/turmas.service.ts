import { badRequest, conflict, notFound } from "../../shared/errors/app-error.js";
import type { Turma } from "../../shared/domain.js";
import type { TurmaRepository } from "../../shared/database/repositories/turma.repository.js";
import type { AlunoRepository } from "../../shared/database/repositories/aluno.repository.js";
import type { AlunoTurmaHistoricoRepository } from "../../shared/database/repositories/aluno-turma-historico.repository.js";
import type { AuditRepository } from "../../shared/database/repositories/audit.repository.js";
import { agoraIso, novoId } from "../../shared/utils/ids.js";

interface CopiarAnoTurmaInput {
  origemId: string;
  nome: string;
  turno: string;
  alunos: string[];
}

interface CopiarAnoInput {
  anoOrigem: number;
  anoDestino: number;
  turmas: CopiarAnoTurmaInput[];
}

export class TurmasService {
  constructor(
    private readonly turmas: TurmaRepository,
    private readonly alunos: AlunoRepository,
    private readonly alunosTurmasHistorico: AlunoTurmaHistoricoRepository,
    private readonly audit: AuditRepository
  ) {}

  async list(): Promise<Turma[]> {
    return this.turmas.list();
  }

  async create(
    input: {
      nome: string;
      anoLetivo: number;
      turno: string;
    },
    actorId: string
  ): Promise<Turma> {
    const existing = await this.turmas.findByNome(input.nome);

    if (existing) {
      throw conflict("Turma ja cadastrada.");
    }

    const now = agoraIso();

    const turma: Turma = {
      id: novoId(),
      nome: input.nome,
      anoLetivo: input.anoLetivo,
      turno: input.turno,
      ativa: true,
      criadoEm: now,
      atualizadoEm: now
    };

    await this.turmas.create(turma);

    await this.audit.create({
      id: novoId(),
      usuarioId: actorId,
      acao: "TURMA_CRIADA",
      entidade: "turmas",
      entidadeId: turma.id,
      metadata: { nome: turma.nome },
      criadoEm: now
    });

    return turma;
  }

  async copiarAno(
    input: CopiarAnoInput,
    actorId: string
  ): Promise<Turma[]> {
    if (input.anoDestino <= input.anoOrigem) {
      throw badRequest(
        "O ano de destino deve ser maior que o ano de origem."
      );
    }

    if (!input.turmas.length) {
      throw badRequest(
        "E necessario informar pelo menos uma turma."
      );
    }

    const todasAsTurmas = await this.turmas.list();

    const turmasOrigem = todasAsTurmas.filter(
      (turma) => turma.anoLetivo === input.anoOrigem
    );

    if (!turmasOrigem.length) {
      throw notFound(
        `Nenhuma turma encontrada para o ano ${input.anoOrigem}.`
      );
    }

    const turmasDestino = todasAsTurmas.filter(
      (turma) => turma.anoLetivo === input.anoDestino
    );

    if (turmasDestino.length > 0) {
      throw conflict(
        `O ano ${input.anoDestino} ja possui turmas cadastradas.`
      );
    }

    const origemIds = new Set<string>();

    for (const turmaInput of input.turmas) {
      const turmaOrigem = turmasOrigem.find(
        (turma) => turma.id === turmaInput.origemId
      );

      if (!turmaOrigem) {
        throw badRequest(
          `A turma de origem ${turmaInput.origemId} nao pertence ao ano ${input.anoOrigem}.`
        );
      }

      if (origemIds.has(turmaInput.origemId)) {
        throw badRequest(
          `A turma de origem ${turmaInput.origemId} foi utilizada mais de uma vez.`
        );
      }

      origemIds.add(turmaInput.origemId);

      if (!turmaInput.nome.trim()) {
        throw badRequest(
          "O nome da turma de destino e obrigatorio."
        );
      }

      if (!turmaInput.turno.trim()) {
        throw badRequest(
          "O turno da turma de destino e obrigatorio."
        );
      }
    }

    const nomesDestino = new Set<string>();

    for (const turmaInput of input.turmas) {
      const nomeNormalizado = turmaInput.nome
        .trim()
        .toLowerCase();

      if (nomesDestino.has(nomeNormalizado)) {
        throw conflict(
          `A turma "${turmaInput.nome}" foi informada mais de uma vez.`
        );
      }

      nomesDestino.add(nomeNormalizado);

      const turmaComMesmoNome = todasAsTurmas.find(
        (turma) =>
          turma.nome.trim().toLowerCase() === nomeNormalizado
      );

      if (turmaComMesmoNome) {
        throw conflict(
          `A turma "${turmaInput.nome}" ja existe.`
        );
      }
    }

    const alunosSelecionados = new Set<string>();

    for (const turmaInput of input.turmas) {
      for (const alunoId of turmaInput.alunos) {
        if (alunosSelecionados.has(alunoId)) {
          throw badRequest(
            `O aluno ${alunoId} foi colocado em mais de uma turma.`
          );
        }

        alunosSelecionados.add(alunoId);

        const aluno = await this.alunos.findById(alunoId);

        if (!aluno) {
          throw notFound(
            `Aluno ${alunoId} nao encontrado.`
          );
        }

        if (!aluno.ativo) {
          throw badRequest(
            `O aluno ${aluno.nome} esta inativo e nao pode participar da virada.`
          );
        }

        const turmaAtual = todasAsTurmas.find(
          (turma) => turma.id === aluno.turmaId
        );

        if (!turmaAtual) {
          throw badRequest(
            `A turma atual do aluno ${aluno.nome} nao foi encontrada.`
          );
        }

        if (turmaAtual.anoLetivo !== input.anoOrigem) {
          throw badRequest(
            `O aluno ${aluno.nome} nao pertence ao ano ${input.anoOrigem}.`
          );
        }

        const historicoOrigem =
          await this.alunosTurmasHistorico.findByAlunoEAno(
            aluno.id,
            input.anoOrigem
          );

        if (historicoOrigem) {
          throw conflict(
            `O aluno ${aluno.nome} ja possui historico para o ano ${input.anoOrigem}.`
          );
        }

        const historicoDestino =
          await this.alunosTurmasHistorico.findByAlunoEAno(
            aluno.id,
            input.anoDestino
          );

        if (historicoDestino) {
          throw conflict(
            `O aluno ${aluno.nome} ja possui historico para o ano ${input.anoDestino}.`
          );
        }
      }
    }

    const novasTurmas: Turma[] = [];

    for (const turmaInput of input.turmas) {
      const now = agoraIso();

      const novaTurma: Turma = {
        id: novoId(),
        nome: turmaInput.nome.trim(),
        anoLetivo: input.anoDestino,
        turno: turmaInput.turno.trim(),
        ativa: true,
        criadoEm: now,
        atualizadoEm: now
      };

      await this.turmas.create(novaTurma);

      await this.audit.create({
        id: novoId(),
        usuarioId: actorId,
        acao: "TURMA_CRIADA",
        entidade: "turmas",
        entidadeId: novaTurma.id,
        metadata: {
          viradaAno: true,
          anoOrigem: input.anoOrigem,
          anoDestino: input.anoDestino
        },
        criadoEm: now
      });

      novasTurmas.push(novaTurma);
    }

    for (const turmaInput of input.turmas) {
      const novaTurma = novasTurmas.find(
        (turma) =>
          turma.nome === turmaInput.nome.trim()
      );

      if (!novaTurma) {
        throw notFound(
          `Turma de destino "${turmaInput.nome}" nao encontrada.`
        );
      }

      for (const alunoId of turmaInput.alunos) {
        const aluno = await this.alunos.findById(alunoId);

        if (!aluno) {
          throw notFound(
            `Aluno ${alunoId} nao encontrado.`
          );
        }

        const turmaAnterior = aluno.turmaId;
        const now = agoraIso();

        await this.alunosTurmasHistorico.create({
          id: novoId(),
          alunoId: aluno.id,
          turmaId: turmaAnterior,
          anoLetivo: input.anoOrigem,
          criadoEm: now
        });

        const atualizado = await this.alunos.update(
          aluno.id,
          (current) => ({
            ...current,
            turmaId: novaTurma.id,
            atualizadoEm: now
          })
        );

        if (!atualizado) {
          throw notFound(
            `Nao foi possivel atualizar o aluno ${aluno.nome}.`
          );
        }

        await this.alunosTurmasHistorico.create({
          id: novoId(),
          alunoId: aluno.id,
          turmaId: novaTurma.id,
          anoLetivo: input.anoDestino,
          criadoEm: agoraIso()
        });

        await this.audit.create({
          id: novoId(),
          usuarioId: actorId,
          acao: "ALUNO_ATUALIZADO",
          entidade: "alunos",
          entidadeId: aluno.id,
          metadata: {
            viradaAno: true,
            anoOrigem: input.anoOrigem,
            anoDestino: input.anoDestino,
            turmaAnteriorId: turmaAnterior,
            novaTurmaId: novaTurma.id
          },
          criadoEm: agoraIso()
        });
      }
    }

    return novasTurmas;
  }

  async update(
    id: string,
    input: {
      nome?: string | undefined;
      anoLetivo?: number | undefined;
      turno?: string | undefined;
      ativa?: boolean | undefined;
    },
    actorId: string
  ): Promise<Turma> {
    const now = agoraIso();

    const updated = await this.turmas.update(
      id,
      (current) => ({
        ...current,
        nome: input.nome ?? current.nome,
        anoLetivo: input.anoLetivo ?? current.anoLetivo,
        turno: input.turno ?? current.turno,
        ativa: input.ativa ?? current.ativa,
        atualizadoEm: now
      })
    );

    if (!updated) {
      throw notFound("Turma nao encontrada.");
    }

    await this.audit.create({
      id: novoId(),
      usuarioId: actorId,
      acao: "TURMA_ATUALIZADA",
      entidade: "turmas",
      entidadeId: updated.id,
      metadata: {},
      criadoEm: now
    });

    return updated;
  }

  async delete(
    id: string,
    actorId: string
  ): Promise<void> {
    const alunosDaTurma =
      await this.alunos.listByTurma(id);

    if (alunosDaTurma.length > 0) {
      throw conflict(
        "Nao e permitido inativar turma com alunos ativos vinculados."
      );
    }

    const now = agoraIso();

    const updated = await this.turmas.update(
      id,
      (current) => ({
        ...current,
        ativa: false,
        atualizadoEm: now
      })
    );

    if (!updated) {
      throw notFound(
        "Turma nao encontrada."
      );
    }

    await this.audit.create({
      id: novoId(),
      usuarioId: actorId,
      acao: "TURMA_INATIVADA",
      entidade: "turmas",
      entidadeId: id,
      metadata: {},
      criadoEm: now
    });
  }
}