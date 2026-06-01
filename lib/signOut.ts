"use client";

import { clearCompanyId } from "@/lib/api";
import { disconnectSocket } from "@/lib/socket";

/** Keys we keep across sign-out (UI prefs only). */
const PRESERVE_LOCAL_KEYS = new Set(["sidebar-collapsed"]);

export function clearAppLocalStorage() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || PRESERVE_LOCAL_KEYS.has(key)) continue;
    if (key.startsWith("creonox_")) keys.push(key);
  }
  for (const key of keys) localStorage.removeItem(key);
}

export function notifyWorkspaceCleared() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("workspace-cleared"));
}

/**
 * End Clerk session and clear workspace data so another user can sign in on localhost.
 */
export async function performAppSignOut(
  signOut: (options?: { redirectUrl?: string }) => Promise<void>
) {
  disconnectSocket();
  clearAppLocalStorage();
  clearCompanyId();
  notifyWorkspaceCleared();

  const redirectUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sign-in`
      : "/sign-in";

  try {
    await signOut({ redirectUrl });
  } catch (err) {
    console.error("Clerk signOut failed:", err);
    if (typeof window !== "undefined") {
      window.location.assign("/sign-in");
    }
  }
}
