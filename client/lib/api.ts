/**
 * API base URL helper.
 *
 * All backend calls in the client go through this so the app can talk to a
 * remote server instead of only same-origin `/api/...`.
 *
 * Resolution order:
 *  1. Runtime override saved in the app (Settings -> Backend URL), stored in
 *     localStorage as `droid.apiBaseUrl`. This is what the installed APK
 *     uses — the phone types (or scans) the server address once.
 *  2. Build-time `VITE_API_BASE_URL` (baked in via `.env`).
 *  3. Same-origin `/api/...` (web dev / served by the node server itself).
 */
const STORAGE_KEY = "droid.apiBaseUrl";

export function getRuntimeApiBase(): string {
  try {
    return (
      (typeof localStorage !== "undefined" &&
        localStorage.getItem(STORAGE_KEY)) ||
      ""
    ).trim();
  } catch {
    return "";
  }
}

export function setRuntimeApiBase(url: string): void {
  try {
    const clean = url.trim().replace(/\/+$/, "");
    if (clean) localStorage.setItem(STORAGE_KEY, clean);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}

export function clearRuntimeApiBase(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getEffectiveApiBase(): string {
  const runtime = getRuntimeApiBase();
  if (runtime) return runtime.replace(/\/+$/, "");
  const raw = (import.meta as any)?.env?.VITE_API_BASE_URL as
    | string
    | undefined;
  return (raw || "").trim().replace(/\/+$/, "");
}

export function apiUrl(path: string): string {
  const base = getEffectiveApiBase();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalized}` : normalized;
}

/**
 * JSON request through apiUrl(): resolves the parsed response body and
 * throws an Error carrying the server's own error text (or the HTTP
 * status) when the request fails, so callers can show `e.message`.
 * A 200 response is returned as-is, including `{ success: false }`
 * payloads some endpoints use as data — callers handle those.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(apiUrl(path), { ...init, headers });
  const data = (await res.json().catch(() => null)) as {
    error?: string;
    message?: string;
  } | null;
  if (!res.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        `Request failed: ${res.status} ${res.statusText} (${path})`,
    );
  }
  return data as T;
}
