import type { ID, ISODateTime } from "./api";

export interface UserBrief {
  id: ID;
  email: string | null;
  phone: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserBrief;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface MeResponse {
  user_id: ID;
  person_id: ID | null;
  email: string | null;
  phone: string | null;
  is_platform_admin: boolean;
  organization_id: ID | null;
  school_id: ID | null;
  role_codes: string[];
  permissions: string[];
  must_change_password: boolean;
}

export interface PasswordResetRequest {
  identifier: string;
}

export interface PasswordResetConfirm {
  token: string;
  new_password: string;
}

export interface PasswordChange {
  current_password: string;
  new_password: string;
}

export interface ResetAccepted {
  message: string;
  request_id: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export type { ISODateTime };
