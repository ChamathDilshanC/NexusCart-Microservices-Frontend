const TOKEN_KEY = "nexus_token";
const USER_KEY = "nexus_user";

export type AdminPermission = "products" | "orders" | "banners" | "promotions" | "settings";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "Customer" | "Admin";
  permissions?: AdminPermission[];
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(user: SessionUser, token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Calls the Next.js `/api/*` proxy, which forwards to the real backend
 * (see src/app/api/[...path]/route.ts). `path` should start with a slash,
 * e.g. apiFetch("/auth/login", { method: "POST", body: {...} }).
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {}
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = (data && (data.message || data.error)) || "Something went wrong";
    throw new ApiError(message, res.status);
  }

  return data as T;
}
