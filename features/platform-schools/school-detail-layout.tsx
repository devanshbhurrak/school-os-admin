"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getSchool, getOrganization } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", slug: "overview" },
  { label: "Academics", slug: "academics" },
  { label: "People", slug: "people" },
  { label: "Users & Roles", slug: "users" },
  { label: "Data Quality", slug: "data-quality" },
  { label: "Audit", slug: "audit" },
  { label: "Settings", slug: "settings" },
];

interface SchoolDetailLayoutProps {
  schoolId: string;
  children: React.ReactNode;
}

export function SchoolDetailLayout({ schoolId, children }: SchoolDetailLayoutProps) {
  const pathname = usePathname();

  const { data: school, isLoading } = useQuery({
    queryKey: platformKeys.school(schoolId),
    queryFn: () => getSchool(schoolId),
  });

  const { data: org } = useQuery({
    queryKey: platformKeys.organization(school?.organization_id ?? ""),
    queryFn: () => getOrganization(school!.organization_id),
    enabled: !!school?.organization_id,
  });

  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/platform/dashboard" className="hover:text-foreground">Platform</Link>
        <span>›</span>
        <Link href="/platform/organizations" className="hover:text-foreground">Organizations</Link>
        {org && (
          <>
            <span>›</span>
            <Link href={`/platform/organizations/${org.id}/overview`} className="hover:text-foreground truncate max-w-[120px]">{org.name}</Link>
            <span>›</span>
            <Link href={`/platform/organizations/${org.id}/schools`} className="hover:text-foreground">Schools</Link>
          </>
        )}
        {!org && (
          <>
            <span>›</span>
            <Link href="/platform/schools" className="hover:text-foreground">Schools</Link>
          </>
        )}
        {school && (
          <>
            <span>›</span>
            <span className="font-medium text-foreground truncate">{school.name}</span>
          </>
        )}
      </nav>
      <p className="rounded-md border bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
        ⓘ Platform view — school data is read-only except status and profile
      </p>

      <div className="space-y-1">
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </>
        ) : school ? (
          <>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{school.name}</h1>
              <Link href={`/platform/schools/${school.id}/settings`} className="text-xs text-primary hover:underline border rounded px-2 py-1">Edit</Link>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{school.code}</span>
              <span>·</span>
              <StatusBadge status={school.status} />
              {school.board && (
                <>
                  <span>·</span>
                  <span>{school.board}</span>
                </>
              )}
              <span>·</span>
              <Link href={`/platform/organizations/${school.organization_id}/overview`} className="hover:underline text-primary">
                {org?.name ?? `${school.organization_id.slice(0, 8)}…`}
              </Link>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">School not found.</p>
        )}
      </div>

      <nav className="flex flex-col sm:flex-row gap-1 border-b overflow-x-auto" aria-label="School tabs">
        {TABS.map((tab) => {
          const href = `/platform/schools/${schoolId}/${tab.slug}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
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
