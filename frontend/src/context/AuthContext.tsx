import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type User = { id: string; email: string; firstName?: string; lastName?: string; fullName: string; address?: string; role: "admin" | "trainer" | "member" } | null;

type AuthContextValue = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; address?: string; role?: "admin" | "trainer" | "member" }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .me()
      .then((u) => setUser(u as User))
      .catch(() => {
        localStorage.removeItem("auth_token");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.login({ email, password });
    localStorage.setItem("auth_token", res.token);
    setUser(res.user as User);
  }

  async function register(data: { email: string; password: string; firstName: string; lastName: string; address?: string; role?: "admin" | "trainer" | "member" }) {
    const res = await api.register(data);
    localStorage.setItem("auth_token", res.token);
    setUser(res.user as User);
  }

  function logout() {
    localStorage.removeItem("auth_token");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}



