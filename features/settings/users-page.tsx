"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Plus, Users } from "lucide-react";
import { listUsers } from "@/services";
import type { User } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { orgKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { UserDialog } from "./user-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { PermissionGate } from "@/components/ui/permission-gate";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function mobileUserCard(user: User, onOpen: () => void, onEdit: () => void) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1" onClick={onOpen}>
        <p className="truncate text-sm font-medium">{user.email ?? user.phone ?? "—"}</p>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status={user.status} />
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function UsersPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [dialogUser, setDialogUser] = useState<User | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const canCreate = hasPermission(PERMISSIONS.user.create);

  const {
    items,
    hasMore,
    isInitialLoading,
    isFetchingMore,
    fetchMore,
  } = useCursorPagination({
    queryKey: orgKeys.users(),
    queryFn: (params) => listUsers(params),
  });

  const columns = useMemo<ColumnDef<DataTableFeatures, User, unknown>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.email ?? "—"}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => <span>{row.original.phone ?? "—"}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "must_change_password",
        header: "Password reset",
        cell: ({ row }) =>
          row.original.must_change_password ? (
            <Badge variant="outline">Required</Badge>
          ) : null,
      },
      {
        accessorKey: "last_login_at",
        header: "Last login",
        cell: ({ row }) =>
          row.original.last_login_at ? formatDate(row.original.last_login_at) : "Never",
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/settings/users/${user.id}`)}
                >
                  View
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setDialogUser(user);
                    setDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [router],
  );

  return (
    <>
      <div className="flex items-center justify-end">
        <PermissionGate permission={PERMISSIONS.user.create}>
          <Button
            onClick={() => {
              setDialogUser(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="size-4" />
            New user
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(user) => user.id}
        isLoading={isInitialLoading}
        isFetchingMore={isFetchingMore}
        hasMore={hasMore}
        onLoadMore={fetchMore}
        onRowClick={(user) => router.push(`/settings/users/${user.id}`)}
        emptyState={{
          icon: Users,
          title: "No users found",
          description: "Create your first user to get started.",
          action: canCreate ? (
            <Button
              onClick={() => {
                setDialogUser(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="size-4" />
              New user
            </Button>
          ) : undefined,
        }}
        mobileCard={(user) => (
          <>{mobileUserCard(user, () => router.push(`/settings/users/${user.id}`), () => {
            setDialogUser(user);
            setDialogOpen(true);
          })}</>
        )}
      />

      <UserDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        user={dialogUser}
      />
    </>
  );
}