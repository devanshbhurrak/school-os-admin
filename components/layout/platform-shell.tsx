"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { setSchoolId } from "@/services/api-client";
import { PlatformSidebar } from "./platform-sidebar";
import { PlatformHeader } from "./platform-header";
import { Skeleton } from "@/components/ui/skeleton";

function ShellSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-60 bg-slate-900 lg:block">
        <div className="flex h-14 items-center gap-2 border-b border-slate-800 px-3">
          <Skeleton className="size-8 rounded-lg bg-slate-700" />
          <Skeleton className="h-4 w-24 bg-slate-700" />
        </div>
        <div className="space-y-3 p-3">
          <Skeleton className="h-4 w-16 bg-slate-700" />
          <Skeleton className="h-8 w-full bg-slate-700" />
          <Skeleton className="h-8 w-full bg-slate-700" />
          <Skeleton className="h-8 w-full bg-slate-700" />
          <Skeleton className="mt-4 h-4 w-24 bg-slate-700" />
          <Skeleton className="h-8 w-full bg-slate-700" />
          <Skeleton className="h-8 w-full bg-slate-700" />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-40" />
        </div>
        <main className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
          <div className="grid gap-4 pt-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </main>
      </div>
    </div>
  );
}

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Platform portal must never leak a stale X-School-ID header from the school portal context.
  useEffect(() => {
    setSchoolId(null);
  }, []);

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

  if (
    isLoading ||
    !isAuthenticated ||
    !user?.is_platform_admin ||
    user?.must_change_password
  ) {
    return <ShellSkeleton />;
  }

  return (
    <div className="flex min-h-dvh">
      <PlatformSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <PlatformHeader />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
