"use client";

import { getToken } from "@clerk/nextjs";
// ─────────────────────────────────────────────
// API BASE
// ─────────────────────────────────────────────
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
// ─────────────────────────────────────────────
// Workspace selection (synced with Clerk-backed agency from the API)
// ─────────────────────────────────────────────
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

export function clearCompanyId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("company-changed"));
}

// ─────────────────────────────────────────────
// API FETCH (CLERK AUTH ENABLED)
// ─────────────────────────────────────────────
export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    // 🔥 Get Clerk token safely
    const token = await getToken();

    const res = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return res;
  } catch (err) {
    console.error("API Fetch Error:", err);
    throw err;
  }
};