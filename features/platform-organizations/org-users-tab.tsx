"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listMemberships, listSchools } from "@/services/iam";
import { listUsers } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { Users, Search } from "lucide-react";
import type { User } from "@/types";

interface OrgUsersTabProps {
  orgId: string;
}

export function OrgUsersTab({ orgId }: OrgUsersTabProps) {
  const [search, setSearch] = useState("");

  const {
    items: memberships,
    isInitialLoading: membershipsLoading,
    isError: membershipsError,
  } = useCursorPagination({
    queryKey: platformKeys.orgMembershipsForUsers(orgId),
    queryFn: (params) => listMemberships({ ...params, organization_id: orgId }),
    limit: 200,
  });

  const schoolsQuery = useQuery({
    queryKey: platformKeys.orgSchools(orgId, { limit: 100 }),
    queryFn: () => listSchools({ limit: 100, organization_id: orgId }),
    enabled: !!orgId,
  });

  const schoolMap = useMemo(() => {
    const m = new Map<string, string>();
    (schoolsQuery.data?.items ?? []).forEach((s) => m.set(s.id, s.name));
    return m;
  }, [schoolsQuery.data]);

  const userIds = useMemo(() => [...new Set(memberships.map((m) => m.user_id))], [memberships]);

  const { data: allUsersPage, isLoading: usersLoading, isError: usersError } = useQuery({
    queryKey: platformKeys.users({ limit: 500 }),
    queryFn: () => listUsers({ limit: 500 }),
    enabled: userIds.length > 0,
  });

  const isUsersTruncated = allUsersPage?.has_more ?? false;
  const isLoading = membershipsLoading || usersLoading;
  const isError = membershipsError || usersError;

  const membershipsByUser = useMemo(() => {
    const map = new Map<string, typeof memberships>();
    memberships.forEach((m) => {
      const arr = map.get(m.user_id) ?? ([] as typeof memberships);
      arr.push(m);
      map.set(m.user_id, arr);
    });
    return map;
  }, [memberships]);

  function getScopeLabel(userId: string): string {
    const ms = membershipsByUser.get(userId) ?? [];
    // If any org-wide (school_id null) → Org-wide
    if (ms.some((m) => !m.school_id)) return "Org-wide";
    // Otherwise first school name
    const firstSchoolId = ms[0]?.school_id;
    if (firstSchoolId) return schoolMap.get(firstSchoolId) ?? firstSchoolId.slice(0, 8);
    return "—";
  }

  const users: User[] = useMemo(() => {
    const all = (allUsersPage?.items ?? []).filter((u: User) => userIds.includes(u.id));
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((u) => (u.email?.toLowerCase().includes(q) ?? false) || (u.phone?.toLowerCase().includes(q) ?? false));
  }, [allUsersPage, userIds, search]);

  if (isError) return <ErrorState title="Failed to load users" />;

  return (
    <div className="space-y-3">
      {isUsersTruncated && <p className="text-xs text-amber-600">User list truncated at 500 — some members may not appear. Use platform Users search for full results.</p>}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <Input placeholder="Search by name or email…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-md border">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">Name</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Email</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="py-2.5 pr-4 pl-2 text-left text-xs font-medium text-muted-foreground">Scope</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2.5 pl-4 pr-2"><Skeleton className="h-4 w-32" /></td>
                  <td className="py-2.5 px-2"><Skeleton className="h-3 w-32" /></td>
                  <td className="py-2.5 px-2"><Skeleton className="h-5 w-16" /></td>
                  <td className="py-2.5 pr-4 pl-2"><Skeleton className="h-3 w-20" /></td>
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-12">
                  <EmptyState icon={Users} title="No users yet" description="Users with access to this organization will appear here." />
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-muted/50">
                  <td className="py-2.5 pl-4 pr-2 text-sm font-medium">{user.email?.split("@")[0] ?? user.phone ?? "—"}</td>
                  <td className="py-2.5 px-2 text-sm">
                    <Link href={`/platform/users/${user.id}/profile`} className="hover:underline">
                      {user.email ?? user.phone ?? user.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="py-2.5 px-2"><StatusBadge status={user.status} /></td>
                  <td className="py-2.5 pr-4 pl-2 text-xs text-muted-foreground">{getScopeLabel(user.id)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-md border" />)
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users yet" description="Users with access to this organization will appear here." />
        ) : (
          users.map((user) => (
            <Link key={user.id} href={`/platform/users/${user.id}/profile`} className="block rounded-md border p-3 hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm truncate">{user.email ?? user.phone ?? user.id.slice(0, 8)}</p>
                <StatusBadge status={user.status} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{getScopeLabel(user.id)} · {user.email ?? user.phone ?? ""}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
