import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { decodeToken, fakeLogin, fakeVerify } from "./fakeAuth";
import { getUserById, type PublicUserRecord } from "@/shared/cabinet/store";

interface AuthContextType {
  token: string | null;
  currentUser: PublicUserRecord | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [currentUser, setCurrentUser] = useState<PublicUserRecord | null>(null);

  const refreshCurrentUser = () => {
    if (!token) {
      setCurrentUser(null);
      return;
    }

    const payload = decodeToken(token);
    if (!payload) {
      setCurrentUser(null);
      return;
    }

    const user = getUserById(payload.userId);
    setCurrentUser(user);
  };

  const login = async (username: string, password: string) => {
    const fakeToken = await fakeLogin(username, password);
    localStorage.setItem("token", fakeToken);
    setToken(fakeToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setCurrentUser(null);
  };

  useEffect(() => {
    refreshCurrentUser();
  }, [token]);

  const isAuthenticated = token !== null && fakeVerify(token);

  return (
    <AuthContext.Provider value={{ token, currentUser, login, logout, isAuthenticated, refreshCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
