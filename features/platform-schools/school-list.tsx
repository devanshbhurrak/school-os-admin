"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listSchools, listOrganizations } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import type { School, SchoolStatus } from "@/types";
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

const STATUS_OPTIONS: { value: SchoolStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "SETUP", label: "Setup" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CLOSED", label: "Closed" },
];

function SchoolRow({ school, orgName }: { school: School; orgName: string }) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50">
      <td className="py-3 pr-4 pl-4">
        <Link href={`/platform/schools/${school.id}/overview`} className="font-medium text-sm hover:underline">
          {school.name}
        </Link>
        {school.short_name && <p className="text-xs text-muted-foreground">{school.short_name}</p>}
      </td>
      <td className="py-3 pr-4 text-xs">
        <Link href={`/platform/organizations/${school.organization_id}/overview`} className="hover:underline text-muted-foreground">
          {orgName}
        </Link>
      </td>
      <td className="py-3 pr-4 text-xs text-muted-foreground">{school.board ?? "—"}</td>
      <td className="py-3 pr-4">
        <StatusBadge status={school.status} />
      </td>
      <td className="py-3 text-sm text-muted-foreground">{formatDate(school.created_at)}</td>
    </tr>
  );
}

export function SchoolList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SchoolStatus | "ALL">("ALL");
  const [orgFilter, setOrgFilter] = useState<string>("ALL");
  const [boardFilter, setBoardFilter] = useState<string>("ALL");

  const orgsQuery = useQuery({
    queryKey: platformKeys.organizations({ limit: 100 }),
    queryFn: () => listOrganizations({ limit: 100 }),
  });

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    (orgsQuery.data?.items ?? []).forEach((o) => m.set(o.id, o.name));
    return m;
  }, [orgsQuery.data]);

  const { items: allItems, hasMore, isInitialLoading, isFetchingMore, isError, error, fetchMore, refetch } =
    useCursorPagination<School>({
      queryKey: platformKeys.schools({}),
      queryFn: (params) => listSchools(params as never),
      limit: 20,
    });

  const boardOptions = useMemo(() => {
    const boards = [...new Set(allItems.map((s) => s.board).filter(Boolean) as string[])];
    return boards.sort();
  }, [allItems]);

  const filtered = useMemo(() => {
    return allItems.filter((school) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        school.name.toLowerCase().includes(q) ||
        school.short_name?.toLowerCase().includes(q) ||
        school.code.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || school.status === statusFilter;
      const matchesOrg = orgFilter === "ALL" || school.organization_id === orgFilter;
      const matchesBoard = boardFilter === "ALL" || school.board === boardFilter;
      return matchesSearch && matchesStatus && matchesOrg && matchesBoard;
    });
  }, [allItems, search, statusFilter, orgFilter, boardFilter]);

  const isFilteredEmpty = !isInitialLoading && allItems.length > 0 && filtered.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schools</h1>
        <p className="text-sm text-muted-foreground">All schools across the platform</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Search by name, short name, or code…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Organization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Organizations</SelectItem>
            {(orgsQuery.data?.items ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as SchoolStatus | "ALL")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={boardFilter} onValueChange={setBoardFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Board" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Boards</SelectItem>
            {boardOptions.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
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
          <ErrorState error={error} onRetry={() => void refetch()} title="Failed to load schools" compact />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={isFilteredEmpty ? "No matching schools" : "No schools found"}
            description={isFilteredEmpty ? "Try adjusting your filters." : "Schools will appear here once created."}
            compact
          />
        ) : (
          <>
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pt-3 pr-4 px-4 font-medium">Name</th>
                  <th className="pb-2 pt-3 pr-4 font-medium">Organization</th>
                  <th className="pb-2 pt-3 pr-4 font-medium">Board</th>
                  <th className="pb-2 pt-3 pr-4 font-medium">Status</th>
                  <th className="pb-2 pt-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((school) => (
                  <SchoolRow key={school.id} school={school} orgName={orgMap.get(school.organization_id) ?? school.organization_id.slice(0, 8)} />
                ))}
              </tbody>
            </table>
            <div className="sm:hidden divide-y">
              {filtered.map((school) => (
                <Link key={school.id} href={`/platform/schools/${school.id}/overview`} className="block p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{school.name}</p>
                    <StatusBadge status={school.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{orgMap.get(school.organization_id) ?? school.organization_id.slice(0, 8)} · {school.board ?? "—"} · {school.code}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(school.created_at)}</p>
                </Link>
              ))}
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
      {hasMore && filtered.length > 0 && <p className="text-center text-xs text-muted-foreground">Filters apply to loaded items only. Load more to search further.</p>}
    </div>
  );
}
