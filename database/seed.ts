import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createJsonDatabase } from "../apps/api/src/shared/database/database.js";
import { PapelUsuario, type Usuario } from "../apps/api/src/shared/domain.js";
import { agoraIso, novoId } from "../apps/api/src/shared/utils/ids.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function main(): Promise<void> {
  const db = createJsonDatabase(path.resolve(repoRoot, process.env.DATABASE_JSON_PATH ?? "apps/api/data/dev-db.json"));
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!password) {
    throw new Error("Defina BOOTSTRAP_ADMIN_PASSWORD para executar o seed.");
  }

  await db.transaction(async (state) => {
    if (state.usuarios.some((usuario) => usuario.papel === PapelUsuario.ADM)) {
      return;
    }

    const now = agoraIso();
    const admin: Usuario = {
      id: novoId(),
      nome: "Administrador",
      email: process.env.BOOTSTRAP_ADMIN_EMAIL ?? "admin@pola.local",
      papel: PapelUsuario.ADM,
      senhaHash: await bcrypt.hash(password, 10),
      ativo: true,
      precisaTrocarSenha: true,
      tentativasLoginInvalidas: 0,
      bloqueadoAte: null,
      ultimoLoginEm: null,
      criadoEm: now,
      atualizadoEm: now
    };

    state.usuarios.push(admin);
  });

  console.log("Seed concluido.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
