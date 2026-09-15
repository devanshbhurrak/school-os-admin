"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listRoles } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ROLE_SCOPE_LABELS } from "@/lib/display";

export function PlatformDefaultRoles() {
  const query = useQuery({
    queryKey: platformKeys.roles({ limit: 100 }),
    queryFn: () => listRoles({ limit: 100 }),
  });

  const systemRoles = (query.data?.items ?? []).filter((r) => r.is_system);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Default Roles</CardTitle>
        <CardDescription>System role templates inherited by all new organizations (read-only)</CardDescription>
      </CardHeader>
      <CardContent>
        {query.isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : query.isError ? (
          <p className="text-sm text-muted-foreground">Failed to load roles.</p>
        ) : systemRoles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No system roles found.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="py-2.5 pl-4 text-left font-medium">Role</th>
                  <th className="py-2.5 px-2 text-left font-medium">Scope</th>
                  <th className="py-2.5 px-2 text-left font-medium">System</th>
                  <th className="py-2.5 px-2 text-left font-medium">Permissions</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {systemRoles.map((role) => (
                  <tr key={role.id} className="border-b last:border-0">
                    <td className="py-3 pl-4">
                      <p className="font-medium">{role.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{role.code}</p>
                    </td>
                    <td className="py-3 px-2 text-xs">{ROLE_SCOPE_LABELS[role.scope_level] ?? role.scope_level}</td>
                    <td className="py-3 px-2"><Badge variant="outline">System</Badge></td>
                    <td className="py-3 px-2 text-sm text-muted-foreground">{role.permission_codes.length}</td>
                    <td className="py-3 pr-4 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/platform/roles/${role.id}`}>View →</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
