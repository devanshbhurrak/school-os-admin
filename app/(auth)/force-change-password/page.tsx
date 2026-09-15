"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { PasswordChangeForm } from "@/features/auth/password-change-form";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Force password change screen. Blocks all other navigation while
 * `must_change_password` is true (enforced here and in the app shell).
 */
export default function ForceChangePasswordRoute() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!user.must_change_password) {
      router.replace("/home");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !user.must_change_password) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <PasswordChangeForm
      mode="force-change"
      onSuccess={() => {
        void logout();
      }}
    />
  );
}