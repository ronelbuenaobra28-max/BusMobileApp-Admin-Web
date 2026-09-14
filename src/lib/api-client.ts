import { supabase } from "@/lib/supabase";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

export async function apiFetch<T>(
  path: string,
  options: { method?: HttpMethod; body?: unknown } = {},
): Promise<T> {
  const token = await getAccessToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const isError = !response.ok;
  const payload = await response.json().catch(() => ({}));

  if (isError) {
    const message =
      (payload as { detail?: string; message?: string }).detail ??
      (payload as { message?: string }).message ??
      response.statusText;
    const error = new Error(message) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "POST", body }),
  put: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PUT", body }),
  del: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};
