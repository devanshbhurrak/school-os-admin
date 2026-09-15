"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRole, getRole } from "@/services";
import { orgKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS, PERMISSION_CATALOGUE } from "@/lib/permissions";
import { ROLE_SCOPE_LABELS, DATA_SCOPE_LABELS } from "@/lib/display";
import { showMutationError } from "@/lib/error-messages";
import { RoleDialog } from "./role-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { PermissionGate } from "@/components/ui/permission-gate";

export function RoleDetailPage({ roleId }: { roleId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const roleQuery = useQuery({
    queryKey: orgKeys.role(roleId),
    queryFn: () => getRole(roleId),
    staleTime: STALE_TIME.entity,
  });

  if (roleQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (roleQuery.isError) {
    return <ErrorState error={roleQuery.error} onRetry={() => void roleQuery.refetch()} />;
  }

  const role = roleQuery.data;
  const granted = new Set(role.permission_codes);

  async function handleDelete() {
    try {
      await deleteRole(role.id, role.version);
      void queryClient.invalidateQueries({ queryKey: ["org", "roles"] });
      toast.success("Deleted", { description: `Role ${role.code} was removed.` });
      router.push("/settings/roles");
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{role.name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-mono">{role.code}</span>
            <Badge variant="outline">
              {ROLE_SCOPE_LABELS[role.scope_level] ?? role.scope_level}
            </Badge>
            <Badge variant="outline">
              {DATA_SCOPE_LABELS[role.data_scope] ?? role.data_scope}
            </Badge>
            {role.is_system ? <Badge>System</Badge> : null}
          </div>
          {role.description ? (
            <p className="max-w-xl text-sm text-muted-foreground">{role.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PermissionGate permission={PERMISSIONS.role.update}>
            <Button
              variant="outline"
              size="sm"
              disabled={role.is_system}
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" />
              Edit
            </Button>
          </PermissionGate>
          <PermissionGate permission={PERMISSIONS.role.delete}>
            <Button
              variant="outline"
              size="sm"
              disabled={role.is_system}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </PermissionGate>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {role.permission_codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This role grants no permissions.
            </p>
          ) : (
            <div className="space-y-5">
              {PERMISSION_CATALOGUE.map((module) => {
                const moduleGranted = module.resources.some((resource) =>
                  resource.actions.some((action) => granted.has(action.code)),
                );
                if (!moduleGranted) return null;
                return (
                  <div key={module.module}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {module.moduleLabel}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {module.resources.map((resource) => {
                        const resourceGranted = resource.actions.filter((action) =>
                          granted.has(action.code),
                        );
                        if (resourceGranted.length === 0) return null;
                        return (
                          <div key={resource.resource} className="rounded-md border p-3">
                            <p className="mb-1.5 text-sm font-medium">
                              {resource.resourceLabel}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {resourceGranted.map((action) => (
                                <Badge key={action.code} variant="secondary">
                                  {action.label}
                                </Badge>
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
          )}
        </CardContent>
      </Card>

      <RoleDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        role={role}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete role"
        description={`Delete the role “${role.name}”? Users with this role will lose its permissions.`}
        confirmLabel="Delete role"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}