import { apiRequest, setToken } from "../../services/api";
import type { AuthUser, LoginResponse } from "./auth.types";

const USER_KEY = "polar_user";

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
}

export async function loginRequest(identifier: string, senha: string): Promise<LoginResponse> {
  const result = await apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: identifier, username: identifier, senha })
  });
  setToken(result.token);
  storeUser(result.user);
  return result;
}
