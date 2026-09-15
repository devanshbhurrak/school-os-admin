"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ColumnDef } from "@tanstack/react-table";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type { CursorPage, CursorParams } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { STALE_TIME } from "@/lib/query-keys";
import { showMutationError } from "@/lib/error-messages";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PermissionGate } from "@/components/ui/permission-gate";
import { RecordDialog, type FieldConfig, type FormValue } from "./record-dialog";

type ListParams = CursorParams & Record<string, string | undefined>;

export interface EntityListConfig<T extends { id: string }> {
  permissions: { list: string; create: string; update: string; delete: string };
  queryKey: (schoolId: string, filters: Record<string, string | undefined>) =>
    readonly unknown[];
  listFn: (params: ListParams) => Promise<CursorPage<T>>;
  columns: ColumnDef<DataTableFeatures, T, unknown>[];
  mobileCard: (row: T) => React.ReactNode;
  rowHref?: (row: T) => string;
  dialog: {
    title: string;
    description?: string;
    fields: FieldConfig[];
    toFormValues: (record: T) => Record<string, FormValue>;
    toCreatePayload: (values: Record<string, FormValue>) => Record<string, unknown>;
    toUpdatePayload: (
      values: Record<string, FormValue>,
      record: T,
    ) => Record<string, unknown>;
    onCreate: (payload: Record<string, unknown>) => Promise<T>;
    onUpdate: (id: string, payload: Record<string, unknown>) => Promise<T>;
    fetchRecord?: (id: string) => Promise<T>;
  };
  onDelete: (record: T) => Promise<void>;
  deleteConfirm: (record: T) => { title: string; description: React.ReactNode };
  recordName: (record: T) => string;
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel: string;
  emptyIcon: LucideIcon;
  /** Query key prefixes to invalidate after any successful mutation. */
  invalidatePrefixes?: string[];
}

/**
 * Config-driven CRUD list page for academic records: search-free, filterable,
 * cursor-paginated table with create/edit/delete dialogs.
 */
export function EntityListPage<T extends { id: string }>({
  config,
}: {
  config: EntityListConfig<T>;
}) {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [deleting, setDeleting] = useState<T | null>(null);

  const filterParams = useMemo(() => {
    const params: Record<string, string | undefined> = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value && value !== "ALL") params[key] = value;
    }
    return params;
  }, [filters]);

  const pagination = useCursorPagination<T>({
    queryKey: config.queryKey(schoolId, filterParams),
    queryFn: (params) => config.listFn({ ...filterParams, ...params } as ListParams),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const canCreate = hasPermission(config.permissions.create);
  const canUpdate = hasPermission(config.permissions.update);

  function invalidateAll() {
    if (config.invalidatePrefixes?.length) {
      for (const prefix of config.invalidatePrefixes) {
        void queryClient.invalidateQueries({ queryKey: ["school", schoolId, prefix] });
      }
    } else {
      void queryClient.invalidateQueries({
        queryKey: config.queryKey(schoolId, {}),
      });
    }
  }

  const actionsColumn = useMemo<ColumnDef<DataTableFeatures, T, unknown>>(
    () => ({
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Actions">
                <span className="sr-only">Actions</span>
                <span className="flex size-4 items-center justify-center rounded-full text-muted-foreground">
                  •••
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <PermissionGate permission={config.permissions.update}>
                <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                  <Pencil className="size-4" /> Edit
                </DropdownMenuItem>
              </PermissionGate>
              <PermissionGate permission={config.permissions.delete}>
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleting(row.original)}
                >
                  <Trash2 className="size-4" /> Delete
                </DropdownMenuItem>
              </PermissionGate>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    }),
    [config],
  );

  const columns = useMemo(
    () => [...config.columns, actionsColumn],
    [config.columns, actionsColumn],
  );

  async function handleDelete() {
    if (!deleting) return;
    try {
      await config.onDelete(deleting);
      toast.success("Deleted", {
        description: `${config.recordName(deleting)} was removed.`,
      });
      setDeleting(null);
      invalidateAll();
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <div className="space-y-4">
      {(config.filters?.length || canCreate) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {config.filters?.map((filter) => (
              <select
                key={filter.key}
                value={filters[filter.key] ?? "ALL"}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, [filter.key]: e.target.value }))
                }
                className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
                aria-label={filter.label}
              >
                <option value="ALL">{filter.label}</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
          <PermissionGate permission={config.permissions.create}>
            <Button onClick={() => setCreateOpen(true)} className="sm:ml-auto">
              <Plus className="size-4" />
              Add
            </Button>
          </PermissionGate>
        </div>
      )}

      {pagination.isError ? (
        <ErrorState error={pagination.error} onRetry={() => void pagination.refetch()} />
      ) : (
        <DataTable<T>
          columns={columns}
          data={pagination.items}
          rowKey={(row) => row.id}
          isLoading={pagination.isInitialLoading}
          isFetchingMore={pagination.isFetchingMore}
          hasMore={pagination.hasMore}
          onLoadMore={() => pagination.fetchMore()}
          onRowClick={config.rowHref ? (row) => router.push(config.rowHref!(row)) : undefined}
          emptyState={
            <EmptyState
              icon={config.emptyIcon}
              title={config.emptyTitle}
              description={config.emptyDescription}
              action={
                canCreate ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    {config.emptyActionLabel}
                  </Button>
                ) : undefined
              }
            />
          }
          mobileCard={config.mobileCard}
        />
      )}

      {canCreate ? (
        <RecordDialog<T>
          open={createOpen}
          onOpenChange={setCreateOpen}
          record={null}
          title={config.dialog.title}
          description={config.dialog.description}
          fields={config.dialog.fields}
          toFormValues={config.dialog.toFormValues}
          toCreatePayload={config.dialog.toCreatePayload}
          toUpdatePayload={config.dialog.toUpdatePayload}
          onCreate={config.dialog.onCreate}
          onUpdate={config.dialog.onUpdate}
          onSaved={invalidateAll}
        />
      ) : null}

      {canUpdate && editing ? (
        <RecordDialog<T>
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          record={editing}
          title={config.dialog.title}
          description={config.dialog.description}
          fields={config.dialog.fields}
          toFormValues={config.dialog.toFormValues}
          toCreatePayload={config.dialog.toCreatePayload}
          toUpdatePayload={config.dialog.toUpdatePayload}
          onCreate={config.dialog.onCreate}
          onUpdate={config.dialog.onUpdate}
          onSaved={invalidateAll}
          fetchRecord={config.dialog.fetchRecord}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        {...(deleting ? config.deleteConfirm(deleting) : { title: "", confirmLabel: "Delete" })}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}