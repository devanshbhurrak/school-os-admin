"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Profile", slug: "profile" },
  { label: "Memberships", slug: "memberships" },
  { label: "Audit Trail", slug: "audit" },
];

export function UserDetailLayout({ userId, children }: { userId: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user, isLoading } = useQuery({
    queryKey: platformKeys.user(userId),
    queryFn: () => getUser(userId),
  });

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/platform/dashboard" className="hover:text-foreground">Platform</Link>
        <span>›</span>
        <Link href="/platform/users" className="hover:text-foreground">Users</Link>
        {user && (
          <>
            <span>›</span>
            <span className="font-medium text-foreground truncate">{user.email ?? user.phone ?? userId.slice(0, 8)}</span>
          </>
        )}
      </nav>

      <div className="space-y-1">
        {isLoading ? (
          <>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-64" />
          </>
        ) : user ? (
          <>
            <h1 className="text-2xl font-semibold tracking-tight">{user.email ?? user.phone ?? user.id}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <StatusBadge status={user.status} />
              {user.is_platform_admin && (
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-xs text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                  Platform Admin
                </span>
              )}
              <span>·</span>
              <span className="font-mono text-xs">{user.id.slice(0, 8)}…</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">User not found.</p>
        )}
      </div>

      <nav className="flex flex-col sm:flex-row gap-1 border-b overflow-x-auto" aria-label="User tabs">
        {TABS.map((tab) => {
          const href = `/platform/users/${userId}/${tab.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors border-b-2 sm:border-b-2 border-l-2 sm:border-l-0 -mb-px sm:-mb-px whitespace-nowrap",
                active ? "border-primary text-foreground bg-muted/30 sm:bg-transparent border-l-primary sm:border-b-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20",
              )}
              aria-current={active ? "page" : undefined}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
