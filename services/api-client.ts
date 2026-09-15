import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, STORAGE_KEYS } from "@/lib/constants";
import { ApiError, ErrorCode, type ErrorEnvelope, type RefreshResponse } from "@/types";

const REFRESH_TOKEN_KEY = STORAGE_KEYS.refreshToken;

/** Access token lives in memory only (XSS-safe). */
let accessToken: string | null = null;
/** Refresh token in memory, persisted to localStorage as a reload fallback. */
let refreshToken: string | null = null;
let schoolId: string | null = null;

let onUnauthorized: (() => void) | null = null;
let refreshPromise: Promise<boolean> | null = null;

function persistRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
  persistRefreshToken(token);
}

export function getRefreshToken(): string | null {
  return refreshToken;
}

export function loadPersistedRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setSchoolId(id: string | null) {
  schoolId = id;
}

export function getSchoolId(): string | null {
  return schoolId;
}

/** Register a handler invoked when the session can no longer be refreshed (e.g. redirect to login). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function clearTokens() {
  accessToken = null;
  refreshToken = null;
  persistRefreshToken(null);
}

const AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/password-reset",
  "/auth/password-reset/confirm",
  "/auth/password/change",
]);

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

/** Bare client for token refresh — bypasses interceptors to avoid recursion. */
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (schoolId) {
    config.headers.set("X-School-ID", schoolId);
  }
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    config.headers.set("X-Request-ID", crypto.randomUUID());
  }
  return config;
});

async function performRefresh(): Promise<boolean> {
  const token = refreshToken;
  if (!token) return false;
  try {
    const { data } = await refreshClient.post<RefreshResponse>("/auth/refresh", {
      refresh_token: token,
    });
    accessToken = data.access_token;
    refreshToken = data.refresh_token;
    persistRefreshToken(data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

/** Single-flight token refresh shared by all concurrent 401s. */
export function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh()
      .then((ok) => {
        if (!ok) {
          clearTokens();
          onUnauthorized?.();
        }
        return ok;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

function normalizeError(error: AxiosError<{ error?: ErrorEnvelope }>): ApiError {
  const status = error.response?.status ?? 0;
  const envelope = error.response?.data?.error;
  if (envelope) {
    return new ApiError(status, envelope);
  }
  if (error.request && !error.response) {
    return new ApiError(0, {
      code: ErrorCode.NetworkError,
      message: "Unable to reach the server. Check your connection and try again.",
      details: {},
    });
  }
  return new ApiError(status || 500, {
    code: ErrorCode.InternalError,
    message: "Something went wrong. Please try again.",
    details: {},
  });
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: ErrorEnvelope }>) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const path = config?.url ?? "";

    if (config && status === 401 && !AUTH_PATHS.has(path) && !config._retried) {
      config._retried = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiClient.request(config);
      }
    }

    throw normalizeError(error);
  },
);

/** Convert any thrown value into a typed ApiError. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof axios.AxiosError) {
    return normalizeError(error as AxiosError<{ error?: ErrorEnvelope }>);
  }
  return new ApiError(0, {
    code: ErrorCode.InternalError,
    message: "Something went wrong. Please try again.",
    details: {},
  });
}

/** Clear all session state (used on logout / auth failure). */
export function resetApiClientState() {
  clearTokens();
  schoolId = null;
  onUnauthorized = null;
}
