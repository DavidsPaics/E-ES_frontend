import { getBasicAuthHeader } from "@/webapp/authentification/credentials";

/**
 * Lightweight fetch helper that attaches the current Basic Auth credentials.
 * The credentials are session-scoped and the backend validates them per request.
 */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});
  const basicAuth = getBasicAuthHeader();

  if (basicAuth && !headers.has("Authorization")) {
    headers.set("Authorization", basicAuth);
  }

  return fetch(input, { ...init, headers });
}
