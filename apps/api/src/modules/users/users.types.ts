import { z } from "zod";
import { PapelUsuario } from "../../shared/domain.js";
import { senhaSchema } from "../../shared/validation/senha.js";

export const createUserSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  papel: z.nativeEnum(PapelUsuario),
  senha: senhaSchema
});

export const updateUserSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().max(160).optional(),
  papel: z.nativeEnum(PapelUsuario).optional(),
  ativo: z.boolean().optional()
});
