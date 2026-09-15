"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getRole, listMemberships } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/patterns/error-state";
import { Badge } from "@/components/ui/badge";
import { PERMISSION_CATALOGUE } from "@/lib/permissions";
import { ROLE_SCOPE_LABELS, DATA_SCOPE_LABELS } from "@/lib/display";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import type { Membership, Role } from "@/types";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

function PermissionMatrix({ role }: { role: Role }) {
  const granted = new Set(role.permission_codes);
  if (granted.size === 0) return <p className="text-sm text-muted-foreground">No permissions.</p>;
  return (
    <div className="space-y-5">
      {PERMISSION_CATALOGUE.map((mod) => {
        const hasAny = mod.resources.some((res) => res.actions.some((a) => granted.has(a.code)));
        if (!hasAny) return null;
        return (
          <div key={mod.module}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{mod.moduleLabel}</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mod.resources.map((res) => {
                const actions = res.actions.filter((a) => granted.has(a.code));
                if (!actions.length) return null;
                return (
                  <div key={res.resource} className="rounded-md border p-3">
                    <p className="mb-1.5 text-sm font-medium">{res.resourceLabel}</p>
                    <div className="flex flex-wrap gap-1">
                      {actions.map((a) => (
                        <Badge key={a.code} variant="secondary">{a.label}</Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MembershipsUsingRole({ role }: { role: Role }) {
  const { items, hasMore, isInitialLoading, isFetchingMore, isError, fetchMore } =
    useCursorPagination<Membership>({
      queryKey: [...platformKeys.roles({}), role.id, "memberships"] as const,
      queryFn: (params) => listMemberships(params as Record<string, string> as never),
      limit: 50,
    });

  const filtered = items.filter((m) => m.role_codes.includes(role.code));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Memberships Using This Role</CardTitle>
        <p className="text-xs text-muted-foreground">Client-side filtered on loaded page; server filter requires API <code>role_id</code> support.</p>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="text-sm text-muted-foreground">Failed to load memberships.</p>
        ) : isInitialLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground">No memberships with <span className="font-mono font-medium">{role.code}</span> in loaded page.</p>
            <p className="text-xs text-muted-foreground mt-1">{items.length} memberships loaded, {filtered.length} match. Load more to search further.</p>
            {hasMore && <Button variant="outline" size="sm" onClick={fetchMore} disabled={isFetchingMore} className="mt-3">{isFetchingMore ? "Loading…" : "Load more"}</Button>}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{filtered.length} of {items.length} loaded memberships match <span className="font-mono">{role.code}</span></p>
            <div className="rounded-md border overflow-hidden hidden sm:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr className="text-xs text-muted-foreground">
                    <th className="py-2 pl-4 text-left font-medium">User</th>
                    <th className="py-2 px-2 text-left font-medium">School</th>
                    <th className="py-2 px-2 text-left font-medium">Roles</th>
                    <th className="py-2 pr-4 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 20).map((m) => (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="py-2 pl-4 font-mono text-xs">
                        <Link href={`/platform/users/${m.user_id}/profile`} className="hover:underline">{m.user_id.slice(0, 8)}…</Link>
                      </td>
                      <td className="py-2 px-2 text-xs">{m.school_id ? <Link href={`/platform/schools/${m.school_id}/overview`} className="hover:underline">{m.school_id.slice(0, 8)}</Link> : "Org-wide"}</td>
                      <td className="py-2 px-2">
                        <div className="flex flex-wrap gap-1">
                          {m.role_codes.map((c) => (
                            <span key={c} className={`rounded px-1 py-0.5 font-mono text-[11px] ${c === role.code ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2 pr-4"><StatusBadge status={m.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sm:hidden space-y-2">
              {filtered.slice(0, 20).map((m) => (
                <div key={m.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{m.user_id.slice(0, 8)}…</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{m.school_id ? `School ${m.school_id.slice(0, 8)}` : "Org-wide"} · {m.role_codes.join(", ")}</p>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center pt-2">
                <Button variant="outline" size="sm" onClick={fetchMore} disabled={isFetchingMore}>
                  {isFetchingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoleDetailPlatform({ roleId }: { roleId: string }) {
  const { data: role, isLoading, isError, error, refetch } = useQuery({
    queryKey: platformKeys.role(roleId),
    queryFn: () => getRole(roleId),
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  if (isError || !role) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-6">
      <Link href="/platform/roles" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Roles
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{role.name}</h1>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">{role.code}</span>
          <span>·</span>
          <Badge variant="outline">{ROLE_SCOPE_LABELS[role.scope_level] ?? role.scope_level}</Badge>
          <Badge variant="outline">{DATA_SCOPE_LABELS[role.data_scope] ?? role.data_scope}</Badge>
          {role.is_system && <Badge>System</Badge>}
          <span>·</span>
          <span>{role.permission_codes.length} permissions</span>
        </div>
        {role.description && <p className="text-sm text-muted-foreground max-w-2xl">{role.description}</p>}
        <p className="text-xs text-muted-foreground">Platform view is read-only for school-scoped and system roles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <PermissionMatrix role={role} />
        </CardContent>
      </Card>

      <MembershipsUsingRole role={role} />
    </div>
  );
}
