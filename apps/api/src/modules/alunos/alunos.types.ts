import { z } from "zod";

export const createAlunoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  matricula: z.string().trim().min(1).max(40),
  turmaId: z.string().trim().min(1).max(36).optional(),
  turmaNome: z.string().trim().min(1).max(120).optional(),
  responsavelNome: z.string().trim().max(120).default(""),
  responsavelContato: z.string().trim().max(80).default("")
});

export const updateAlunoSchema = createAlunoSchema.partial().extend({
  ativo: z.boolean().optional()
});
