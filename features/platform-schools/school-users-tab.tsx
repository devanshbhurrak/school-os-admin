"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { getSchool, listMemberships, listRoles, listUsers } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/patterns/error-state";
import type { Membership, Role, User } from "@/types";

export function SchoolUsersTab({ schoolId }: { schoolId: string }) {
  const schoolQuery = useQuery({
    queryKey: platformKeys.school(schoolId),
    queryFn: () => getSchool(schoolId),
  });

  const memberships = useCursorPagination<Membership>({
    queryKey: platformKeys.schoolMemberships(schoolId),
    queryFn: (params) => listMemberships({ ...params, school_id: schoolId }),
  });

  // Users with access: derive from memberships userIds and fetch users page filtered client-side
  const userIds = [...new Set(memberships.items.map((m) => m.user_id))];
  const usersQuery = useQuery({
    queryKey: platformKeys.users({ limit: 200 }),
    queryFn: () => listUsers({ limit: 200 }),
    enabled: userIds.length > 0,
  });
  const users = (usersQuery.data?.items ?? []).filter((u: User) => userIds.includes(u.id));
  const isUsersMissing = userIds.length > 0 && (usersQuery.data?.has_more ?? false) && users.length < userIds.length;

  const rolesQuery = useQuery({
    queryKey: platformKeys.roles({ limit: 100 }),
    queryFn: () => listRoles({ limit: 100 }),
  });

  const orgId = schoolQuery.data?.organization_id;
  const schoolRoles = (rolesQuery.data?.items ?? []).filter(
    (r: Role) => r.is_system || (orgId && r.organization_id === orgId),
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Users with Access</CardTitle>
          <CardDescription>All memberships for this school. Load more to see all when paginated.</CardDescription>
        </CardHeader>
        <CardContent>
          {memberships.isInitialLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : memberships.isError ? (
            <ErrorState error={memberships.error} compact title="Failed to load memberships" onRetry={() => void memberships.refetch()} />
          ) : memberships.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users have access to this school yet.</p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr className="text-xs text-muted-foreground">
                      <th className="py-2 pl-4 text-left font-medium">User</th>
                      <th className="py-2 px-2 text-left font-medium">Status</th>
                      <th className="py-2 px-2 text-left font-medium">Roles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberships.items.map((m) => {
                      const user = users.find((u) => u.id === m.user_id);
                      return (
                        <tr key={m.id} className="border-b last:border-0">
                          <td className="py-2 pl-4">
                            <Link href={`/platform/users/${m.user_id}/profile`} className="font-medium hover:underline text-sm">
                              {user?.email ?? user?.phone ?? m.user_id.slice(0, 8)}
                            </Link>
                            {usersQuery.isPending && <span className="ml-2 text-xs text-muted-foreground">loading…</span>}
                          </td>
                          <td className="py-2 px-2"><StatusBadge status={m.status} /></td>
                          <td className="py-2 px-2">
                            <div className="flex flex-wrap gap-1">
                              {m.role_codes.length ? m.role_codes.map((c) => <Badge key={c} variant="secondary" className="text-[11px]">{c}</Badge>) : <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {isUsersMissing && <p className="text-xs text-amber-600 mt-2">Some user details could not be resolved (more than 200 users). Search for the user directly.</p>}
              {memberships.hasMore && (
                <div className="flex justify-center mt-3">
                  <Button variant="outline" size="sm" onClick={memberships.fetchMore} disabled={memberships.isFetchingMore}>
                    {memberships.isFetchingMore ? "Loading…" : "Load More"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roles Defined in This School</CardTitle>
          <CardDescription>Read-only. School admins manage roles in Settings → Roles.</CardDescription>
        </CardHeader>
        <CardContent>
          {rolesQuery.isPending ? (
            <Skeleton className="h-20" />
          ) : rolesQuery.isError ? (
            <ErrorState error={rolesQuery.error} compact title="Failed to load roles" />
          ) : schoolRoles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No roles.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-xs text-muted-foreground">
                    <th className="py-2 pl-4 text-left font-medium">Name</th>
                    <th className="py-2 px-2 text-left font-medium">Code</th>
                    <th className="py-2 px-2 text-left font-medium">System</th>
                    <th className="py-2 pr-4 text-left font-medium">Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolRoles.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="py-2 pl-4 font-medium">{r.name}</td>
                      <td className="py-2 px-2 font-mono text-xs">{r.code}</td>
                      <td className="py-2 px-2">{r.is_system ? <Badge variant="outline">System</Badge> : "—"}</td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">{r.permission_codes.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rolesQuery.data?.has_more && <p className="text-xs text-muted-foreground mt-2">More roles exist (truncated).</p>}
        </CardContent>
      </Card>
    </div>
  );
}
