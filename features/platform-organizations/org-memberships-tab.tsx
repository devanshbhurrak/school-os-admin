"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listMemberships, listSchools, listRoles, grantRoleToMembership, revokeRoleFromMembership } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { showMutationError } from "@/lib/error-messages";
import type { Membership, Role } from "@/types";
import { format } from "date-fns";

interface OrgMembershipsTabProps {
  orgId: string;
}

function OrgManageRolesDialog({
  membership,
  roles,
  open,
  onOpenChange,
  orgId,
}: {
  membership: Membership | null;
  roles: Role[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orgId: string;
}) {
  const qc = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const grantMut = useMutation({
    mutationFn: (roleId: string) => grantRoleToMembership(membership!.id, { role_id: roleId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformKeys.orgMemberships(orgId) });
      toast.success("Role granted");
      setSelectedRoleId("");
    },
    onError: (e: unknown) => showMutationError(e),
  });

  const revokeMut = useMutation({
    mutationFn: (roleId: string) => revokeRoleFromMembership(membership!.id, roleId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformKeys.orgMemberships(orgId) });
      toast.success("Role revoked");
    },
    onError: (e: unknown) => showMutationError(e),
  });

  if (!membership) return null;

  const assignedCodes = membership.role_codes;
  const availableRoles = roles.filter((r) => !assignedCodes.includes(r.code));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Roles</DialogTitle>
          <DialogDescription>Grant or revoke roles for this membership.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Current Roles</Label>
            {assignedCodes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles assigned</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {assignedCodes.map((code) => {
                  const role = roles.find((r) => r.code === code);
                  return (
                    <span key={code} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs">
                      {code}
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-destructive"
                        disabled={revokeMut.isPending}
                        onClick={() => {
                          if (role) revokeMut.mutate(role.id);
                          else toast.error(`Role "${code}" not found in loaded list. Reload and try again.`);
                        }}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
          {availableRoles.length > 0 && (
            <div className="flex gap-2">
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a role to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                disabled={!selectedRoleId || grantMut.isPending}
                onClick={() => { if (selectedRoleId) grantMut.mutate(selectedRoleId); }}
              >
                {grantMut.isPending ? "Adding…" : "Add"}
              </Button>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ membership, onManageRoles }: { membership: Membership; onManageRoles: (m: Membership) => void }) {
  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-2.5 pl-4 pr-2 text-sm">
        <Link
          href={`/platform/users/${membership.user_id}/memberships`}
          className="font-mono text-xs hover:underline text-muted-foreground"
        >
          {membership.user_id.slice(0, 8)}…
        </Link>
      </td>
      <td className="py-2.5 px-2 text-xs text-muted-foreground">
        {membership.school_id ? (
          <Link
            href={`/platform/schools/${membership.school_id}/overview`}
            className="hover:underline"
          >
            {membership.school_id.slice(0, 8)}…
          </Link>
        ) : (
          <span className="italic">Org-wide</span>
        )}
      </td>
      <td className="py-2.5 px-2">
        <div className="flex flex-wrap gap-1">
          {membership.role_codes.length > 0
            ? membership.role_codes.map((code) => (
                <span
                  key={code}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]"
                >
                  {code}
                </span>
              ))
            : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </td>
      <td className="py-2.5 px-2">
        <StatusBadge status={membership.status} />
      </td>
      <td className="py-2.5 px-2 text-xs text-muted-foreground whitespace-nowrap">
        {membership.start_date
          ? format(new Date(membership.start_date), "MMM d, yyyy")
          : "—"}
      </td>
      <td className="py-2.5 pr-4 text-right">
        <Button variant="ghost" size="sm" onClick={() => onManageRoles(membership)}>
          Roles
        </Button>
      </td>
    </tr>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b">
      <td className="py-2.5 pl-4 pr-2"><Skeleton className="h-3 w-20" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-3 w-24" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-4 w-24" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-5 w-16" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-3 w-20" /></td>
      <td className="py-2.5 pr-4"><Skeleton className="h-7 w-14 ml-auto" /></td>
    </tr>
  );
}

export function OrgMembershipsTab({ orgId }: OrgMembershipsTabProps) {
  const [schoolFilter, setSchoolFilter] = useState<string>("ALL");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [managingRoles, setManagingRoles] = useState<Membership | null>(null);

  const { items, hasMore, isInitialLoading, isFetchingMore, isError, fetchMore } =
    useCursorPagination<Membership>({
      queryKey: platformKeys.orgMemberships(orgId),
      queryFn: (params) => listMemberships({ ...params, organization_id: orgId }),
    });

  const schoolsQuery = useQuery({
    queryKey: platformKeys.orgSchools(orgId, { limit: 100 }),
    queryFn: () => listSchools({ limit: 100, organization_id: orgId }),
    enabled: !!orgId,
  });
  const rolesData = useQuery({
    queryKey: platformKeys.roles({ limit: 100 }),
    queryFn: () => listRoles({ limit: 100 }),
  });

  const filtered = useMemo(() => {
    return items.filter((m) => {
      const matchSchool = schoolFilter === "ALL" || (schoolFilter === "ORG_WIDE" ? !m.school_id : m.school_id === schoolFilter);
      const matchRole = roleFilter === "ALL" || m.role_codes.includes(roleFilter);
      const matchStatus = statusFilter === "ALL" || m.status === statusFilter;
      return matchSchool && matchRole && matchStatus;
    });
  }, [items, schoolFilter, roleFilter, statusFilter]);

  if (isError) return <ErrorState title="Failed to load memberships" />;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Select value={schoolFilter} onValueChange={setSchoolFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="School" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Schools</SelectItem>
            <SelectItem value="ORG_WIDE">Org-wide</SelectItem>
            {(schoolsQuery.data?.items ?? []).map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {(rolesData.data?.items ?? []).map((r) => (
              <SelectItem key={r.id} value={r.code}>{r.code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="ENDED">Ended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-md border hidden sm:block">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">User</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">School</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Roles</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Start</th>
              <th className="py-2.5 pr-4 text-right text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isInitialLoading
              ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <EmptyState icon={KeyRound} title="No memberships" description={items.length === 0 ? "Access memberships for this organization will appear here." : "No memberships match filters."} />
                  </td>
                </tr>
              )
              : filtered.map((m) => <Row key={m.id} membership={m} onManageRoles={setManagingRoles} />)}
          </tbody>
        </table>
      </div>

      <div className="sm:hidden space-y-2">
        {isInitialLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-md border" />)
          : filtered.length === 0 ? <EmptyState icon={KeyRound} title="No memberships" description="No memberships match filters." />
          : filtered.map((m) => (
              <div key={m.id} className="rounded-md border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Link href={`/platform/users/${m.user_id}/memberships`} className="font-mono text-xs hover:underline">{m.user_id.slice(0, 8)}…</Link>
                  <StatusBadge status={m.status} />
                </div>
                <p className="text-xs text-muted-foreground">{m.school_id ? `School ${m.school_id.slice(0, 8)}` : "Org-wide"} · {m.role_codes.join(", ") || "—"}</p>
                <p className="text-xs text-muted-foreground">{m.start_date ? format(new Date(m.start_date), "MMM d, yyyy") : "—"}</p>
              </div>
            ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={fetchMore} disabled={isFetchingMore}>
            {isFetchingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      <OrgManageRolesDialog
        membership={managingRoles}
        roles={rolesData.data?.items ?? []}
        open={!!managingRoles}
        onOpenChange={(o) => !o && setManagingRoles(null)}
        orgId={orgId}
      />
    </div>
  );
}
