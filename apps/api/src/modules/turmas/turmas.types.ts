import { z } from "zod";

export const createTurmaSchema = z.object({
  nome: z.string().trim().min(1),
  anoLetivo: z.coerce.number().int().min(2000).max(2100),
  turno: z.string().trim().min(1).default("Integral")
});

export const updateTurmaSchema = z.object({
  nome: z.string().trim().min(1).optional(),
  anoLetivo: z.coerce.number().int().min(2000).max(2100).optional(),
  turno: z.string().trim().min(1).optional(),
  ativa: z.boolean().optional()
});
