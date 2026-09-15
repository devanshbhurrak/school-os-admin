"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  getRefreshToken,
  loadPersistedRefreshToken,
  refreshAccessToken,
  resetApiClientState,
  setAccessToken,
  setRefreshToken,
  setUnauthorizedHandler,
} from "@/services/api-client";
import * as authService from "@/services/auth";
import type { MeResponse } from "@/types";

interface AuthContextValue {
  user: MeResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<MeResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();
  const bootstrapped = useRef(false);

  const handleSessionExpired = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    queryClient.clear();
    router.replace("/login");
  }, [queryClient, router]);

  useEffect(() => {
    setUnauthorizedHandler(handleSessionExpired);
    return () => setUnauthorizedHandler(null);
  }, [handleSessionExpired]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    async function bootstrap() {
      const persisted = loadPersistedRefreshToken();
      if (!persisted) {
        setIsLoading(false);
        return;
      }
      setRefreshToken(persisted);
      const ok = await refreshAccessToken();
      if (ok) {
        try {
          const me = await authService.getMe();
          setUser(me);
        } catch {
          // token is valid but identity fetch failed; leave unauthenticated
        }
      }
      setIsLoading(false);
    }

    void bootstrap();
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const response = await authService.login({ identifier, password });
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      const me = await authService.getMe();
      setUser(me);
      return me;
    },
    [],
  );

  const logout = useCallback(async () => {
    const token = getRefreshToken();
    if (token) {
      void authService.logout({ refresh_token: token }).catch(() => undefined);
    }
    resetApiClientState();
    queryClient.clear();
    setUser(null);
    router.replace("/login");
  }, [queryClient, router]);

  const refreshUser = useCallback(async () => {
    const me = await authService.getMe();
    setUser(me);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
