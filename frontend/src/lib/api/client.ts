import Cookies from "js-cookie";

// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

const API_URL =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL || "http://backend:8000/api"
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";



const ACCESS_COOKIE = "sophisticat_access";
const REFRESH_COOKIE = "sophisticat_refresh";

export function getAccessToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return Cookies.get(ACCESS_COOKIE);
}

export function getRefreshToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  return Cookies.get(REFRESH_COOKIE);
}

export function setTokens(access: string, refresh: string) {
  if (typeof document === "undefined") return;
  // 7-day expiry mirrors the backend's SIMPLE_JWT REFRESH_TOKEN_LIFETIME
  Cookies.set(ACCESS_COOKIE, access, { expires: 1, sameSite: "lax" });
  Cookies.set(REFRESH_COOKIE, refresh, { expires: 7, sameSite: "lax" });
}

export function clearTokens() {
  if (typeof document === "undefined") return;
  Cookies.remove(ACCESS_COOKIE);
  Cookies.remove(REFRESH_COOKIE);
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    const message =
      (typeof data === "object" && data && "detail" in data && String((data as { detail: unknown }).detail)) ||
      `Request failed with status ${status}`;
    super(message);
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean; // attach Authorization header (default: true)
  skipRefresh?: boolean; // internal flag to prevent infinite refresh loops
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    clearTokens();
    return null;
  }

  const data = await res.json();
  if (typeof document !== "undefined") {
    Cookies.set(ACCESS_COOKIE, data.access, { expires: 1, sameSite: "lax" });
  }
  return data.access;
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, skipRefresh = false, headers, ...rest } = options;

  const finalHeaders: Record<string, string> = {
    Accept: "application/json",
    ...(headers as Record<string, string>),
  };

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Access token expired — try one silent refresh, then retry the request once.
  if (res.status === 401 && auth && !skipRefresh) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiFetch<T>(path, { ...options, skipRefresh: true });
    }
  }

  if (!res.ok) {
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // no JSON body
    }
    throw new ApiError(res.status, data);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export { API_URL };
