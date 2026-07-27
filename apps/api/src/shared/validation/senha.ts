import { z } from "zod";

// Politica oficial de senha do POLAR:
// - minimo 8 e maximo 72 caracteres (limite do bcrypt);
// - sem espacos nas bordas;
// - sem caracteres de controle invisiveis.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = new RegExp("[\\u0000-\\u001F\\u007F]");

export const senhaSchema = z
  .string()
  .min(8, "Senha deve ter pelo menos 8 caracteres.")
  .max(72, "Senha deve ter no maximo 72 caracteres.")
  .refine((value) => value === value.trim(), { message: "Senha nao pode comecar nem terminar com espaco." })
  .refine((value) => !CONTROL_CHARS.test(value), { message: "Senha contem caracteres invalidos." });
