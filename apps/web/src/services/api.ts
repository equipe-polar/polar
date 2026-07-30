// A API vive sob /api em qualquer ambiente. Em producao o SPA e a funcao compartilham
// origem (Vercel serve o build estatico e encaminha /api/* para a funcao), entao o
// padrao e caminho relativo. Em desenvolvimento a API roda em outra porta.
const API_URL = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "/api" : "http://localhost:3000/api")
).replace(/\/$/, "");
const TOKEN_KEY = "polar_token";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code = "API_ERROR"
  ) {
    super(message);
  }
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) ?? "";
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    throw new ApiError("Sessao expirada. Acesse novamente.", 401, "UNAUTHORIZED");
  }

  if (response.status === 403) {
    if (window.location.pathname !== "/acesso-negado") {
      window.location.assign("/acesso-negado");
    }
    throw new ApiError("Acesso negado para esta operacao.", 403, "FORBIDDEN");
  }

  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? body?.message ?? "Nao foi possivel concluir a operacao.";
    const code = body?.error?.code ?? "API_ERROR";
    throw new ApiError(message, response.status, code);
  }

  return body as T;
}
