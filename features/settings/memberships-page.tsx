"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { deleteMembership, listMemberships, listSchools } from "@/services";
import type { Membership } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { orgKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { MembershipCreateDialog } from "./membership-dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { PermissionGate } from "@/components/ui/permission-gate";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export function MembershipsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [schoolFilter, setSchoolFilter] = useState("ALL");
  const [createOpen, setCreateOpen] = useState(false);
  const [ending, setEnding] = useState<Membership | null>(null);

  const canCreate = hasPermission(PERMISSIONS.membership.create);
  const canEnd = hasPermission(PERMISSIONS.membership.delete);

  const schoolsQuery = useQuery({
    queryKey: orgKeys.schools(),
    queryFn: () => listSchools(),
    staleTime: STALE_TIME.config,
  });

  const {
    items,
    hasMore,
    isInitialLoading,
    isFetchingMore,
    fetchMore,
  } = useCursorPagination({
    queryKey: orgKeys.memberships({ school_id: schoolFilter === "ALL" ? undefined : schoolFilter }),
    queryFn: (params) =>
      listMemberships({
        ...params,
        school_id: schoolFilter === "ALL" ? undefined : schoolFilter,
      }),
  });

  const schoolName = useMemo(() => {
    const map = new Map(
      (schoolsQuery.data?.items ?? []).map((school) => [school.id, school.name]),
    );
    return (schoolId: string | null) =>
      schoolId ? map.get(schoolId) ?? "—" : "Platform";
  }, [schoolsQuery.data]);

  const columns = useMemo<ColumnDef<DataTableFeatures, Membership, unknown>[]>(
    () => [
      {
        accessorKey: "user_id",
        header: "User",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.user_id.slice(0, 8)}…</span>
        ),
      },
      {
        accessorKey: "school_id",
        header: "School",
        cell: ({ row }) => schoolName(row.original.school_id),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "role_codes",
        header: "Roles",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.role_codes.length === 0 ? (
              <span className="text-muted-foreground">—</span>
            ) : (
              row.original.role_codes.map((code) => (
                <Badge key={code} variant="secondary" className="font-normal">
                  {code}
                </Badge>
              ))
            )}
          </div>
        ),
      },
      {
        accessorKey: "start_date",
        header: "Start",
        cell: ({ row }) =>
          row.original.start_date ? formatDate(row.original.start_date) : "—",
      },
      {
        accessorKey: "end_date",
        header: "End",
        cell: ({ row }) =>
          row.original.end_date ? formatDate(row.original.end_date) : "—",
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const membership = row.original;
          if (!canEnd) return null;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Actions">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setEnding(membership)}
                >
                  <Trash2 className="size-4" />
                  End membership
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [canEnd, schoolName],
  );

  async function handleEnd() {
    if (!ending) return;
    try {
      await deleteMembership(ending.id, ending.version);
      void queryClient.invalidateQueries({ queryKey: ["org", "memberships"] });
      toast.success("Membership ended");
      setEnding(null);
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <select
          value={schoolFilter}
          onChange={(event) => setSchoolFilter(event.target.value)}
          className="flex h-9 w-full max-w-xs items-center rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Filter by school"
        >
          <option value="ALL">All schools</option>
          <option value="">Platform only</option>
          {schoolsQuery.data?.items?.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name}
            </option>
          ))}
        </select>
        <PermissionGate permission={PERMISSIONS.membership.create}>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add membership
          </Button>
        </PermissionGate>
      </div>

      <DataTable
        columns={columns}
        data={items}
        rowKey={(membership) => membership.id}
        isLoading={isInitialLoading}
        isFetchingMore={isFetchingMore}
        hasMore={hasMore}
        onLoadMore={fetchMore}
        onRowClick={(membership) =>
          router.push(`/settings/users/${membership.user_id}`)
        }
        emptyState={{
          icon: Users,
          title: "No memberships",
          description:
            schoolFilter === "ALL"
              ? "Grant users access to a school."
              : "No memberships match this school.",
          action: canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add membership
            </Button>
          ) : undefined,
        }}
        mobileCard={(membership) => (
          <div
            className="flex items-center gap-3"
            onClick={() => router.push(`/settings/users/${membership.user_id}`)}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {schoolName(membership.school_id)}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={membership.status} />
                <span className="font-mono text-xs text-muted-foreground">
                  {membership.user_id.slice(0, 8)}…
                </span>
              </div>
            </div>
          </div>
        )}
      />

      <MembershipCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ConfirmDialog
        open={!!ending}
        onOpenChange={(open) => {
          if (!open) setEnding(null);
        }}
        title="End membership"
        description="This removes the user's access to the school. The membership is marked as ended and cannot be reused."
        confirmLabel="End membership"
        destructive
        onConfirm={handleEnd}
      />
    </>
  );
}