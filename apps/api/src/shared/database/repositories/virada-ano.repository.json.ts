import crypto from "node:crypto";
import type { Turma } from "../../domain.js";
import type { DatabaseClient } from "../database.js";
import type {
  ViradaAnoRepository,
  ViradaAnoTurmaInput
} from "./virada-ano.repository.js";
import { agoraIso } from "../../utils/ids.js";

export class JsonViradaAnoRepository implements ViradaAnoRepository {
  constructor(private readonly db: DatabaseClient) {}

  async executar(
    _anoOrigem: number,
    _anoDestino: number,
    turmas: ViradaAnoTurmaInput[],
    actorId: string
  ): Promise<Turma[]> {
    return this.db.transaction((state) => {
      for (const turmaInput of turmas) {
        const agora = agoraIso();

        state.turmas.push(turmaInput.turmaDestino);

        state.auditLogs.push({
          id: crypto.randomUUID(),
          usuarioId: actorId,
          acao: "TURMA_CRIADA",
          entidade: "turmas",
          entidadeId: turmaInput.turmaDestino.id,
          metadata: {
            viradaAno: true,
            anoOrigem: turmaInput.turmaOrigem.anoLetivo,
            anoDestino: turmaInput.turmaDestino.anoLetivo
          },
          criadoEm: agora
        });

        for (const aluno of turmaInput.alunos) {
          const jaPossuiHistoricoOrigem = state.alunosTurmasHistorico.some(
            (item) =>
              item.alunoId === aluno.id &&
              item.anoLetivo === turmaInput.turmaOrigem.anoLetivo
          );

          if (!jaPossuiHistoricoOrigem) {
            state.alunosTurmasHistorico.push({
              id: crypto.randomUUID(),
              alunoId: aluno.id,
              turmaId: turmaInput.turmaOrigem.id,
              anoLetivo: turmaInput.turmaOrigem.anoLetivo,
              criadoEm: agora
            });
          }

          const index = state.alunos.findIndex(
            (item) => item.id === aluno.id
          );

          if (index < 0) {
            throw new Error(
              `Aluno ${aluno.id} nao encontrado.`
            );
          }

          const atual = state.alunos[index];

          if (!atual) {
            throw new Error(
              `Aluno ${aluno.id} nao encontrado.`
            );
          }

          state.alunos[index] = {
            id: atual.id,
            nome: atual.nome,
            matricula: atual.matricula,
            turmaId: turmaInput.turmaDestino.id,
            responsavelNome: atual.responsavelNome,
            responsavelContato: atual.responsavelContato,
            ativo: atual.ativo,
            criadoEm: atual.criadoEm,
            atualizadoEm: agora
          };

          const jaPossuiHistoricoDestino = state.alunosTurmasHistorico.some(
            (item) =>
              item.alunoId === aluno.id &&
              item.anoLetivo === turmaInput.turmaDestino.anoLetivo
          );

          if (!jaPossuiHistoricoDestino) {
            state.alunosTurmasHistorico.push({
              id: crypto.randomUUID(),
              alunoId: aluno.id,
              turmaId: turmaInput.turmaDestino.id,
              anoLetivo: turmaInput.turmaDestino.anoLetivo,
              criadoEm: agora
            });
          }

          state.auditLogs.push({
            id: crypto.randomUUID(),
            usuarioId: actorId,
            acao: "ALUNO_ATUALIZADO",
            entidade: "alunos",
            entidadeId: aluno.id,
            metadata: {
              viradaAno: true,
              anoOrigem: turmaInput.turmaOrigem.anoLetivo,
              anoDestino: turmaInput.turmaDestino.anoLetivo,
              turmaAnteriorId: aluno.turmaId,
              novaTurmaId: turmaInput.turmaDestino.id
            },
            criadoEm: agora
          });
        }
      }

      return turmas.map(
        (turmaInput) => turmaInput.turmaDestino
      );
    });
  }
}
