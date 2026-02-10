/**
 * Lightweight fetch helper that attaches the stored token (if present).
 * Keeps existing headers intact and lets callers override them.
 */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(init.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(input, { ...init, headers });
}
