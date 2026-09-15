"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deletePerson,
  listPersons,
} from "@/services";
import type { ColumnDef } from "@tanstack/react-table";
import type { Person, PersonStatus } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { usePermissions } from "@/hooks/use-permissions";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate, formatAge, initials, personDisplayName } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/display";
import { showMutationError } from "@/lib/error-messages";
import { DataTable, type DataTableFeatures } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Pencil, Plus, Search, Trash2, Users, MoreHorizontal } from "lucide-react";
import { PermissionGate } from "@/components/ui/permission-gate";
import { PersonFormDialog } from "./person-form-dialog";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const STATUS_FILTERS: (PersonStatus | "ALL")[] = ["ALL", "ACTIVE", "INACTIVE", "DECEASED", "MERGED"];
const GENDER_FILTERS = ["ALL", "Male", "Female", "Other", "Prefer not to say"];

export function PersonList({ initialNew = false }: { initialNew?: boolean }) {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PersonStatus | "ALL">("ALL");
  const [genderFilter, setGenderFilter] = useState<string>("ALL");
  const [createOpen, setCreateOpen] = useState(initialNew);
  const [editing, setEditing] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const pagination = useCursorPagination<Person>({
    queryKey: schoolKeys.persons(schoolId, {
      search: debouncedQuery || undefined,
    }),
    queryFn: (params) => listPersons({ search: debouncedQuery || undefined, ...params }),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const filtered = useMemo(() => {
    return pagination.items.filter((person) => {
      if (statusFilter !== "ALL" && person.status !== statusFilter) return false;
      if (genderFilter !== "ALL" && person.gender !== genderFilter) return false;
      return true;
    });
  }, [pagination.items, statusFilter, genderFilter]);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deletePerson(deleting.id, deleting.version);
      toast.success("Person deleted", {
        description: `${personDisplayName(deleting)} was removed.`,
      });
      setDeleting(null);
      void queryClient.invalidateQueries({ queryKey: schoolKeys.persons(schoolId) });
    } catch (error) {
      showMutationError(error);
    }
  }

  const canCreate = hasPermission(PERMISSIONS.person.create);

  const columns = useMemo<ColumnDef<DataTableFeatures, Person, unknown>[]>(
    () => [
      {
        id: "name",
        accessorFn: (p) => personDisplayName(p),
        header: "Name",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              <AvatarFallback className="text-xs">
                {initials(personDisplayName(row.original))}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                href={`/people/${row.original.id}`}
                className="block truncate font-medium hover:underline"
              >
                {personDisplayName(row.original)}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.preferred_name && row.original.preferred_name !== row.original.first_name
                  ? `${row.original.first_name} ${row.original.last_name ?? ""}`.trim()
                  : row.original.primary_email ?? row.original.primary_phone ?? "No contact info"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "gender",
        accessorFn: (p) => p.gender ?? "",
        header: "Gender",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.gender ?? "—"}
          </span>
        ),
      },
      {
        id: "dob",
        accessorFn: (p) => p.date_of_birth ?? "",
        header: "Date of birth",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.date_of_birth
              ? `${formatDate(row.original.date_of_birth)}${formatAge(row.original.date_of_birth) ? ` · ${formatAge(row.original.date_of_birth)}` : ""}`
              : "—"}
          </span>
        ),
      },
      {
        id: "status",
        accessorFn: (p) => p.status,
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Open actions menu">
                  <MoreHorizontal className="size-4" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <PermissionGate permission={PERMISSIONS.person.update}>
                  <DropdownMenuItem onSelect={() => setEditing(row.original)}>
                    <Pencil className="size-4" /> Edit
                  </DropdownMenuItem>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.person.delete}>
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
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, or phone…"
            className="pl-9"
            aria-label="Search people"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PersonStatus | "ALL")}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by status"
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === "ALL" ? "All statuses" : STATUS_LABELS[status] ?? status}
              </option>
            ))}
          </select>
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by gender"
          >
            {GENDER_FILTERS.map((gender) => (
              <option key={gender} value={gender}>
                {gender === "ALL" ? "All genders" : gender}
              </option>
            ))}
          </select>
          <PermissionGate permission={PERMISSIONS.person.create}>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Add person
            </Button>
          </PermissionGate>
        </div>
      </div>

      {pagination.isError ? (
        <ErrorState error={pagination.error} onRetry={() => void pagination.refetch()} />
      ) : (
        <DataTable<Person>
          columns={columns}
          data={filtered}
          rowKey={(person) => person.id}
          isLoading={pagination.isInitialLoading}
          isFetchingMore={pagination.isFetchingMore}
          hasMore={pagination.hasMore && filtered.length === pagination.items.length}
          onLoadMore={() => pagination.fetchMore()}
          onRowClick={(person) => router.push(`/people/${person.id}`)}
          emptyState={
            <EmptyState
              icon={Users}
              title={pagination.items.length ? "No matching people" : "No people yet"}
              description={
                pagination.items.length
                  ? "Try changing your filters or search terms."
                  : "Add your first person to get started."
              }
              action={
                canCreate && !pagination.items.length ? (
                  <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    Add person
                  </Button>
                ) : undefined
              }
            />
          }
          mobileCard={(person) => (
            <button
              type="button"
              onClick={() => router.push(`/people/${person.id}`)}
              className="flex w-full items-center gap-3 rounded-lg border bg-background p-3 text-left"
            >
              <Avatar className="size-10">
                <AvatarFallback className="text-sm">
                  {initials(personDisplayName(person))}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{personDisplayName(person)}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {person.primary_email ?? person.primary_phone ?? "No contact info"}
                </p>
              </div>
              <StatusBadge status={person.status} />
            </button>
          )}
        />
      )}

      {canCreate ? (
        <PersonFormDialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open && initialNew) {
              router.replace("/people", { scroll: false });
            }
          }}
        />
      ) : null}

      {editing ? (
        <PersonFormDialog
          open={!!editing}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
          person={editing}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete person"
        description={
          deleting ? (
            <>
              This will permanently delete{" "}
              <span className="font-medium">{personDisplayName(deleting)}</span> and
              their contact details. This action cannot be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete person"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}