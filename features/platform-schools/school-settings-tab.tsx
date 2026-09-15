"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { getSchool, updateSchool } from "@/services/iam";
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
import { SchoolStatus, type School } from "@/types";
import { isStaleResourceError } from "@/lib/error-messages";

// ── Profile form ────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  short_name: z.string().nullable().optional(),
  board: z.string().nullable().optional(),
  affiliation_number: z.string().nullable().optional(),
  contact_email: z.string().email("Invalid email").nullable().optional().or(z.literal("")),
  contact_phone: z.string().nullable().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  locale: z.string().min(1, "Locale is required"),
});

type ProfileValues = z.infer<typeof profileSchema>;

function ProfileForm({ school }: { school: School }) {
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isDirty } } =
    useForm<ProfileValues>({
      resolver: zodResolver(profileSchema),
      defaultValues: {
        name: school.name,
        short_name: school.short_name ?? "",
        board: school.board ?? "",
        affiliation_number: school.affiliation_number ?? "",
        contact_email: school.contact_email ?? "",
        contact_phone: school.contact_phone ?? "",
        timezone: school.timezone,
        locale: school.locale,
      },
    });

  useEffect(() => {
    reset({
      name: school.name,
      short_name: school.short_name ?? "",
      board: school.board ?? "",
      affiliation_number: school.affiliation_number ?? "",
      contact_email: school.contact_email ?? "",
      contact_phone: school.contact_phone ?? "",
      timezone: school.timezone,
      locale: school.locale,
    });
  }, [school, reset]);

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) => {
      const payload: Record<string, unknown> = { ...values, version: school.version };
      (["short_name", "board", "affiliation_number", "contact_email", "contact_phone"] as const).forEach((k) => {
        if (payload[k] === "") payload[k] = null;
      });
      return updateSchool(school.id, payload as never);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(platformKeys.school(school.id), updated);
      void queryClient.invalidateQueries({ queryKey: platformKeys.schools() });
      toast.success("School updated");
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
        <FormSection title="School Profile">
          <div className="space-y-1.5">
            <Label>Slug (derived from Code)</Label>
            <Input value={school.code.toLowerCase().replace(/_/g, "-")} disabled className="font-mono bg-muted" />
            <p className="text-xs text-muted-foreground">Slug is derived from Code; Code is immutable.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="short_name">Short Name</Label>
            <Input id="short_name" {...register("short_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="board">Board</Label>
            <Input id="board" {...register("board")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="affiliation_number">Affiliation Number</Label>
            <Input id="affiliation_number" {...register("affiliation_number")} />
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
          const fresh = await getSchool(school.id);
          queryClient.setQueryData(platformKeys.school(school.id), fresh);
          setStaleOpen(false);
          toast.info("Loaded latest version. Please retry.");
        }}
      />
    </>
  );
}

// ── Status transitions ───────────────────────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, Array<{ label: string; nextStatus: string; destructive?: boolean }>> = {
  [SchoolStatus.Setup]: [
    { label: "Mark as Active", nextStatus: SchoolStatus.Active },
    { label: "Suspend", nextStatus: SchoolStatus.Suspended, destructive: true },
    { label: "Close", nextStatus: SchoolStatus.Closed, destructive: true },
  ],
  [SchoolStatus.Active]: [
    { label: "Suspend", nextStatus: SchoolStatus.Suspended, destructive: true },
    { label: "Close", nextStatus: SchoolStatus.Closed, destructive: true },
  ],
  [SchoolStatus.Suspended]: [
    { label: "Reactivate", nextStatus: SchoolStatus.Active },
    { label: "Close", nextStatus: SchoolStatus.Closed, destructive: true },
  ],
  [SchoolStatus.Closed]: [],
};

function StatusSection({ school }: { school: School }) {
  const queryClient = useQueryClient();
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [staleOpen, setStaleOpen] = useState(false);

  const transitions = STATUS_TRANSITIONS[school.status] ?? [];

  const mutation = useMutation({
    mutationFn: (nextStatus: string) =>
      updateSchool(school.id, { status: nextStatus as School["status"], version: school.version }),
    onSuccess: (updated) => {
      queryClient.setQueryData(platformKeys.school(school.id), updated);
      void queryClient.invalidateQueries({ queryKey: platformKeys.schools() });
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
          <StatusBadge status={school.status} />
          <span className="text-xs text-muted-foreground">— terminal state, no further transitions</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Status</h3>
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={school.status} />
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
          description={`This will change the school's status from ${school.status} to ${pendingStatus}.`}
          confirmLabel="Confirm"
          destructive={pendingStatus === SchoolStatus.Suspended || pendingStatus === SchoolStatus.Closed}
          onConfirm={async () => { await mutation.mutateAsync(pendingStatus); }}
        />
      )}
      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={async () => {
          const fresh = await getSchool(school.id);
          queryClient.setQueryData(platformKeys.school(school.id), fresh);
          setStaleOpen(false);
          setPendingStatus(null);
          toast.info("Loaded latest version. Please retry.");
        }}
      />
    </div>
  );
}

// ── Danger Zone ──────────────────────────────────────────────────────────────

function SchoolDangerZone({ school }: { school: School }) {
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);
  const slug = school.code.toLowerCase().replace(/_/g, "-");

  const closeMutation = useMutation({
    mutationFn: () =>
      updateSchool(school.id, {
        status: SchoolStatus.Closed,
        version: school.version,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(platformKeys.school(school.id), updated);
      void queryClient.invalidateQueries({ queryKey: platformKeys.schools() });
      toast.success("School closed");
    },
    onError: (err) => {
      if (isStaleResourceError(err)) {
        setStaleOpen(true);
        return;
      }
      toast.error("Failed to close school");
    },
  });

  if (school.status === SchoolStatus.Closed) return null;

  return (
    <>
      <DangerZone
        actions={[
          {
            label: "Close this school",
            description: `Permanently closes ${school.name}. All users will lose access. This cannot be undone.`,
            confirmValue: slug,
            buttonLabel: "Close School",
            isLoading: closeMutation.isPending,
            onConfirm: () => { closeMutation.mutate(); },
          },
        ]}
      />
      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={async () => {
          const fresh = await getSchool(school.id);
          queryClient.setQueryData(platformKeys.school(school.id), fresh);
          setStaleOpen(false);
          toast.info("Loaded latest version. Please retry.");
        }}
      />
    </>
  );
}

// ── Tab root ────────────────────────────────────────────────────────────────

interface SchoolSettingsTabProps {
  schoolId: string;
}

export function SchoolSettingsTab({ schoolId }: SchoolSettingsTabProps) {
  const { data: school, isLoading, isError } = useQuery({
    queryKey: platformKeys.school(schoolId),
    queryFn: () => getSchool(schoolId),
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

  if (isError || !school) return <ErrorState title="Failed to load school" />;

  return (
    <div className="space-y-8 max-w-2xl">
      <ProfileForm school={school} />
      <StatusSection school={school} />
      <SchoolDangerZone school={school} />
    </div>
  );
}
