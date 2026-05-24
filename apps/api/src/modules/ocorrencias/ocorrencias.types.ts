import { z } from "zod";
import { PrioridadeOcorrencia, StatusOcorrencia } from "../../shared/domain.js";

function normalizePrioridade(value: unknown): PrioridadeOcorrencia {
  const raw = String(value ?? "").trim().toUpperCase();
  const aliases: Record<string, PrioridadeOcorrencia> = {
    BAIXA: PrioridadeOcorrencia.BAIXA,
    LOW: PrioridadeOcorrencia.BAIXA,
    MEDIA: PrioridadeOcorrencia.MEDIA,
    MEDIA_: PrioridadeOcorrencia.MEDIA,
    MÉDIA: PrioridadeOcorrencia.MEDIA,
    MEDIUM: PrioridadeOcorrencia.MEDIA,
    ALTA: PrioridadeOcorrencia.ALTA,
    HIGH: PrioridadeOcorrencia.ALTA
  };
  return aliases[raw] ?? PrioridadeOcorrencia.MEDIA;
}

export const createOcorrenciaSchema = z.object({
  alunoId: z.string().trim().min(1).optional(),
  studentId: z.string().trim().min(1).optional(),
  categoria: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  prioridade: z.preprocess(normalizePrioridade, z.nativeEnum(PrioridadeOcorrencia)).optional(),
  severity: z.preprocess(normalizePrioridade, z.nativeEnum(PrioridadeOcorrencia)).optional(),
  descricao: z.string().trim().min(10).optional(),
  description: z.string().trim().min(10).optional(),
  local: z.string().trim().max(120).optional(),
  testemunhas: z.string().trim().max(300).optional()
});

export const updateOcorrenciaSchema = z.object({
  categoria: z.string().trim().min(1).optional(),
  type: z.string().trim().min(1).optional(),
  prioridade: z.preprocess(normalizePrioridade, z.nativeEnum(PrioridadeOcorrencia)).optional(),
  severity: z.preprocess(normalizePrioridade, z.nativeEnum(PrioridadeOcorrencia)).optional(),
  descricao: z.string().trim().min(10).optional(),
  description: z.string().trim().min(10).optional(),
  local: z.string().trim().max(120).optional(),
  testemunhas: z.string().trim().max(300).optional()
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(StatusOcorrencia)
});
