import "@testing-library/jest-dom/vitest";
import { beforeEach, vi } from "vitest";

const storage = new Map<string, string>();

const localStorageMock: Storage = {
  get length() {
    return storage.size;
  },
  clear() {
    storage.clear();
  },
  getItem(key: string) {
    return storage.get(key) ?? null;
  },
  key(index: number) {
    return Array.from(storage.keys())[index] ?? null;
  },
  removeItem(key: string) {
    storage.delete(key);
  },
  setItem(key: string, value: string) {
    storage.set(key, value);
  }
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true
});

const turmas = [
  { id: "t1", nome: "8A", anoLetivo: 2026, turno: "Manha", ativa: true },
  { id: "t2", nome: "9B", anoLetivo: 2026, turno: "Tarde", ativa: true }
];

const alunos = [
  { id: "a1", nome: "Maria Eduarda", matricula: "2026001", turmaId: "t1", ativo: true },
  { id: "a2", nome: "Lucas Pereira", matricula: "2026002", turmaId: "t2", ativo: true }
];

const ocorrencias = [
  {
    id: "o1",
    alunoId: "a1",
    categoria: "Convivencia",
    prioridade: "ALTA",
    descricao: "Discussao recorrente no intervalo.",
    local: "Patio",
    testemunhas: "Professor Roberto",
    status: "EM_ANALISE",
    criadoPorId: "u1",
    criadoEm: "2026-05-20T10:00:00.000Z",
    atualizadoEm: "2026-05-20T10:00:00.000Z"
  },
  {
    id: "o2",
    alunoId: "a2",
    categoria: "Atraso",
    prioridade: "MEDIA",
    descricao: "Atrasos consecutivos na primeira aula.",
    local: "Sala 9B",
    testemunhas: "",
    status: "REGISTRADA",
    criadoPorId: "u1",
    criadoEm: "2026-05-21T10:00:00.000Z",
    atualizadoEm: "2026-05-21T10:00:00.000Z"
  }
];

const historico = [
  {
    id: "h1",
    ocorrenciaId: "o1",
    status: "REGISTRADA",
    acao: "Ocorrencia registrada",
    usuarioId: "u1",
    criadoEm: "2026-05-20T10:00:00.000Z"
  }
];

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

beforeEach(() => {
  storage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const rawUrl = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(rawUrl, "http://localhost:3000");
      const method = init?.method ?? "GET";

      // O client chama /api/*; as rotas abaixo sao casadas sem o prefixo, do mesmo
      // jeito que a funcao serverless recebe o caminho depois do rewrite da Vercel.
      const pathname = url.pathname.startsWith("/api/") ? url.pathname.slice(4) : url.pathname;

      if (pathname === "/auth/login" && method === "POST") {
        return jsonResponse({ token: "test-token", user: { id: "u1", nome: "Teste", email: "teste@polar.local", papel: "ADM" } });
      }

      if (pathname === "/dashboard/resumo" || pathname === "/dashboard") {
        return jsonResponse({
          data: {
            totalOcorrencias: ocorrencias.length,
            ocorrenciasPorStatus: { REGISTRADA: 1, EM_ANALISE: 1 },
            ocorrenciasPorPrioridade: { MEDIA: 1, ALTA: 1 },
            ocorrenciasPorCategoria: { Convivencia: 1, Atraso: 1 }
          }
        });
      }

      if (pathname === "/turmas" && method === "POST") {
        return jsonResponse({ data: { id: "t3", nome: "1A", anoLetivo: 2026, turno: "Manha", ativa: true } }, 201);
      }

      if (pathname.startsWith("/turmas/") && method === "PATCH") {
        return jsonResponse({ data: { ...turmas[0], nome: "8A atualizada" } });
      }

      if (pathname === "/turmas") {
        return jsonResponse({ data: turmas });
      }

      if (pathname === "/alunos" && method === "POST") {
        return jsonResponse({ data: { id: "a3", nome: "Novo Aluno", matricula: "2026003", turmaId: "t1", ativo: true } }, 201);
      }

      if (pathname === "/alunos") {
        return jsonResponse({ data: alunos });
      }

      if (pathname.startsWith("/alunos/")) {
        const id = pathname.split("/").at(-1);
        return jsonResponse({ data: alunos.find((aluno) => aluno.id === id) ?? alunos[0] });
      }

      if (pathname === "/ocorrencias" && method === "POST") {
        return jsonResponse({ data: { ...ocorrencias[0], id: "o3", status: "REGISTRADA" } }, 201);
      }

      if (pathname === "/ocorrencias") {
        return jsonResponse({ data: ocorrencias });
      }

      if (pathname.endsWith("/historico")) {
        return jsonResponse({ data: historico });
      }

      if (pathname.includes("/ocorrencias/") && pathname.endsWith("/status")) {
        return jsonResponse({ data: { ...ocorrencias[0], status: "RESOLVIDA" } });
      }

      if (pathname.startsWith("/ocorrencias/")) {
        const id = pathname.split("/").at(-1);
        return jsonResponse({ data: ocorrencias.find((ocorrencia) => ocorrencia.id === id) ?? ocorrencias[0] });
      }

      if (pathname.startsWith("/notas/alunos/")) {
        return jsonResponse({
          data: [{ id: "n1", alunoId: "a1", disciplina: "Matematica", valor: 8.5, etapa: "1 bimestre", professorId: "u1", data: "2026-05-10", criadoEm: "2026-05-10" }]
        });
      }

      if (pathname.startsWith("/faltas/alunos/")) {
        return jsonResponse({
          data: [{ id: "f1", alunoId: "a1", data: "2026-05-17", justificativa: "Atestado entregue", registradaPorId: "u1", criadoEm: "2026-05-17" }]
        });
      }

      if (pathname === "/relatorios/ocorrencias") {
        return jsonResponse({
          data: {
            total: ocorrencias.length,
            byStatus: { REGISTRADA: 1, EM_ANALISE: 1 },
            byPriority: { MEDIA: 1, ALTA: 1 },
            byCategory: { Convivencia: 1, Atraso: 1 },
            recent: ocorrencias
          }
        });
      }

      if (pathname === "/usuarios" && method === "POST") {
        return jsonResponse({ data: { id: "u3", nome: "Novo Usuario", email: "novo@polar.local", papel: "PROFESSOR", ativo: true } }, 201);
      }

      if (pathname.startsWith("/usuarios/") && method === "PATCH") {
        return jsonResponse({ data: { id: "u1", nome: "Marina Almeida", email: "marina@polar.local", papel: "ADM", ativo: false } });
      }

      if (pathname === "/usuarios") {
        return jsonResponse({
          data: [
            { id: "u1", nome: "Marina Almeida", email: "marina@polar.local", papel: "ADM", ativo: true },
            { id: "u2", nome: "Roberto Lima", email: "roberto@polar.local", papel: "COORDENADOR", ativo: true }
          ]
        });
      }

      return jsonResponse({ error: { message: "Rota nao mockada no teste." } }, 404);
    })
  );
});
