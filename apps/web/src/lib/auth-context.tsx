"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LoginInput, RegisterInput, UserDTO, UserRole } from "@risoagenda/shared";
import { ApiError, authApi } from "./api";

const TOKEN_KEY = "risoagenda_token";

interface AuthContextValue {
  user: UserDTO | null;
  token: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (input: LoginInput) => Promise<UserDTO>;
  register: (input: RegisterInput) => Promise<UserDTO>;
  loginWithGoogle: (idToken: string, role?: UserRole) => Promise<UserDTO>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setStatus("unauthenticated");
      return;
    }
    authApi
      .me(stored)
      .then((u) => {
        setUser(u);
        setToken(stored);
        setStatus("authenticated");
      })
      .catch(() => {
        window.localStorage.removeItem(TOKEN_KEY);
        setStatus("unauthenticated");
      });
  }, []);

  const applyAuth = useCallback((newToken: string, newUser: UserDTO) => {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
    setStatus("authenticated");
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const res = await authApi.login(input);
      applyAuth(res.token, res.user);
      return res.user;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await authApi.register(input);
      applyAuth(res.token, res.user);
      return res.user;
    },
    [applyAuth]
  );

  const loginWithGoogle = useCallback(
    async (idToken: string, role?: UserRole) => {
      const res = await authApi.google({ idToken, role });
      applyAuth(res.token, res.user);
      return res.user;
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const value = useMemo(
    () => ({ user, token, status, login, register, loginWithGoogle, logout }),
    [user, token, status, login, register, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa ser usado dentro de <AuthProvider>");
  return ctx;
}

export { ApiError };
