"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import {
  deleteMembership,
  getUser,
  listMemberships,
  listRoles,
  listSchools,
} from "@/services";
import type { Membership } from "@/types";
import { usePermissions } from "@/hooks/use-permissions";
import { orgKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { UserDialog } from "./user-dialog";
import {
  GrantRoleDialog,
  MembershipCreateDialog,
} from "./membership-dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/patterns/error-state";
import { EmptyState } from "@/components/patterns/empty-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { PermissionGate } from "@/components/ui/permission-gate";

export function UserDetailPage({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);
  const [grantRole, setGrantRole] = useState<Membership | null>(null);
  const [endMembership, setEndMembership] = useState<Membership | null>(null);

  const userQuery = useQuery({
    queryKey: orgKeys.user(userId),
    queryFn: () => getUser(userId),
    staleTime: STALE_TIME.entity,
  });

  const membershipsQuery = useQuery({
    queryKey: orgKeys.memberships({ user_id: userId }),
    queryFn: () => listMemberships({ user_id: userId, limit: 50 }),
    staleTime: STALE_TIME.entity,
  });

  const schoolsQuery = useQuery({
    queryKey: orgKeys.schools(),
    queryFn: () => listSchools(),
    staleTime: STALE_TIME.config,
  });

  const rolesQuery = useQuery({
    queryKey: orgKeys.roles(),
    queryFn: () => listRoles({ limit: 50 }),
    staleTime: STALE_TIME.config,
  });

  const schoolName = useMemo(() => {
    const map = new Map(
      (schoolsQuery.data?.items ?? []).map((school) => [school.id, school.name]),
    );
    return (schoolId: string | null) =>
      schoolId ? map.get(schoolId) ?? "—" : "Platform";
  }, [schoolsQuery.data]);

  if (userQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (userQuery.isError) {
    return (
      <ErrorState error={userQuery.error} onRetry={() => void userQuery.refetch()} />
    );
  }

  const user = userQuery.data;

  async function handleEndMembership() {
    if (!endMembership) return;
    try {
      await deleteMembership(endMembership.id, endMembership.version);
      void queryClient.invalidateQueries({ queryKey: ["org", "memberships"] });
      toast.success("Membership ended");
      setEndMembership(null);
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">
            {user.email ?? user.phone ?? "User"}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <StatusBadge status={user.status} />
            {user.is_platform_admin ? <Badge>Platform admin</Badge> : null}
            {user.must_change_password ? (
              <Badge variant="outline">Password reset required</Badge>
            ) : null}
          </div>
        </div>
        <PermissionGate permission={PERMISSIONS.user.update}>
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit user
          </Button>
        </PermissionGate>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <dl className="space-y-1 text-sm">
            <dt className="text-muted-foreground">Email</dt>
            <dd>{user.email ?? "—"}</dd>
          </dl>
          <dl className="space-y-1 text-sm">
            <dt className="text-muted-foreground">Phone</dt>
            <dd>{user.phone ?? "—"}</dd>
          </dl>
          <dl className="space-y-1 text-sm">
            <dt className="text-muted-foreground">Last login</dt>
            <dd>{user.last_login_at ? formatDate(user.last_login_at) : "Never"}</dd>
          </dl>
          <dl className="space-y-1 text-sm">
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(user.created_at)}</dd>
          </dl>
        </CardContent>
      </Card>

      <MembershipsSection
        userId={userId}
        userDisplay={user.email ?? user.phone ?? "this user"}
        memberships={membershipsQuery.data?.items ?? []}
        isLoading={membershipsQuery.isPending}
        error={membershipsQuery.error}
        onRetry={() => void membershipsQuery.refetch()}
        schoolName={schoolName}
        rolesLoading={rolesQuery.isPending}
        onGrantRole={setGrantRole}
        onEndMembership={setEndMembership}
        canGrant={hasPermission(PERMISSIONS.membership.grantRole)}
        canEnd={hasPermission(PERMISSIONS.membership.delete)}
      />

      <UserDialog open={editOpen} onOpenChange={setEditOpen} user={user} />

      {grantRole ? (
        <GrantRoleDialog
          membership={grantRole}
          roles={rolesQuery.data?.items ?? []}
          rolesLoading={rolesQuery.isPending}
          open={!!grantRole}
          onOpenChange={(open) => {
            if (!open) setGrantRole(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={!!endMembership}
        onOpenChange={(open) => {
          if (!open) setEndMembership(null);
        }}
        title="End membership"
        description="This removes the user's access to this school. The membership is marked as ended and cannot be reused."
        confirmLabel="End membership"
        destructive
        onConfirm={handleEndMembership}
      />
    </div>
  );
}

interface MembershipsSectionProps {
  userId: string;
  userDisplay: string;
  memberships: Membership[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  schoolName: (schoolId: string | null) => string;
  rolesLoading: boolean;
  onGrantRole: (membership: Membership) => void;
  onEndMembership: (membership: Membership) => void;
  canGrant: boolean;
  canEnd: boolean;
}

function MembershipsSection({
  userId,
  userDisplay,
  memberships,
  isLoading,
  error,
  onRetry,
  schoolName,
  rolesLoading,
  onGrantRole,
  onEndMembership,
  canGrant,
  canEnd,
}: MembershipsSectionProps) {
  const { hasPermission } = usePermissions();
  const [createOpen, setCreateOpen] = useState(false);
  const canCreate = hasPermission(PERMISSIONS.membership.create);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (error) {
    return <ErrorState error={error} onRetry={onRetry} compact />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Memberships</h3>
        {canCreate ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            Add membership
          </Button>
        ) : null}
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Users}
              title="No memberships"
              description={`${userDisplay} has no school memberships yet.`}
              compact
              action={
                canCreate ? (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="size-4" />
                    Add membership
                  </Button>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {memberships.map((membership) => (
            <Card key={membership.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{schoolName(membership.school_id)}</p>
                  <StatusBadge status={membership.status} />
                  {membership.is_default ? (
                    <Badge variant="outline">Default</Badge>
                  ) : null}
                  <div className="ml-auto flex items-center gap-1">
                    {canGrant ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGrantRole(membership)}
                        disabled={rolesLoading}
                      >
                        <ShieldCheck className="size-4" />
                        Grant role
                      </Button>
                    ) : null}
                    {canEnd ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEndMembership(membership)}
                      >
                        <Trash2 className="size-4" />
                        End
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {membership.role_codes.length === 0 ? (
                    <span className="text-sm text-muted-foreground">
                      No roles assigned.
                    </span>
                  ) : (
                    membership.role_codes.map((code) => (
                      <Badge key={code} variant="secondary">
                        {code}
                      </Badge>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {membership.start_date
                      ? `From ${formatDate(membership.start_date)}`
                      : "No start date"}
                  </span>
                  {membership.end_date ? (
                    <span>Until {formatDate(membership.end_date)}</span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <MembershipCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        userId={userId}
      />
    </div>
  );
}