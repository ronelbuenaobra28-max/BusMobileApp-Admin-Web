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
      formatErrorDetail((payload as { detail?: unknown }).detail) ??
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

// FastAPI sends `detail` as a string for HTTPException, as an array of
// {loc, msg} objects for 422 validation errors, and as an object for some
// structured errors. Always produce readable text instead of "[object Object]".
export function formatErrorDetail(detail: unknown): string | undefined {
  if (detail == null) return undefined;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((item) => {
      if (item && typeof item === "object" && "msg" in item) {
        const { loc, msg } = item as { loc?: unknown[]; msg: unknown };
        const field = Array.isArray(loc) ? loc.filter((p) => p !== "body").join(".") : "";
        return field ? `${field}: ${String(msg)}` : String(msg);
      }
      return String(item);
    });
    return parts.join("; ") || undefined;
  }
  if (typeof detail === "object") {
    const nested = (detail as { error?: { message?: unknown }; message?: unknown });
    const msg = nested.error?.message ?? nested.message;
    if (typeof msg === "string") return msg;
    return JSON.stringify(detail);
  }
  return String(detail);
}
