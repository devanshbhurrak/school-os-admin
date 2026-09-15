"use client";

import { useCallback, useMemo } from "react";
import { useAuth } from "./use-auth";

/**
 * Permission helpers driven by the permission codes resolved from /auth/me.
 * Platform admins bypass all permission checks (mirrors the backend).
 */
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = useCallback(
    (code: string): boolean => {
      if (user?.is_platform_admin) return true;
      return !!user?.permissions?.includes(code);
    },
    [user],
  );

  const hasAnyPermission = useCallback(
    (codes: string[]): boolean => codes.some(hasPermission),
    [hasPermission],
  );

  const hasAllPermissions = useCallback(
    (codes: string[]): boolean => codes.every(hasPermission),
    [hasPermission],
  );

  return useMemo(
    () => ({
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      permissions: user?.permissions ?? [],
      isPlatformAdmin: !!user?.is_platform_admin,
    }),
    [hasPermission, hasAnyPermission, hasAllPermissions, user],
  );
}
