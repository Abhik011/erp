export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const STORAGE_KEY = "creonox_company_id";

export function getCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setCompanyId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new Event("company-changed"));
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE}${p}`;
  const headers = new Headers(init?.headers);
  const id = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  if (id) headers.set("X-Company-Id", id);
  return fetch(url, { ...init, headers });
}
