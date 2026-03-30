import { ensureCabinetSeeded, findUserByCredentials, getPrivateUserById, type UserRole } from "@/shared/cabinet/store";

export interface AuthTokenPayload {
  userId: string;
  username: string;
  role: UserRole;
  exp: number;
}

export function fakeLogin(username: string, password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    ensureCabinetSeeded();
    const user = findUserByCredentials(username, password);
    if (!user) {
      reject("Invalid credentials");
      return;
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 60 * 60 * 1000,
    };
    resolve(btoa(JSON.stringify(payload)));
  });
}

export function decodeToken(token: string): AuthTokenPayload | null {
  try {
    const payload = JSON.parse(atob(token)) as AuthTokenPayload;
    if (!payload?.userId || !payload?.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function fakeVerify(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return false;
  if (payload.exp <= Date.now()) return false;
  return getPrivateUserById(payload.userId) !== null;
}
