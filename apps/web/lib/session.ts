"use client";

export type AppRole = "USER" | "ORGANIZER" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN" | "FINANCE";

export interface StoredUser {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
  role: AppRole;
  mustChangePassword?: boolean;
}

export interface StoredWallet {
  balance: number;
  currencyCode: string;
}

export const SESSION_CHANGE_EVENT = "arena-session-change";

function notifySessionChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function subscribeSessionChange(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(SESSION_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SESSION_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("arena_token");
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("arena_user");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

export function getStoredWallet(): StoredWallet {
  if (typeof window === "undefined") {
    return {
      balance: 100,
      currencyCode: "TOKENS"
    };
  }

  const raw = window.localStorage.getItem("arena_wallet");
  if (!raw) {
    return {
      balance: 100,
      currencyCode: "TOKENS"
    };
  }

  try {
    return JSON.parse(raw) as StoredWallet;
  } catch {
    return {
      balance: 100,
      currencyCode: "TOKENS"
    };
  }
}

export function persistSession(input: { token?: string; user?: StoredUser; wallet?: StoredWallet }, options?: { notify?: boolean }) {
  if (typeof window === "undefined") {
    return;
  }

  if (input.token) {
    window.localStorage.setItem("arena_token", input.token);
  }

  if (input.user) {
    window.localStorage.setItem("arena_user", JSON.stringify(input.user));
  }

  if (input.wallet) {
    window.localStorage.setItem("arena_wallet", JSON.stringify(input.wallet));
  }

  if (options?.notify !== false) {
    notifySessionChange();
  }
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("arena_token");
  window.localStorage.removeItem("arena_user");
  window.localStorage.removeItem("arena_wallet");
  notifySessionChange();
}
