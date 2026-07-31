import fs from "node:fs/promises";
import path from "node:path";
import type { DatabaseState } from "../domain.js";

export interface DatabaseClient {
  read(): Promise<DatabaseState>;
  write(state: DatabaseState): Promise<void>;
  transaction<T>(mutator: (state: DatabaseState) => Promise<T> | T): Promise<T>;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createInitialState(): DatabaseState {
  return {
    usuarios: [],
    turmas: [],
    alunos: [],
    ocorrencias: [],
    ocorrenciaHistorico: [],
    notas: [],
    faltas: [],
    auditLogs: []
  };
}

function normalizeState(input: Partial<DatabaseState> | null): DatabaseState {
  const base = createInitialState();
  if (!input) {
    return base;
  }

  return {
    usuarios: Array.isArray(input.usuarios) ? input.usuarios : base.usuarios,
    turmas: Array.isArray(input.turmas) ? input.turmas : base.turmas,
    alunos: Array.isArray(input.alunos) ? input.alunos : base.alunos,
    ocorrencias: Array.isArray(input.ocorrencias) ? input.ocorrencias : base.ocorrencias,
    ocorrenciaHistorico: Array.isArray(input.ocorrenciaHistorico)
      ? input.ocorrenciaHistorico
      : base.ocorrenciaHistorico,
    notas: Array.isArray(input.notas) ? input.notas : base.notas,
    faltas: Array.isArray(input.faltas) ? input.faltas : base.faltas,
    auditLogs: Array.isArray(input.auditLogs) ? input.auditLogs : base.auditLogs
  };
}

export class MemoryDatabase implements DatabaseClient {
  private state: DatabaseState;

  constructor(initialState: DatabaseState = createInitialState()) {
    this.state = clone(initialState);
  }

  async read(): Promise<DatabaseState> {
    return clone(this.state);
  }

  async write(state: DatabaseState): Promise<void> {
    this.state = clone(normalizeState(state));
  }

  async transaction<T>(mutator: (state: DatabaseState) => Promise<T> | T): Promise<T> {
    const workingCopy = clone(this.state);
    const result = await mutator(workingCopy);
    this.state = clone(normalizeState(workingCopy));
    return clone(result);
  }
}

export class JsonDatabase implements DatabaseClient {
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async read(): Promise<DatabaseState> {
    return this.load();
  }

  async write(state: DatabaseState): Promise<void> {
    await this.save(normalizeState(state));
  }

  async transaction<T>(mutator: (state: DatabaseState) => Promise<T> | T): Promise<T> {
    const previous = this.queue;
    let release: () => void = () => undefined;
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });

    await previous;
    try {
      const state = await this.load();
      const result = await mutator(state);
      await this.save(normalizeState(state));
      return clone(result);
    } finally {
      release();
    }
  }

  private async load(): Promise<DatabaseState> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      return normalizeState(JSON.parse(raw) as Partial<DatabaseState>);
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
        const initial = createInitialState();
        await this.save(initial);
        return initial;
      }

      throw error;
    }
  }

  private async save(state: DatabaseState): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    await fs.rename(temporaryPath, this.filePath);
  }
}

export function createMemoryDatabase(initialState?: DatabaseState): DatabaseClient {
  return new MemoryDatabase(initialState);
}

export function createJsonDatabase(filePath: string): DatabaseClient {
  return new JsonDatabase(path.resolve(process.cwd(), filePath));
}
