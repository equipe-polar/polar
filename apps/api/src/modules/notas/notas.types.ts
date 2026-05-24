import { z } from "zod";

export const createNotaSchema = z.object({
  alunoId: z.string().trim().min(1),
  disciplina: z.string().trim().min(1),
  valor: z.coerce.number().min(0).max(10),
  etapa: z.string().trim().min(1),
  data: z.string().date()
});
