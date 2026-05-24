import { z } from "zod";
import { PapelUsuario } from "../../shared/domain.js";

export const createUserSchema = z.object({
  nome: z.string().trim().min(2).optional(),
  name: z.string().trim().min(2).optional(),
  email: z.string().trim().email(),
  papel: z.nativeEnum(PapelUsuario).optional(),
  role: z.nativeEnum(PapelUsuario).optional(),
  senha: z.string().min(8).optional(),
  password: z.string().min(8).optional()
});

export const updateUserSchema = z.object({
  nome: z.string().trim().min(2).optional(),
  email: z.string().trim().email().optional(),
  papel: z.nativeEnum(PapelUsuario).optional(),
  ativo: z.boolean().optional()
});
