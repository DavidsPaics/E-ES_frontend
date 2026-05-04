import { createContext, useContext, useState, type ReactNode } from "react";
import {
  clearStoredCredentials,
  getStoredAuthUser,
  getStoredCredentials,
  makeBasicAuthHeader,
  storeAuthUser,
  storeCredentials,
  type AuthCredentials,
} from "./credentials";
import { getAllUsers, type PublicUserRecord } from "@/shared/cabinet/store";
import { ENDPOINT_AUTH_LOGIN } from "@/webapp/config/endpoints";

interface AuthContextType {
  credentials: AuthCredentials | null;
  currentUser: PublicUserRecord | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstString(values: unknown[], fallback = ""): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function normalizeRole(value: unknown): PublicUserRecord["role"] {
  if (value === "member") return "participant";
  if (
    value === "participant" ||
    value === "team_leader" ||
    value === "pilot" ||
    value === "reserve_pilot" ||
    value === "supervisor" ||
    value === "admin" ||
    value === "super_admin"
  ) {
    return value;
  }
  return "participant";
}

function unwrapLoginPayload(payload: unknown): unknown {
  if (!isRecord(payload)) return payload;
  return payload.user ?? payload.account ?? payload.admin ?? payload.person ?? payload.data ?? payload;
}

function normalizeLoginUser(payload: unknown, username: string): PublicUserRecord {
  const source = unwrapLoginPayload(payload);
  if (!isRecord(source)) return makeSessionUser(username);

  const teamMember = isRecord(source.dati)
    ? source.dati
    : isRecord(source.cilveks)
      ? source.cilveks
      : undefined;
  const profileSource = isRecord(source.profile) ? source.profile : teamMember ?? source;
  const normalizedUsername = firstString(
    [source.lietotajvards, source.username, source.login, source.epasts, source.email],
    username
  );
  const isAdminInfo = "superadmin" in source;

  return {
    id: firstString(
      [source.key, source.id, source.ID, source.userId, source.accountId, teamMember?.key, teamMember?.id],
      `session-${normalizedUsername}`
    ),
    username: normalizedUsername,
    role: isAdminInfo
      ? source.superadmin === true
        ? "super_admin"
        : "admin"
      : normalizeRole(profileSource.role ?? source.role ?? source.type),
    teamId: firstString([source.teamId, source.team_id, source.komandasId], "") || undefined,
    profile: {
      name: firstString([profileSource.name, profileSource.fullName, profileSource.full_name], normalizedUsername),
      dateOfBirth: firstString([profileSource.dateOfBirth, profileSource.dzimsanasDatums], "") || undefined,
      school: firstString([profileSource.school, profileSource.educationalInstitution], ""),
      grade: firstString([profileSource.grade, profileSource.classOrYear], ""),
      phone: firstString([source.telefonanumurs, source.phoneNumber, profileSource.phone, profileSource.phoneNumber], ""),
      email: firstString([source.epasts, source.email, profileSource.email], ""),
      profilePicture: firstString([profileSource.profilePicture, profileSource.avatar], ""),
      aboutMe: firstString([profileSource.aboutMe, profileSource.bio], ""),
    },
  };
}

function makeSessionUser(username: string): PublicUserRecord {
  const storedUser = getAllUsers().find(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
  if (storedUser) return storedUser;

  return {
    id: `session-${username}`,
    username,
    role: "super_admin",
    profile: {
      name: username,
      school: "",
      grade: "",
      phone: "",
      email: "",
      profilePicture: "",
      aboutMe: "",
    },
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [credentials, setCredentials] = useState<AuthCredentials | null>(() => getStoredCredentials());
  const [currentUser, setCurrentUser] = useState<PublicUserRecord | null>(() =>
    getStoredAuthUser<PublicUserRecord>()
  );

  const refreshCurrentUser = () => {
    const storedCredentials = getStoredCredentials();
    setCredentials(storedCredentials);
    setCurrentUser(getStoredAuthUser<PublicUserRecord>());
  };

  const login = async (username: string, password: string) => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      throw new Error("Username and password are required");
    }

    const nextCredentials = { username: trimmedUsername, password };
    const response = await fetch(ENDPOINT_AUTH_LOGIN, {
      method: "GET",
      headers: {
        Authorization: makeBasicAuthHeader(nextCredentials),
      },
    });

    if (!response.ok) {
      throw new Error(`Login failed with HTTP ${response.status}`);
    }

    const payload: unknown = await response.json().catch(() => ({}));
    const authenticatedUser = normalizeLoginUser(payload, trimmedUsername);

    storeCredentials(nextCredentials);
    storeAuthUser(authenticatedUser);
    setCredentials(nextCredentials);
    setCurrentUser(authenticatedUser);
  };

  const logout = () => {
    clearStoredCredentials();
    setCredentials(null);
    setCurrentUser(null);
  };

  const isAuthenticated = credentials !== null && currentUser !== null;

  return (
    <AuthContext.Provider value={{ credentials, currentUser, login, logout, isAuthenticated, refreshCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
