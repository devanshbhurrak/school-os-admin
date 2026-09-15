"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listOrganizations } from "@/services/iam";
import { platformApiClient } from "@/services/platform-api-client";
import { platformKeys } from "@/lib/query-keys";
import type { Organization, OrganizationStatus, School, CursorPage } from "@/types";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/patterns/error-state";
import { EmptyState } from "@/components/patterns/empty-state";
import { formatDate } from "@/lib/format";

const STATUS_OPTIONS: { value: OrganizationStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "TRIAL", label: "Trial" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CLOSED", label: "Closed" },
];
const SORT_OPTIONS = [
  { value: "created_desc", label: "Created ↓" },
  { value: "created_asc", label: "Created ↑" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
] as const;

function OrgRow({ org, schoolCount }: { org: Organization; schoolCount: number }) {
  const slug = org.code.toLowerCase().replace(/_/g, "-");
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50">
      <td className="py-3 pr-4 pl-4">
        <Link href={`/platform/organizations/${org.id}/overview`} className="font-medium text-sm hover:underline">
          {org.name}
        </Link>
        {org.legal_name && <p className="text-xs text-muted-foreground">{org.legal_name}</p>}
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground font-mono">{slug}</td>
      <td className="py-3 pr-4">
        <StatusBadge status={org.status} />
      </td>
      <td className="py-3 pr-4 text-sm text-muted-foreground text-center">{schoolCount}</td>
      <td className="py-3 pr-4 text-sm text-muted-foreground">{formatDate(org.created_at)}</td>
    </tr>
  );
}

export function OrgList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | "ALL">("ALL");
  const [sort, setSort] = useState<(typeof SORT_OPTIONS)[number]["value"]>("created_desc");

  const schoolsQuery = useQuery({
    queryKey: platformKeys.schools({ limit: 100 }),
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<School>>("/schools", { params: { limit: 100 } });
      return data;
    },
  });

  const schoolCountMap = useMemo(() => {
    const map = new Map<string, number>();
    (schoolsQuery.data?.items ?? []).forEach((s) => {
      map.set(s.organization_id, (map.get(s.organization_id) ?? 0) + 1);
    });
    return map;
  }, [schoolsQuery.data]);
  const isSchoolsTruncated = schoolsQuery.data?.has_more ?? false;

  const { items: allItems, hasMore, isInitialLoading, isFetchingMore, isError, error, fetchMore, refetch } =
    useCursorPagination<Organization>({
      queryKey: platformKeys.organizations({}),
      queryFn: (params) => listOrganizations(params),
      limit: 20,
    });

  const filtered = useMemo(() => {
    let items = allItems.filter((org) => {
      const q = search.toLowerCase();
      const slug = org.code.toLowerCase().replace(/_/g, "-");
      const matchesSearch = !search || org.name.toLowerCase().includes(q) || org.code.toLowerCase().includes(q) || slug.includes(q);
      const matchesStatus = statusFilter === "ALL" || org.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    items = [...items].sort((a, b) => {
      if (sort === "created_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "created_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      if (sort === "name_desc") return b.name.localeCompare(a.name);
      return 0;
    });
    return items;
  }, [allItems, search, statusFilter, sort]);

  const isFilteredEmpty = !isInitialLoading && allItems.length > 0 && filtered.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">Manage all organizations on the platform {isSchoolsTruncated && <span className="text-amber-600">(school counts may be incomplete)</span>}</p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/platform/organizations/new">
            <Plus className="size-4" />
            New Organization
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Search by name, slug, or code…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrganizationStatus | "ALL")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        {isInitialLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} title="Failed to load organizations" compact />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={isFilteredEmpty ? "No matching organizations" : "No organizations found"}
            description={isFilteredEmpty ? "Try adjusting your search or status filter." : "Organizations will appear here once created."}
            compact
          />
        ) : (
          <>
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pt-3 pr-4 pl-4 font-medium">Name</th>
                  <th className="pb-2 pt-3 pr-4 font-medium">Slug</th>
                  <th className="pb-2 pt-3 pr-4 font-medium">Status</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-center">Schools</th>
                  <th className="pb-2 pt-3 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((org) => (
                  <OrgRow key={org.id} org={org} schoolCount={schoolCountMap.get(org.id) ?? 0} />
                ))}
              </tbody>
            </table>
            <div className="sm:hidden divide-y">
              {filtered.map((org) => {
                const slug = org.code.toLowerCase().replace(/_/g, "-");
                return (
                  <Link key={org.id} href={`/platform/organizations/${org.id}/overview`} className="block p-4 hover:bg-muted/50">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{org.name}</p>
                      <StatusBadge status={org.status} />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{slug} · {schoolCountMap.get(org.id) ?? 0} schools · {formatDate(org.created_at)}</p>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={fetchMore}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? "Loading…" : "Load More"}
          </Button>
        </div>
      )}
      {hasMore && filtered.length > 0 && <p className="text-center text-xs text-muted-foreground">Search and filter apply only to loaded items. Load more to search further.</p>}
    </div>
  );
}
