"use client";

import { useState, useEffect } from "react";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { platformApiClient } from "@/services/platform-api-client";
import type { Person, CursorPage } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/patterns/error-state";
import { EmptyState } from "@/components/patterns/empty-state";
import Link from "next/link";

export function SchoolPeopleTab({ schoolId }: { schoolId: string }) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const { items, hasMore, isInitialLoading, isFetchingMore, isError, error, fetchMore, refetch } =
    useCursorPagination<Person>({
      queryKey: ["platform", "schools", schoolId, "persons", { search: debouncedSearch }] as const,
      queryFn: async ({ limit, cursor }) => {
        const { data } = await platformApiClient.get<CursorPage<Person>>("/persons", {
          headers: { "X-School-ID": schoolId },
          params: { search: debouncedSearch || undefined, limit, cursor },
        });
        return data;
      },
      enabled: !!schoolId,
      limit: 25,
    });

  return (
    <div className="space-y-3">
      <div className="rounded-md border bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
        ⓘ Read-only view. School admins manage person records.
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input
          placeholder="Search persons…"
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        {isInitialLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : isError ? (
          <ErrorState error={error} compact title="Failed to load persons" onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          <EmptyState title="No persons found" description={debouncedSearch ? `No results for "${debouncedSearch}"` : "No persons have been added to this school yet."} compact />
        ) : (
          <>
            <table className="hidden w-full text-sm sm:table">
              <thead className="border-b bg-muted/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="py-2.5 pl-4 text-left font-medium">Name</th>
                  <th className="py-2.5 px-2 text-left font-medium">Gender</th>
                  <th className="py-2.5 px-2 text-left font-medium">DOB</th>
                  <th className="py-2.5 pr-4 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const displayName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ") || "—";
                  const schoolPortalUrl = process.env.NEXT_PUBLIC_SCHOOL_PORTAL_URL ?? "";
                  const href = schoolPortalUrl ? `${schoolPortalUrl.replace(/\/$/, "")}/people/${p.id}?schoolId=${schoolId}` : `/people/${p.id}?schoolId=${schoolId}`;
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2.5 pl-4">
                        <Link href={href} target={schoolPortalUrl ? "_blank" : undefined} className="font-medium hover:underline inline-flex items-center gap-1">
                          {displayName}
                          <ExternalLink className="size-3 text-muted-foreground" />
                        </Link>
                        {p.preferred_name && <span className="ml-1 text-xs text-muted-foreground">({p.preferred_name})</span>}
                      </td>
                      <td className="py-2.5 px-2 text-xs text-muted-foreground">{p.gender ?? "—"}</td>
                      <td className="py-2.5 px-2 text-xs text-muted-foreground">{p.date_of_birth ? formatDate(p.date_of_birth) : "—"}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={p.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="divide-y sm:hidden">
              {items.map((p) => {
                const displayName = [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ") || "—";
                const schoolPortalUrl = process.env.NEXT_PUBLIC_SCHOOL_PORTAL_URL ?? "";
                const href = schoolPortalUrl ? `${schoolPortalUrl.replace(/\/$/, "")}/people/${p.id}?schoolId=${schoolId}` : `/people/${p.id}?schoolId=${schoolId}`;
                return (
                  <Link key={p.id} href={href} target={schoolPortalUrl ? "_blank" : undefined} className="block p-4 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{displayName}</p>
                      <StatusBadge status={p.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{p.gender ?? "—"} · {p.date_of_birth ? formatDate(p.date_of_birth) : "No DOB"}</p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={fetchMore} disabled={isFetchingMore}>
            {isFetchingMore ? "Loading…" : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
