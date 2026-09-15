"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listRoles, listOrganizations } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/patterns/error-state";
import { EmptyState } from "@/components/patterns/empty-state";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Role, RoleScopeLevel } from "@/types";
import { ROLE_SCOPE_LABELS } from "@/lib/display";

export function RoleListPlatform() {
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<RoleScopeLevel | "ALL">("ALL");
  const [systemFilter, setSystemFilter] = useState<"ALL" | "SYSTEM" | "CUSTOM">("ALL");
  const [orgFilter, setOrgFilter] = useState<string>("ALL");

  const orgsQuery = useQuery({
    queryKey: platformKeys.organizations({ limit: 100 }),
    queryFn: () => listOrganizations({ limit: 100 }),
  });

  const { items: allItems, hasMore, isInitialLoading, isFetchingMore, isError, error, fetchMore, refetch } =
    useCursorPagination<Role>({
      queryKey: platformKeys.roles({}),
      queryFn: (params) => listRoles(params),
      limit: 50,
    });

  const orgMap = useMemo(() => {
    const m = new Map<string, string>();
    (orgsQuery.data?.items ?? []).forEach((o) => m.set(o.id, o.name));
    return m;
  }, [orgsQuery.data]);

  const filtered = useMemo(() => {
    return allItems.filter((r) => {
      const s = search.toLowerCase();
      const matchesSearch =
        !search ||
        r.name.toLowerCase().includes(s) ||
        r.code.toLowerCase().includes(s) ||
        r.id.toLowerCase().includes(s);
      const matchesScope = scopeFilter === "ALL" || r.scope_level === scopeFilter;
      const matchesSystem =
        systemFilter === "ALL" ||
        (systemFilter === "SYSTEM" && r.is_system) ||
        (systemFilter === "CUSTOM" && !r.is_system);
      const matchesOrg = orgFilter === "ALL" || (orgFilter === "SYSTEM" ? r.organization_id === null : r.organization_id === orgFilter);
      return matchesSearch && matchesScope && matchesSystem && matchesOrg;
    });
  }, [allItems, search, scopeFilter, systemFilter, orgFilter]);

  const isFilteredEmpty = !isInitialLoading && allItems.length > 0 && filtered.length === 0;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">All role definitions across the platform (read-only)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Search by name or code…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={scopeFilter} onValueChange={(v) => setScopeFilter(v as RoleScopeLevel | "ALL")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Scopes</SelectItem>
            <SelectItem value="PLATFORM">Platform</SelectItem>
            <SelectItem value="ORGANIZATION">Organization</SelectItem>
            <SelectItem value="SCHOOL">School</SelectItem>
          </SelectContent>
        </Select>
        <Select value={systemFilter} onValueChange={(v) => setSystemFilter(v as typeof systemFilter)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="SYSTEM">System only</SelectItem>
            <SelectItem value="CUSTOM">Custom only</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Organization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Organizations</SelectItem>
            <SelectItem value="SYSTEM">System (no org)</SelectItem>
            {(orgsQuery.data?.items ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        {isInitialLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : isError ? (
          <ErrorState error={error} onRetry={() => void refetch()} title="Failed to load roles" compact />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={isFilteredEmpty ? "No matching roles" : "No roles found"}
            description={isFilteredEmpty ? "Try adjusting your filters." : "Roles will appear here."}
            compact
          />
        ) : (
          <>
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pt-3 pl-4 pr-2 font-medium">Name</th>
                  <th className="pb-2 pt-3 px-2 font-medium">Code</th>
                  <th className="pb-2 pt-3 px-2 font-medium">Scope</th>
                  <th className="pb-2 pt-3 px-2 font-medium">Org</th>
                  <th className="pb-2 pt-3 px-2 font-medium">System</th>
                  <th className="pb-2 pt-3 pr-4 font-medium text-center">Permissions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 pl-4 pr-2">
                      <Link href={`/platform/roles/${r.id}`} className="text-sm font-medium hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="py-3 px-2 font-mono text-xs">{r.code}</td>
                    <td className="py-3 px-2 text-xs">{ROLE_SCOPE_LABELS[r.scope_level] ?? r.scope_level}</td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">{r.organization_id ? (orgMap.get(r.organization_id) ?? r.organization_id.slice(0, 8)) : "—"}</td>
                    <td className="py-3 px-2">{r.is_system ? <Badge variant="outline">System</Badge> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="py-3 pr-4 text-center text-sm text-muted-foreground">{r.permission_codes.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="sm:hidden divide-y">
              {filtered.map((r) => (
                <Link key={r.id} href={`/platform/roles/${r.id}`} className="block p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{r.name}</p>
                    {r.is_system ? <Badge variant="outline" className="text-[11px]">System</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">{r.code} · {ROLE_SCOPE_LABELS[r.scope_level] ?? r.scope_level} · {r.permission_codes.length} perms</p>
                  <p className="text-xs text-muted-foreground">{r.organization_id ? orgMap.get(r.organization_id) ?? r.organization_id.slice(0, 8) : "System"} </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={fetchMore} disabled={isFetchingMore}>
            {isFetchingMore ? "Loading…" : "Load More"}
          </Button>
        </div>
      )}
      {hasMore && filtered.length > 0 && <p className="text-center text-xs text-muted-foreground">Filters apply to loaded items only.</p>}
    </div>
  );
}
