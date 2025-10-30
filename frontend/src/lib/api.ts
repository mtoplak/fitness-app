export type ApiConfig = {
  baseUrl: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("auth_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });
  if (!res.ok) {
    const message = (await res.json().catch(() => null))?.message || res.statusText;
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; address?: string; role?: "admin" | "trainer" | "member" }) =>
    request<{ token: string; user: { id: string; email: string; firstName?: string; lastName?: string; fullName: string; address?: string; role: string } }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data)
      }
    ),
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: { id: string; email: string; firstName?: string; lastName?: string; fullName: string; address?: string; role: string } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  me: () => request<{ id: string; email: string; firstName?: string; lastName?: string; fullName: string; address?: string; role: string }>("/user/me")
};



