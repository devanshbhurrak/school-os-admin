"use client";

import { usePermissions } from "@/hooks/use-permissions";

interface PermissionGateProps {
  /** Require this single permission. */
  permission?: string;
  /** Require any of these permissions. */
  anyOf?: string[];
  /** Require all of these permissions. */
  allOf?: string[];
  children: React.ReactNode;
  /** Rendered when the user lacks permission. Defaults to null. */
  fallback?: React.ReactNode;
}

/**
 * Renders children only when the current user holds the required permission.
 * Mirrors the backend's rule that platform admins bypass all checks.
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  let allowed = true;
  if (permission) allowed = allowed && hasPermission(permission);
  if (anyOf?.length) allowed = allowed && hasAnyPermission(anyOf);
  if (allOf?.length) allowed = allowed && hasAllPermissions(allOf);

  return allowed ? <>{children}</> : <>{fallback}</>;
}
