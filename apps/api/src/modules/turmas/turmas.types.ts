import { z } from "zod";
import { TipoEnsino } from "../../shared/domain.js";

const tipoEnsinoSchema = z.nativeEnum(TipoEnsino);

// Os limites maximos espelham as colunas de database/schema.sql: entrada longa
// demais e rejeitada com 400 pela validacao, nunca com erro cru do banco.
export const createTurmaSchema = z.object({
  nome: z.string().trim().min(1).max(120),
  anoLetivo: z.coerce.number().int().min(2000).max(2100),
  turno: z.string().trim().min(1).max(40).default("Integral"),
  tipoEnsino: tipoEnsinoSchema.default(TipoEnsino.REGULAR)
});

export const updateTurmaSchema = z.object({
  nome: z.string().trim().min(1).max(120).optional(),
  anoLetivo: z.coerce.number().int().min(2000).max(2100).optional(),
  turno: z.string().trim().min(1).max(40).optional(),
  tipoEnsino: tipoEnsinoSchema.optional(),
  ativa: z.boolean().optional()
});

export const copiarAnoTurmaSchema = z.object({
  origemId: z.string().min(1),
  nome: z.string().trim().min(1).max(120),
  turno: z.string().trim().min(1).max(40),
  tipoEnsino: tipoEnsinoSchema.optional(),
  alunos: z.array(z.string().min(1))
});

export const copiarAnoSchema = z.object({
  anoOrigem: z.coerce.number().int().min(2000).max(2100),
  anoDestino: z.coerce.number().int().min(2000).max(2100),
  turmas: z.array(copiarAnoTurmaSchema).min(1)
});
