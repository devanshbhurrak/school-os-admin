"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getOrganization } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", slug: "overview" },
  { label: "Schools", slug: "schools" },
  { label: "Users", slug: "users" },
  { label: "Memberships", slug: "memberships" },
  { label: "Audit", slug: "audit" },
  { label: "Settings", slug: "settings" },
];

interface OrgDetailLayoutProps {
  orgId: string;
  children: React.ReactNode;
}

export function OrgDetailLayout({ orgId, children }: OrgDetailLayoutProps) {
  const pathname = usePathname();

  const { data: org, isLoading } = useQuery({
    queryKey: platformKeys.organization(orgId),
    queryFn: () => getOrganization(orgId),
  });

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/platform/dashboard" className="hover:text-foreground">Platform</Link>
        <span aria-hidden>›</span>
        <Link href="/platform/organizations" className="hover:text-foreground">Organizations</Link>
        {org && (
          <>
            <span aria-hidden>›</span>
            <span className="font-medium text-foreground truncate">{org.name}</span>
          </>
        )}
      </nav>

      <div className="space-y-1">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </>
        ) : org ? (
          <>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
              <Link href={`/platform/organizations/${org.id}/settings`} className="text-xs text-primary hover:underline border rounded px-2 py-1">Edit</Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{org.code}</span>
              <span>·</span>
              <StatusBadge status={org.status} />
              <span>·</span>
              <span>{org.plan_code}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Organization not found.</p>
        )}
      </div>

      <nav className="flex flex-col sm:flex-row gap-1 border-b overflow-x-auto" aria-label="Organization tabs">
        {TABS.map((tab) => {
          const href = `/platform/organizations/${orgId}/${tab.slug}`;
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={tab.slug}
              href={href}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors border-b-2 sm:border-b-2 border-l-2 sm:border-l-0 -mb-px sm:-mb-px ml-0 sm:ml-0 pl-3 sm:px-3 whitespace-nowrap",
                active
                  ? "border-primary text-foreground bg-muted/30 sm:bg-transparent border-l-primary sm:border-b-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20",
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
