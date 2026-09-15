"use client";

import { useAuthContext } from "@/providers/auth-provider";
import type { MeResponse } from "@/types";

export function useAuth() {
  return useAuthContext();
}

export function useCurrentUser(): MeResponse | null {
  return useAuthContext().user;
}
