import { z } from "zod";
import { PrioridadeOcorrencia, StatusOcorrencia } from "../../shared/domain.js";

function normalizePrioridade(value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }
  const raw = String(value).trim().toUpperCase();
  const aliases: Record<string, PrioridadeOcorrencia> = {
    BAIXA: PrioridadeOcorrencia.BAIXA,
    MEDIA: PrioridadeOcorrencia.MEDIA,
    MÉDIA: PrioridadeOcorrencia.MEDIA,
    ALTA: PrioridadeOcorrencia.ALTA
  };
  return aliases[raw] ?? raw;
}

// Caracteres de controle invisiveis nao sao texto valido; acentuacao PT-BR e SEMPRE valida.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

function semCaracteresDeControle(value: string): boolean {
  return !CONTROL_CHARS.test(value);
}

function removerHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").trim();
}

function textoLimpo(max: number) {
  return z
    .string()
    .trim()
    .max(max)
    .refine(semCaracteresDeControle, { message: "Texto contem caracteres de controle invalidos." })
    .transform(removerHtml);
}

export const createOcorrenciaSchema = z.object({
  alunoId: z.string().trim().min(1, "Aluno e obrigatorio."),
  categoria: textoLimpo(120).pipe(z.string().min(1, "Categoria e obrigatoria.")),
  prioridade: z.preprocess(normalizePrioridade, z.nativeEnum(PrioridadeOcorrencia)),
  descricao: textoLimpo(2000).pipe(z.string().min(10, "Descricao deve ter pelo menos 10 caracteres.")),
  local: textoLimpo(160).optional(),
  testemunhas: textoLimpo(240).optional()
});

export const updateOcorrenciaSchema = z.object({
  categoria: textoLimpo(120).pipe(z.string().min(1)).optional(),
  prioridade: z.preprocess(normalizePrioridade, z.nativeEnum(PrioridadeOcorrencia)).optional(),
  descricao: textoLimpo(2000).pipe(z.string().min(10)).optional(),
  local: textoLimpo(160).optional(),
  testemunhas: textoLimpo(240).optional()
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(StatusOcorrencia),
  observacao: textoLimpo(500).optional()
});
