export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function getAuthHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }

  const token = window.localStorage.getItem("arena_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
