import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { clearToken } from "../services/api";
import type { AuthUser } from "../features/auth/auth.types";
import { clearUser, getStoredUser, storeUser } from "../features/auth/auth.service";

interface AuthContextValue {
  user: AuthUser | null;
  setAuthenticatedUser: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setAuthenticatedUser(nextUser) {
        storeUser(nextUser);
        setUser(nextUser);
      },
      logout() {
        clearToken();
        clearUser();
        setUser(null);
      }
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AppProviders.");
  }
  return context;
}
