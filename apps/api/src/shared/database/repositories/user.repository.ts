import type { DatabaseClient } from "../database.js";
import type { Usuario } from "../../domain.js";

export class UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async list(): Promise<Usuario[]> {
    const state = await this.db.read();
    return state.usuarios;
  }

  async findById(id: string): Promise<Usuario | null> {
    const state = await this.db.read();
    return state.usuarios.find((usuario) => usuario.id === id) ?? null;
  }

  async findByEmailOrNome(identifier: string): Promise<Usuario | null> {
    const normalized = identifier.trim().toLowerCase();
    const state = await this.db.read();
    return (
      state.usuarios.find(
        (usuario) => usuario.email.toLowerCase() === normalized || usuario.nome.toLowerCase() === normalized
      ) ?? null
    );
  }

  async create(usuario: Usuario): Promise<Usuario> {
    return this.db.transaction((state) => {
      state.usuarios.push(usuario);
      return usuario;
    });
  }

  async update(id: string, updater: (usuario: Usuario) => Usuario): Promise<Usuario | null> {
    return this.db.transaction((state) => {
      const index = state.usuarios.findIndex((usuario) => usuario.id === id);
      if (index < 0) {
        return null;
      }

      const current = state.usuarios[index];
      if (!current) {
        return null;
      }

      const updated = updater(current);
      state.usuarios[index] = updated;
      return updated;
    });
  }
}
