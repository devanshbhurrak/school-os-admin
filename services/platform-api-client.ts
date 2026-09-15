import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/lib/constants";
import { type AxiosError } from "axios";
import { ApiError, ErrorCode, type ErrorEnvelope } from "@/types";
import { getAccessToken, refreshAccessToken } from "./api-client";

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

const AUTH_PATHS = new Set([
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/password-reset",
  "/auth/password-reset/confirm",
  "/auth/password/change",
]);

/**
 * Platform API client — identical to apiClient but does NOT auto-inject
 * the module-level schoolId. If the caller sets X-School-ID on the request
 * config it will be preserved as-is.
 */
export const platformApiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
});

platformApiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  // Do NOT auto-inject X-School-ID — caller must set it explicitly if needed.
  // If caller already set X-School-ID it is preserved.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    config.headers.set("X-Request-ID", crypto.randomUUID());
  }
  return config;
});

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

platformApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: ErrorEnvelope }>) => {
    const config = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const path = config?.url ?? "";

    if (config && status === 401 && !AUTH_PATHS.has(path) && !config._retried) {
      config._retried = true;
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return platformApiClient.request(config);
      }
    }

    throw normalizeError(error);
  },
);
