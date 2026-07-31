import { z } from "zod";

export const createNotaSchema = z.object({
  alunoId: z.string().trim().min(1).max(36),
  disciplina: z.string().trim().min(1).max(120),
  valor: z.coerce.number().min(0).max(10),
  etapa: z.string().trim().min(1).max(40),
  data: z.string().date()
});
