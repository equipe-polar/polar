import { z } from "zod";

export const createNotificationSchema = z.object({
  titulo: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  mensagem: z.string().trim().min(1).optional(),
  message: z.string().trim().min(1).optional(),
  destinatarioId: z.string().trim().min(1).nullable().optional(),
  recipient: z.string().trim().min(1).nullable().optional(),
  ocorrenciaId: z.string().trim().min(1).nullable().optional(),
  occurrenceId: z.string().trim().min(1).nullable().optional()
});
