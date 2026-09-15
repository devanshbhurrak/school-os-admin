"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

/**
 * Platform guard hook — reads MeResponse and redirects if is_platform_admin !== true.
 * Never relies on client-side role names, only is_platform_admin boolean.
 * Spec: platform/layout.tsx runs: check auth → check is_platform_admin → redirect to /login or /home
 */
export function usePlatformGuard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (!user?.is_platform_admin) {
      router.replace("/home");
      return;
    }
    if (user?.must_change_password) {
      router.replace("/force-change-password");
    }
  }, [isLoading, isAuthenticated, user, router]);

  return {
    isPlatformAdmin: !!user?.is_platform_admin,
    isLoading,
    isAuthenticated,
    user,
  };
}
