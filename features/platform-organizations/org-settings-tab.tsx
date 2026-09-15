"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getOrganization, updateOrganization } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { DangerZone } from "@/components/patterns/danger-zone";
import { FormSection } from "@/components/patterns/form-section";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { StaleResourceDialog } from "@/components/patterns/stale-resource-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { ErrorState } from "@/components/patterns/error-state";
import { OrganizationStatus, type Organization } from "@/types";
import { isStaleResourceError } from "@/lib/error-messages";

// ── Profile form ────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  legal_name: z.string().nullable().optional(),
  contact_email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  contact_phone: z.string().nullable().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  locale: z.string().min(1, "Locale is required"),
});

type ProfileValues = z.infer<typeof profileSchema>;

function ProfileForm({ org }: { org: Organization }) {
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } =
    useForm<ProfileValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        name: org.name,
        legal_name: org.legal_name ?? "",
        contact_email: org.contact_email ?? "",
        contact_phone: org.contact_phone ?? "",
        timezone: org.timezone,
        locale: org.locale,
      },
    });

  useEffect(() => {
    reset({
      name: org.name,
      legal_name: org.legal_name ?? "",
      contact_email: org.contact_email ?? "",
      contact_phone: org.contact_phone ?? "",
      timezone: org.timezone,
      locale: org.locale,
    });
  }, [org, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) => {
      const payload: Record<string, unknown> = { ...values, version: org.version };
      // Convert empty strings to null for nullable fields
      (["legal_name", "contact_email", "contact_phone"] as const).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });
      return updateOrganization(org.id, payload as never);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(platformKeys.organization(org.id), updated);
      void queryClient.invalidateQueries({ queryKey: platformKeys.organizations() });
      toast.success("Organization updated");
    },
    onError: (err) => {
      if (isStaleResourceError(err)) {
        setStaleOpen(true);
        return;
      }
      toast.error("Failed to save changes");
    },
  });

  return (
    <>
      <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
        <FormSection title="Organization Profile">
          <div className="space-y-1.5">
            <Label>Slug (derived from Code)</Label>
            <Input value={org.code.toLowerCase().replace(/_/g, "-")} disabled className="font-mono bg-muted" />
            <p className="text-xs text-muted-foreground">Slug is derived from Code; Code is immutable after creation.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="legal_name">Legal Name</Label>
            <Input id="legal_name" {...register("legal_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input id="contact_email" type="email" {...register("contact_email")} />
            {errors.contact_email && (
              <p className="text-xs text-destructive">{errors.contact_email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input id="contact_phone" {...register("contact_phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Timezone *</Label>
            <Input id="timezone" {...register("timezone")} />
            {errors.timezone && <p className="text-xs text-destructive">{errors.timezone.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="locale">Locale *</Label>
            <Input id="locale" {...register("locale")} />
            {errors.locale && <p className="text-xs text-destructive">{errors.locale.message}</p>}
          </div>
        </FormSection>

        <div className="flex justify-end">
          <Button type="submit" disabled={!isDirty || mutation.isPending} size="sm">
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={async () => {
          const fresh = await getOrganization(org.id);
          queryClient.setQueryData(platformKeys.organization(org.id), fresh);
          setStaleOpen(false);
          toast.info("Loaded latest version. Please retry.");
        }}
      />
    </>
  );
}

// ── Status transitions ───────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, Array<{ label: string; nextStatus: string; destructive?: boolean }>> = {
  [OrganizationStatus.Trial]: [
    { label: "Activate", nextStatus: OrganizationStatus.Active },
    { label: "Suspend", nextStatus: OrganizationStatus.Suspended, destructive: true },
    { label: "Close", nextStatus: OrganizationStatus.Closed, destructive: true },
  ],
  [OrganizationStatus.Active]: [
    { label: "Suspend", nextStatus: OrganizationStatus.Suspended, destructive: true },
    { label: "Close", nextStatus: OrganizationStatus.Closed, destructive: true },
  ],
  [OrganizationStatus.Suspended]: [
    { label: "Reactivate", nextStatus: OrganizationStatus.Active },
    { label: "Close", nextStatus: OrganizationStatus.Closed, destructive: true },
  ],
  [OrganizationStatus.Closed]: [],
};

function StatusSection({ org }: { org: Organization }) {
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [staleOpen, setStaleOpen] = useState(false);

  const transitions = STATUS_TRANSITIONS[org.status] ?? [];

  const mutation = useMutation({
    mutationFn: (nextStatus: string) =>
      updateOrganization(org.id, { status: nextStatus as Organization["status"], version: org.version }),
    onSuccess: (updated) => {
      queryClient.setQueryData(platformKeys.organization(org.id), updated);
      void queryClient.invalidateQueries({ queryKey: platformKeys.organizations() });
      toast.success("Status updated");
      setPendingStatus(null);
    },
    onError: (err) => {
      if (isStaleResourceError(err)) {
        setStaleOpen(true);
        return;
      }
      toast.error("Failed to update status");
      setPendingStatus(null);
    },
  });

  if (transitions.length === 0) {
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Status</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={org.status} />
          <span className="text-xs text-muted-foreground">— terminal state, no further transitions</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Status</h3>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={org.status} />
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => (
            <Button
              key={t.nextStatus}
              variant={t.destructive ? "destructive" : "outline"}
              size="sm"
              onClick={() => setPendingStatus(t.nextStatus)}
              disabled={mutation.isPending}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {pendingStatus && (
        <ConfirmDialog
          open
          onOpenChange={(open) => { if (!open) setPendingStatus(null); }}
          title={`Change status to ${pendingStatus}?`}
          description={`This will change the organization's status from ${org.status} to ${pendingStatus}. This affects all schools and users within it.`}
          confirmLabel="Confirm"
          destructive={pendingStatus === OrganizationStatus.Suspended || pendingStatus === OrganizationStatus.Closed}
          onConfirm={async () => { await mutation.mutateAsync(pendingStatus); }}
        />
      )}
      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={async () => {
          const fresh = await getOrganization(org.id);
          queryClient.setQueryData(platformKeys.organization(org.id), fresh);
          setStaleOpen(false);
          setPendingStatus(null);
          toast.info("Loaded latest version. Please retry.");
        }}
      />
    </div>
  );
}

// ── Danger Zone ──────────────────────────────────────────────────────────────

function OrgDangerZone({ org }: { org: Organization }) {
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);
  const slug = org.code.toLowerCase().replace(/_/g, "-");

  const closeMutation = useMutation({
    mutationFn: () =>
      updateOrganization(org.id, {
        status: OrganizationStatus.Closed,
        version: org.version,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(platformKeys.organization(org.id), updated);
      void queryClient.invalidateQueries({ queryKey: platformKeys.organizations() });
      toast.success("Organization closed");
    },
    onError: (err) => {
      if (isStaleResourceError(err)) {
        setStaleOpen(true);
        return;
      }
      toast.error("Failed to close organization");
    },
  });

  if (org.status === OrganizationStatus.Closed) return null;

  return (
    <>
      <DangerZone
        actions={[
          {
            label: "Close this organization",
            description: `Permanently closes ${org.name} and all schools within it. All users will lose access. This cannot be undone.`,
            confirmValue: slug,
            buttonLabel: "Close Organization",
            isLoading: closeMutation.isPending,
            onConfirm: () => { closeMutation.mutate(); },
          },
        ]}
      />
      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={async () => {
          const fresh = await getOrganization(org.id);
          queryClient.setQueryData(platformKeys.organization(org.id), fresh);
          setStaleOpen(false);
          toast.info("Loaded latest version. Please retry.");
        }}
      />
    </>
  );
}

// ── Tab root ────────────────────────────────────────────────────────────────

interface OrgSettingsTabProps {
  orgId: string;
}

export function OrgSettingsTab({ orgId }: OrgSettingsTabProps) {
  const { data: org, isLoading, isError } = useQuery({
    queryKey: platformKeys.organization(orgId),
    queryFn: () => getOrganization(orgId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !org) return <ErrorState title="Failed to load organization" />;

  return (
    <div className="space-y-8 max-w-2xl">
      <ProfileForm org={org} />
      <StatusSection org={org} />
      <OrgDangerZone org={org} />
    </div>
  );
}
