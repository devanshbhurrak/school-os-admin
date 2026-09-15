import { apiClient } from "./api-client";
import type {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  MeResponse,
  PasswordChange,
  PasswordResetConfirm,
  PasswordResetRequest,
  ResetAccepted,
} from "@/types";

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const { data: response } = await apiClient.post<LoginResponse>("/auth/login", data);
  return response;
}

export async function getMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
}

export async function logout(data: LogoutRequest): Promise<void> {
  await apiClient.post("/auth/logout", data);
}

export async function requestPasswordReset(
  data: PasswordResetRequest,
): Promise<ResetAccepted> {
  const { data: response } = await apiClient.post<ResetAccepted>(
    "/auth/password-reset",
    data,
  );
  return response;
}

export async function confirmPasswordReset(data: PasswordResetConfirm): Promise<void> {
  await apiClient.post("/auth/password-reset/confirm", data);
}

export async function changePassword(data: PasswordChange): Promise<void> {
  await apiClient.post("/auth/password/change", data);
}
