import { z } from "zod";

export const createFaltaSchema = z.object({
  alunoId: z.string().trim().min(1),
  data: z.string().date(),
  justificativa: z.string().trim().min(1).nullable().optional()
});
