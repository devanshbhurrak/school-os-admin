"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { getUser, updateUser } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { DangerZone } from "@/components/patterns/danger-zone";
import { StaleResourceDialog } from "@/components/patterns/stale-resource-dialog";
import { formatDateTime } from "@/lib/format";
import { showMutationError, isStaleResourceError } from "@/lib/error-messages";
import { UserStatus } from "@/types";
import type { User } from "@/types";

interface UserProfileTabProps {
  userId: string;
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-2 last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

export function UserProfileTab({ userId }: UserProfileTabProps) {
  const queryClient = useQueryClient();
  const { data: user, isLoading, isError, error, refetch } = useQuery({
    queryKey: platformKeys.user(userId),
    queryFn: () => getUser(userId),
  });

  const [pendingAction, setPendingAction] = useState<"suspend" | "reactivate" | "forcePwd" | "reset" | null>(null);
  const [staleOpen, setStaleOpen] = useState(false);
  const [pendingPlatformToggle, setPendingPlatformToggle] = useState<"grant" | "revoke" | null>(null);

  const mutation = useMutation({
    mutationFn: async (input: { status?: User["status"]; must_change_password?: boolean }) => {
      if (!user) throw new Error("No user");
      return updateUser(user.id, { ...input, version: user.version });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(platformKeys.user(userId), updated);
      void queryClient.invalidateQueries({ queryKey: platformKeys.users() });
      toast.success("User updated");
      setPendingAction(null);
    },
    onError: (err) => {
      if (isStaleResourceError(err)) {
        setStaleOpen(true);
        return;
      }
      showMutationError(err);
      setPendingAction(null);
    },
  });

  // Platform admin toggle is not supported by current PATCH /users schema (requires backend change).
  // We keep the danger-zone UX per spec but surface the gap clearly.

  async function handlePasswordReset() {
    try {
      const { requestPasswordReset } = await import("@/services/auth");
      await requestPasswordReset({ identifier: user?.email ?? user?.phone ?? "" });
      toast.success("Password reset email sent");
    } catch (err) {
      showMutationError(err);
    }
    setPendingAction(null);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (isError || !user) {
    return <ErrorState error={error} onRetry={() => void refetch()} />;
  }

  const isSuspended = user.status === UserStatus.Suspended;
  const isActive = user.status === UserStatus.Active;
  const isInvited = user.status === UserStatus.Invited;
  const isDisabled = user.status === UserStatus.Disabled;

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identity</CardTitle>
        </CardHeader>
        <CardContent>
          <dl>
            <FieldRow label="Email" value={user.email} />
            <FieldRow label="Phone" value={user.phone} />
            <FieldRow
              label="Linked Person"
              value={
                user.person_id ? (
                  (() => {
                    const schoolPortal = process.env.NEXT_PUBLIC_SCHOOL_PORTAL_URL?.replace(/\/$/, "") ?? "";
                    // Prefer default membership's school, otherwise first school membership
                    const defaultM = user.memberships.find((m) => m.is_default && m.school_id);
                    const schoolId = defaultM?.school_id ?? user.memberships.find((m) => m.school_id)?.school_id ?? "";
                    const href = schoolPortal ? `${schoolPortal}/people/${user.person_id}${schoolId ? `?schoolId=${schoolId}` : ""}` : `/people/${user.person_id}`;
                    return (
                      <Link href={href} target={schoolPortal ? "_blank" : undefined} className="font-mono text-xs text-primary hover:underline">
                        {user.person_id.slice(0, 8)}… → school portal
                      </Link>
                    );
                  })()
                ) : (
                  "—"
                )
              }
            />
            <FieldRow label="Status" value={<StatusBadge status={user.status} />} />
            <FieldRow
              label="Platform Admin"
              value={user.is_platform_admin ? <Badge variant="outline">Yes</Badge> : "No"}
            />
            <FieldRow label="Must change password" value={user.must_change_password ? "Yes" : "No"} />
            <FieldRow label="Created" value={formatDateTime(user.created_at)} />
            <FieldRow label="Last login" value={user.last_login_at ? formatDateTime(user.last_login_at) : "Never"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setPendingAction("reset")}>
            Send Password Reset
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPendingAction("forcePwd")}>
            Force Password Change
          </Button>
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPendingAction("suspend")}
              disabled={mutation.isPending}
            >
              Suspend User
            </Button>
          )}
          {isSuspended && (
            <Button variant="outline" size="sm" onClick={() => setPendingAction("reactivate")} disabled={mutation.isPending}>
              Reactivate User
            </Button>
          )}
          {isInvited && (
            <Button variant="outline" size="sm" onClick={() => setPendingAction("reactivate")} disabled={mutation.isPending}>
              Activate User
            </Button>
          )}
          {isDisabled && (
            <Button variant="outline" size="sm" onClick={() => setPendingAction("reactivate")} disabled={mutation.isPending}>
              Re-enable User
            </Button>
          )}
        </CardContent>
      </Card>

      <DangerZone
        actions={[
          ...(user.is_platform_admin
            ? [
                {
                  label: "Remove Platform Admin access",
                  description: "This will revoke full unrestricted access to all organizations, schools, and users. (Requires backend support for is_platform_admin toggle.)",
                  confirmValue: user.email ?? user.id,
                  buttonLabel: "Remove Platform Admin",
                  isLoading: false,
                  onConfirm: () => setPendingPlatformToggle("revoke"),
                } as const,
              ]
            : [
                {
                  label: "Grant Platform Admin access",
                  description:
                    "This gives full unrestricted access to all organizations, schools, and users on the platform. (Requires backend support for is_platform_admin toggle.)",
                  confirmValue: user.email ?? user.id,
                  buttonLabel: "Grant Platform Admin",
                  isLoading: false,
                  onConfirm: () => setPendingPlatformToggle("grant"),
                } as const,
              ]),
        ]}
      />

      <ConfirmDialog
        open={pendingAction === "suspend"}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title="Suspend user?"
        description={`This will suspend ${user.email ?? user.phone ?? "this user"} and block their access until reactivated.`}
        confirmLabel="Suspend"
        destructive
        onConfirm={async () => {
          await mutation.mutateAsync({ status: UserStatus.Suspended });
        }}
      />
      <ConfirmDialog
        open={pendingAction === "reactivate"}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title="Reactivate user?"
        description={`This will reactivate ${user.email ?? user.phone ?? "this user"} and restore their access.`}
        confirmLabel="Reactivate"
        onConfirm={async () => {
          await mutation.mutateAsync({ status: UserStatus.Active });
        }}
      />
      <ConfirmDialog
        open={pendingAction === "forcePwd"}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title="Force password change?"
        description="The user will be required to change their password on next sign-in."
        confirmLabel="Require change"
        onConfirm={async () => {
          await mutation.mutateAsync({ must_change_password: true });
        }}
      />
      <ConfirmDialog
        open={pendingAction === "reset"}
        onOpenChange={(o) => !o && setPendingAction(null)}
        title="Send password reset?"
        description={`A password reset email will be sent to ${user.email ?? user.phone ?? "this user"}.`}
        confirmLabel="Send email"
        onConfirm={handlePasswordReset}
      />
      <ConfirmDialog
        open={!!pendingPlatformToggle}
        onOpenChange={(o) => !o && setPendingPlatformToggle(null)}
        title={pendingPlatformToggle === "grant" ? "Grant Platform Admin?" : "Remove Platform Admin?"}
        description="This is a sensitive operation. Ensure you type the confirmation value exactly."
        confirmLabel={pendingPlatformToggle === "grant" ? "Grant" : "Remove"}
        destructive
        onConfirm={async () => {
          // Placeholder: backend does not expose is_platform_admin toggle via PATCH today.
          // Keep dialog UX per spec, log audit via client toast.
          toast.info("Platform admin toggle is not yet supported by the API (requires backend change).");
          setPendingPlatformToggle(null);
        }}
      />

      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={async () => {
          await refetch();
          setStaleOpen(false);
          toast.info("Loaded latest version. Please retry your change.");
        }}
      />
    </div>
  );
}
