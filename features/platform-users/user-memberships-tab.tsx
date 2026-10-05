"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { createMembership, deleteMembership, listMemberships, listRoles, grantRoleToMembership, revokeRoleFromMembership } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { StaleResourceDialog } from "@/components/patterns/stale-resource-dialog";
import { KeyRound, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Membership, Role } from "@/types";
import { format } from "date-fns";
import { toast } from "sonner";
import { showMutationError, isStaleResourceError } from "@/lib/error-messages";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UserMembershipsTabProps {
  userId: string;
}

function NewMembershipDialog({ userId, open, onOpenChange }: { userId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [schoolId, setSchoolId] = useState("");
  const mut = useMutation({
    mutationFn: () => createMembership({ user_id: userId, school_id: schoolId.trim() || null }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformKeys.userMemberships(userId) });
      void qc.invalidateQueries({ queryKey: platformKeys.user(userId) });
      toast.success("Membership created");
      onOpenChange(false);
      setSchoolId("");
    },
    onError: (e: unknown) => showMutationError(e),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Membership</DialogTitle>
          <DialogDescription>Create a membership for this user. Leave School ID empty for org-wide.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="school-id">School ID (optional)</Label>
            <Input id="school-id" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} placeholder="Leave blank for org-wide" />
            {!schoolId.trim() && (
              <Alert className="mt-2">
                <AlertDescription className="text-xs">
                  Leaving School ID empty grants <strong>organization-wide access</strong> across all schools in the org.
                </AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Creating…" : "Create"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ManageRolesDialog({
  membership,
  roles,
  open,
  onOpenChange,
  userId,
}: {
  membership: Membership | null;
  roles: Role[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  userId: string;
}) {
  const qc = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState("");

  const grantMut = useMutation({
    mutationFn: (roleId: string) => grantRoleToMembership(membership!.id, { role_id: roleId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformKeys.userMemberships(userId) });
      toast.success("Role granted");
      setSelectedRoleId("");
    },
    onError: (e: unknown) => showMutationError(e),
  });

  const revokeMut = useMutation({
    mutationFn: (roleId: string) => revokeRoleFromMembership(membership!.id, roleId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformKeys.userMemberships(userId) });
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

function Row({ membership, onEnd, onManageRoles }: { membership: Membership; onEnd: (m: Membership) => void; onManageRoles: (m: Membership) => void }) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="py-2.5 pl-4 pr-2 text-sm">
        {membership.organization_id.slice(0, 8)}…
      </td>
      <td className="py-2.5 px-2 text-xs text-muted-foreground">
        {membership.school_id ? (
          <Link href={`/platform/schools/${membership.school_id}/overview`} className="hover:underline">
            {membership.school_id.slice(0, 8)}…
          </Link>
        ) : (
          <span className="italic">Org-wide</span>
        )}
      </td>
      <td className="py-2.5 px-2">
        <div className="flex flex-wrap gap-1">
          {membership.role_codes.length ? (
            membership.role_codes.map((c) => (
              <span key={c} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                {c}
              </span>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      </td>
      <td className="py-2.5 px-2">
        <StatusBadge status={membership.status} />
      </td>
      <td className="py-2.5 px-2 text-xs text-muted-foreground whitespace-nowrap">
        {membership.start_date ? format(new Date(membership.start_date), "MMM d, yyyy") : "—"}
      </td>
      <td className="py-2.5 pr-4 text-right space-x-1">
        <Button variant="ghost" size="sm" onClick={() => onManageRoles(membership)}>
          Roles
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onEnd(membership)}>
          End
        </Button>
      </td>
    </tr>
  );
}

export function UserMembershipsTab({ userId }: UserMembershipsTabProps) {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [ending, setEnding] = useState<Membership | null>(null);
  const [managingRoles, setManagingRoles] = useState<Membership | null>(null);
  const [staleOpen, setStaleOpen] = useState(false);

  const rolesQuery = useQuery({
    queryKey: platformKeys.roles({ limit: 200 }),
    queryFn: () => listRoles({ limit: 200 }),
  });

  const { items, hasMore, isInitialLoading, isFetchingMore, isError, error, fetchMore, refetch } =
    useCursorPagination<Membership>({
      queryKey: platformKeys.userMemberships(userId),
      queryFn: (params) => listMemberships({ ...params, user_id: userId }),
    });

  const endMut = useMutation({
    mutationFn: () => {
      if (!ending) throw new Error("No membership");
      return deleteMembership(ending.id, ending.version);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: platformKeys.userMemberships(userId) });
      toast.success("Membership ended");
      setEnding(null);
    },
    onError: (err) => {
      if (isStaleResourceError(err)) {
        setStaleOpen(true);
        return;
      }
      showMutationError(err);
    },
  });

  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Add Membership
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">Organization</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">School</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Roles</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Start</th>
              <th className="py-2.5 pr-4 text-right text-xs font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isInitialLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="py-2.5 pl-4 pr-2"><Skeleton className="h-3 w-20" /></td>
                  <td className="py-2.5 px-2"><Skeleton className="h-3 w-20" /></td>
                  <td className="py-2.5 px-2"><Skeleton className="h-3 w-24" /></td>
                  <td className="py-2.5 px-2"><Skeleton className="h-5 w-16" /></td>
                  <td className="py-2.5 px-2"><Skeleton className="h-3 w-20" /></td>
                  <td className="py-2.5 pr-4"><Skeleton className="h-7 w-14 ml-auto" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12">
                  <EmptyState icon={KeyRound} title="No memberships" description="This user has no memberships yet." />
                </td>
              </tr>
            ) : (
              items.map((m) => <Row key={m.id} membership={m} onEnd={setEnding} onManageRoles={setManagingRoles} />)
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={fetchMore} disabled={isFetchingMore}>
            {isFetchingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      <NewMembershipDialog userId={userId} open={createOpen} onOpenChange={setCreateOpen} />
      <ManageRolesDialog
        membership={managingRoles}
        roles={rolesQuery.data?.items ?? []}
        open={!!managingRoles}
        onOpenChange={(o) => !o && setManagingRoles(null)}
        userId={userId}
      />

      <ConfirmDialog
        open={!!ending}
        onOpenChange={(o) => !o && setEnding(null)}
        title="End membership?"
        description="This will end the membership and remove the user's access for this scope."
        confirmLabel="End Membership"
        destructive
        onConfirm={async () => {
          await endMut.mutateAsync();
        }}
      />

      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={async () => {
          await refetch();
          setStaleOpen(false);
          toast.info("Reloaded latest data. Please retry.");
        }}
      />
    </div>
  );
}
