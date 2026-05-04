const AUTH_SESSION_KEY = "ees_basic_auth_credentials";
const AUTH_USER_SESSION_KEY = "ees_authenticated_user";

export interface AuthCredentials {
  username: string;
  password: string;
}

function isAuthCredentials(value: unknown): value is AuthCredentials {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<AuthCredentials>;
  return typeof candidate.username === "string" && typeof candidate.password === "string";
}

export function getStoredCredentials(): AuthCredentials | null {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isAuthCredentials(parsed)) return null;
    if (!parsed.username.trim() || !parsed.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function storeCredentials(credentials: AuthCredentials): void {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(credentials));
}

export function clearStoredCredentials(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
  sessionStorage.removeItem(AUTH_USER_SESSION_KEY);
}

export function makeBasicAuthHeader(credentials: AuthCredentials): string {
  const source = `${credentials.username}:${credentials.password}`;
  const bytes = new TextEncoder().encode(source);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return `Basic ${btoa(binary)}`;
}

export function getBasicAuthHeader(): string | null {
  const credentials = getStoredCredentials();
  return credentials ? makeBasicAuthHeader(credentials) : null;
}

export function getStoredAuthUser<T>(): T | null {
  try {
    const raw = sessionStorage.getItem(AUTH_USER_SESSION_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function storeAuthUser(user: unknown): void {
  sessionStorage.setItem(AUTH_USER_SESSION_KEY, JSON.stringify(user));
}
