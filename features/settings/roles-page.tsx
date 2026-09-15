"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteRole, listRoles } from "@/services";
import type { Role } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { orgKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { ROLE_SCOPE_LABELS, DATA_SCOPE_LABELS } from "@/lib/display";
import { showMutationError } from "@/lib/error-messages";
import { RoleDialog } from "./role-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RolesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [dialogRole, setDialogRole] = useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Role | null>(null);

  const canCreate = hasPermission(PERMISSIONS.role.create);

  const {
    items,
    hasMore,
    isInitialLoading,
    isFetchingMore,
    fetchMore,
  } = useCursorPagination({
    queryKey: orgKeys.roles(),
    queryFn: (params) => listRoles(params),
  });

  const columns = useMemo<ColumnDef<DataTableFeatures, Role, unknown>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Code",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-medium">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.original.name}</span>
            {row.original.is_system ? (
              <Badge variant="outline">System</Badge>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "scope_level",
        header: "Scope",
        cell: ({ row }) => ROLE_SCOPE_LABELS[row.original.scope_level] ?? row.original.scope_level,
      },
      {
        accessorKey: "data_scope",
        header: "Data scope",
        cell: ({ row }) => DATA_SCOPE_LABELS[row.original.data_scope] ?? row.original.data_scope,
      },
      {
        accessorKey: "permission_codes",
        header: "Permissions",
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.permission_codes.length} granted
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const role = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/settings/roles/${role.id}`)}
                >
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={role.is_system}
                  onClick={() => {
                    setDialogRole(role);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={role.is_system}
                  onClick={() => setDeleting(role)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router],
  );

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteRole(deleting.id, deleting.version);
      toast.success("Deleted", {
        description: `Role ${deleting.code} was removed.`,
      });
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["org", "roles"] });
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <PermissionGate permission={PERMISSIONS.role.create}>
          <Button
            onClick={() => {
              setDialogRole(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            New role
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(role) => role.id}
        isLoading={isInitialLoading}
        isFetchingMore={isFetchingMore}
        hasMore={hasMore}
        onLoadMore={fetchMore}
        onRowClick={(role) => router.push(`/settings/roles/${role.id}`)}
        emptyState={{
          icon: Shield,
          title: "No roles yet",
          description: "Create roles to define what each user can do.",
          action: canCreate ? (
            <Button
              onClick={() => {
                setDialogRole(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              New role
            </Button>
          ) : undefined,
        }}
        mobileCard={(role) => (
          <div className="flex items-center gap-3">
            <div
              className="min-w-0 flex-1"
              onClick={() => router.push(`/settings/roles/${role.id}`)}
            >
              <p className="truncate text-sm font-medium">{role.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {role.code}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/settings/roles/${role.id}`)}
                >
                  View
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      />

      <RoleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        role={dialogRole}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete role"
        description={
          deleting
            ? `Delete the role “${deleting.name}”? Users with this role will lose its permissions.`
            : ""
        }
        confirmLabel="Delete role"
        destructive
        onConfirm={handleDelete}
      />
    </>
  );
}