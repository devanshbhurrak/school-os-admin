"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { listUsers, listOrganizations } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import type { User, UserStatus } from "@/types";
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
import { Badge } from "@/components/ui/badge";
import { UserDialog } from "@/features/settings/user-dialog";

const STATUS_OPTIONS: { value: UserStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "INVITED", label: "Invited" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DISABLED", label: "Disabled" },
];

const PLATFORM_FILTER: { value: "ALL" | "PLATFORM" | "NON_PLATFORM"; label: string }[] = [
  { value: "ALL", label: "All Users" },
  { value: "PLATFORM", label: "Platform Admins" },
  { value: "NON_PLATFORM", label: "Non-Platform" },
];

function UserRow({ user }: { user: User }) {
  return (
    <tr className="border-b last:border-b-0 hover:bg-muted/50">
      <td className="py-3 pl-4 pr-2">
        <Link
          href={`/platform/users/${user.id}/profile`}
          className="text-sm font-medium hover:underline"
        >
          {user.email ?? user.phone ?? user.id.slice(0, 8)}
        </Link>
        {user.email && user.phone && (
          <p className="text-xs text-muted-foreground">{user.phone}</p>
        )}
      </td>
      <td className="py-3 px-2">
        <StatusBadge status={user.status} />
      </td>
      <td className="py-3 px-2 text-center">
        {user.is_platform_admin ? (
          <Badge variant="outline" className="font-mono text-[11px] text-indigo-600">
            ✓
          </Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </td>
      <td className="py-3 px-2 text-sm text-muted-foreground text-center">
        {user.memberships.length}
      </td>
      <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
        {new Date(user.created_at).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
    </tr>
  );
}

export function UserListPlatform() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "ALL">("ALL");
  const [platformFilter, setPlatformFilter] = useState<"ALL" | "PLATFORM" | "NON_PLATFORM">("ALL");
  const [orgFilter, setOrgFilter] = useState<string>("ALL");
  const [sort, setSort] = useState<"created_desc" | "created_asc">("created_desc");
  const [dialogOpen, setDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const orgsQuery = useQuery({
    queryKey: platformKeys.organizations({ limit: 100 }),
    queryFn: () => listOrganizations({ limit: 100 }),
  });

  const { items: allItems, hasMore, isInitialLoading, isFetchingMore, isError, error, fetchMore, refetch } =
    useCursorPagination<User>({
      queryKey: platformKeys.users({ search: debouncedSearch || undefined }),
      queryFn: (params) => listUsers({ ...params, search: debouncedSearch || undefined }),
      limit: 50,
    });

  const filtered = useMemo(() => {
    let items = allItems.filter((u) => {
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
      const matchesPlatform =
        platformFilter === "ALL" ||
        (platformFilter === "PLATFORM" && u.is_platform_admin) ||
        (platformFilter === "NON_PLATFORM" && !u.is_platform_admin);
      const matchesOrg = orgFilter === "ALL" || u.memberships.some((m) => m.organization_id === orgFilter);
      return matchesStatus && matchesPlatform && matchesOrg;
    });
    items = [...items].sort((a, b) => {
      if (sort === "created_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return items;
  }, [allItems, statusFilter, platformFilter, orgFilter, sort]);

  const hasActiveFilters = !!debouncedSearch || statusFilter !== "ALL" || platformFilter !== "ALL" || orgFilter !== "ALL";
  const isFilteredEmpty = !isInitialLoading && filtered.length === 0 && hasActiveFilters;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">All users across the platform</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="size-4" />
          New User
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input placeholder="Search by email or phone…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as UserStatus | "ALL")}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={(v) => setPlatformFilter(v as typeof PLATFORM_FILTER[number]["value"])}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {PLATFORM_FILTER.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Organization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Organizations</SelectItem>
            {(orgsQuery.data?.items ?? []).map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="created_desc">Created ↓</SelectItem>
            <SelectItem value="created_asc">Created ↑</SelectItem>
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
          <ErrorState error={error} onRetry={() => void refetch()} title="Failed to load users" compact />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={isFilteredEmpty ? "No matching users" : "No users found"}
            description={isFilteredEmpty ? "Try adjusting your filters." : "Users will appear here once created."}
            compact
          />
        ) : (
          <>
            <table className="w-full hidden sm:table">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pt-3 pr-2 pl-4 font-medium">Email</th>
                  <th className="pb-2 pt-3 px-2 font-medium">Status</th>
                  <th className="pb-2 pt-3 px-2 font-medium text-center">PA</th>
                  <th className="pb-2 pt-3 px-2 font-medium text-center">Memberships</th>
                  <th className="pb-2 pt-3 pr-4 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
            <div className="sm:hidden divide-y">
              {filtered.map((user) => (
                <Link key={user.id} href={`/platform/users/${user.id}/profile`} className="block p-4 hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{user.email ?? user.phone ?? user.id.slice(0, 8)}</p>
                    <StatusBadge status={user.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user.is_platform_admin ? "Platform Admin · " : ""}{user.memberships.length} memberships · {new Date(user.created_at).toLocaleDateString()}
                  </p>
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
      {hasMore && (
        <p className="text-center text-xs text-muted-foreground">
          Showing first {filtered.length} results. Load more or refine your search.
        </p>
      )}

      <UserDialog open={dialogOpen} onOpenChange={setDialogOpen} user={null} />
    </div>
  );
}
