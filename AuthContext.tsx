import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Role, User } from "@/types";
import { getSession, getUsers, seedIfEmpty, setSession } from "@/lib/storage";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => void;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    const id = getSession();
    if (!id) {
      setUser(null);
      return;
    }
    const u = getUsers().find((x) => x.id === id) || null;
    setUser(u);
  };

  useEffect(() => {
    seedIfEmpty();
    refresh();
    setLoading(false);
  }, []);

  async function signIn(login: string, password: string) {
    const normalizedLogin = login.trim().toLowerCase();
    const u = getUsers().find(
      (x) => x.email.toLowerCase() === normalizedLogin && x.password === password
    );
    if (!u) throw new Error("Nome de acesso ou senha inválidos");
    setSession(u.id);
    setUser(u);
  }

  function signOut() {
    setSession(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, role: user?.role ?? null, loading, signIn, signOut, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
