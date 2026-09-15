"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import {
  createCohort,
  deleteCohort,
  getAcademicClass,
  getAcademicYear,
  getCohort,
  listAcademicClasses,
  updateCohort,
} from "@/services";
import type { Cohort, CohortCreate, CohortUpdate } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { showMutationError } from "@/lib/error-messages";
import { RecordDialog, optionalString, optionalNumber } from "./record-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";

const COHORT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
];

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

export function CohortDetailPage({ cohortId }: { cohortId: string }) {
  const { activeSchool, years } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const cohortQuery = useQuery({
    queryKey: schoolKeys.cohort(schoolId, cohortId),
    queryFn: () => getCohort(cohortId),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const cohort = cohortQuery.data;

  const yearQuery = useQuery({
    queryKey: schoolKeys.year(schoolId, cohort?.academic_year_id ?? ""),
    queryFn: () => getAcademicYear(cohort!.academic_year_id),
    enabled: !!cohort?.academic_year_id && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const classQuery = useQuery({
    queryKey: schoolKeys.class(schoolId, cohort?.academic_class_id ?? ""),
    queryFn: () => getAcademicClass(cohort!.academic_class_id),
    enabled: !!cohort?.academic_class_id && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const classesQuery = useQuery({
    queryKey: schoolKeys.classes(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listAcademicClasses({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.academicClass.list),
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });

  const yearOptions = years.map((year) => ({ value: year.id, label: year.name }));
  const classOptions = (classesQuery.data ?? []).map((record) => ({
    value: record.id,
    label: record.name,
  }));

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["school", schoolId, "cohorts"] });
  }

  async function handleDelete() {
    if (!cohort) return;
    try {
      await deleteCohort(cohort.id, cohort.version);
      toast.success("Section deleted");
      setDeleteOpen(false);
      invalidate();
    } catch (error) {
      showMutationError(error);
    }
  }

  if (cohortQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cohortQuery.isError) {
    return <ErrorState error={cohortQuery.error} onRetry={() => void cohortQuery.refetch()} />;
  }

  const record = cohort!;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/academics/cohorts"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to sections
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-6" aria-hidden />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{record.name}</h1>
                <StatusBadge status={record.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-mono">{record.code}</span> ·{" "}
                {classQuery.data?.name ?? "…"} · {yearQuery.data?.name ?? "…"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <PermissionGate permission={PERMISSIONS.cohort.update}>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                Edit
              </Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.cohort.delete}>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            </PermissionGate>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
          <DetailRow label="Class" value={classQuery.data?.name ?? "—"} />
          <DetailRow label="Academic year" value={yearQuery.data?.name ?? "—"} />
          <DetailRow label="Capacity" value={record.capacity ?? "—"} />
          <DetailRow label="Status" value={<StatusBadge status={record.status} />} />
        </CardContent>
      </Card>

      {hasPermission(PERMISSIONS.cohort.update) ? (
        <RecordDialog<Cohort>
          open={editOpen}
          onOpenChange={setEditOpen}
          record={record}
          title="Section"
          description="A section of a class in an academic year."
          fields={[
            { name: "name", label: "Name", type: "text", required: true, placeholder: "Grade 6 A" },
            { name: "code", label: "Code", type: "text", required: true, placeholder: "G6A", createOnly: true },
            {
              name: "academic_year_id",
              label: "Academic year",
              type: "select",
              required: true,
              options: yearOptions,
            },
            {
              name: "academic_class_id",
              label: "Class",
              type: "select",
              required: true,
              options: classOptions,
            },
            { name: "capacity", label: "Capacity", type: "number", placeholder: "40" },
            { name: "status", label: "Status", type: "select", options: COHORT_STATUS_OPTIONS },
          ]}
          toFormValues={(value) => ({
            name: value.name,
            code: value.code,
            academic_year_id: value.academic_year_id,
            academic_class_id: value.academic_class_id,
            capacity: value.capacity != null ? String(value.capacity) : "",
            status: value.status,
          })}
          toCreatePayload={(values) => ({
            name: values.name as string,
            code: values.code as string,
            academic_year_id: values.academic_year_id as string,
            academic_class_id: values.academic_class_id as string,
            capacity: optionalNumber(values.capacity),
            status: optionalString(values.status) ?? undefined,
          })}
          toUpdatePayload={(values, value) => ({
            name: values.name as string,
            capacity: optionalNumber(values.capacity),
            status: optionalString(values.status) ?? undefined,
            version: value.version,
          })}
          onCreate={(payload) => createCohort(payload as unknown as CohortCreate)}
          onUpdate={(id, payload) => updateCohort(id, payload as unknown as CohortUpdate)}
          onSaved={invalidate}
          fetchRecord={getCohort}
        />
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete section"
        description={`Delete ${record.name}? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}