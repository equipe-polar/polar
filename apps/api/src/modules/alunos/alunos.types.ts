import { z } from "zod";

export const createAlunoSchema = z.object({
  nome: z.string().trim().min(2).optional(),
  name: z.string().trim().min(2).optional(),
  matricula: z.string().trim().min(1).optional(),
  registration: z.string().trim().min(1).optional(),
  turmaId: z.string().trim().min(1).optional(),
  turmaNome: z.string().trim().min(1).optional(),
  class: z.string().trim().min(1).optional(),
  responsavelNome: z.string().trim().default(""),
  responsibleName: z.string().trim().optional(),
  responsavelContato: z.string().trim().default(""),
  responsibleContact: z.string().trim().optional()
});

export const updateAlunoSchema = createAlunoSchema.partial().extend({
  ativo: z.boolean().optional()
});
