"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CalendarRange, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createAcademicTerm,
  deleteAcademicTerm,
  getAcademicYear,
  listAcademicTerms,
  updateAcademicTerm,
  getAcademicTerm,
  createAcademicYear,
  updateAcademicYear,
} from "@/services";
import type {
  AcademicTerm,
  AcademicTermCreate,
  AcademicTermUpdate,
  AcademicYear,
  AcademicYearCreate,
  AcademicYearUpdate,
} from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { showMutationError } from "@/lib/error-messages";
import { RecordDialog, type FieldConfig, optionalString } from "./record-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PermissionGate } from "@/components/ui/permission-gate";

const TERM_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
];

const YEAR_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "CLOSED", label: "Closed" },
];

export function YearDetailPage({ yearId }: { yearId: string }) {
  const { activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [termDialog, setTermDialog] = useState<{ open: boolean; record?: AcademicTerm | null }>({ open: false });
  const [yearEditOpen, setYearEditOpen] = useState(false);
  const [deleting, setDeleting] = useState<AcademicTerm | null>(null);

  const yearQuery = useQuery({
    queryKey: schoolKeys.year(schoolId, yearId),
    queryFn: () => getAcademicYear(yearId),
    enabled: !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  const termsQuery = useQuery({
    queryKey: schoolKeys.terms(schoolId, { academic_year_id: yearId }),
    queryFn: () => listAcademicTerms({ academic_year_id: yearId, limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.academicTerm.list),
    staleTime: STALE_TIME.frequent,
    select: (data) => data.items,
  });

  const termFields = useMemo<FieldConfig[]>(
    () => [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Term 1" },
      { name: "code", label: "Code", type: "text", required: true, placeholder: "T1", createOnly: true },
      { name: "start_date", label: "Start date", type: "date", required: true },
      { name: "end_date", label: "End date", type: "date", required: true },
      { name: "status", label: "Status", type: "select", options: TERM_STATUS_OPTIONS },
    ],
    [],
  );

  const canCreateTerm = hasPermission(PERMISSIONS.academicTerm.create);
  const canEditYear = hasPermission(PERMISSIONS.academicYear.update);

  function invalidateTerms() {
    void queryClient.invalidateQueries({
      queryKey: schoolKeys.terms(schoolId, { academic_year_id: yearId }),
    });
  }

  function invalidateYear() {
    void queryClient.invalidateQueries({
      queryKey: ["school", schoolId, "academic-years"],
    });
  }

  async function handleDeleteTerm() {
    if (!deleting) return;
    try {
      await deleteAcademicTerm(deleting.id, deleting.version);
      toast.success("Term deleted");
      setDeleting(null);
      invalidateTerms();
    } catch (error) {
      showMutationError(error);
    }
  }

  if (yearQuery.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-40" />
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardContent>
        </Card>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (yearQuery.isError) {
    return <ErrorState error={yearQuery.error} onRetry={() => void yearQuery.refetch()} />;
  }

  const year = yearQuery.data!;
  const terms = termsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/academics/years"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to academic years
        </Link>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarRange className="size-6" aria-hidden />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">{year.name}</h1>
                {year.is_current ? <Badge>Current</Badge> : null}
                <StatusBadge status={year.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {formatDate(year.start_date)} – {formatDate(year.end_date)} ·{" "}
                <span className="font-mono">{year.code}</span>
              </p>
            </div>
          </div>
          <PermissionGate permission={PERMISSIONS.academicYear.update}>
            <Button variant="outline" onClick={() => setYearEditOpen(true)} className="sm:ml-auto">
              <Pencil className="size-4" />
              Edit year
            </Button>
          </PermissionGate>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Terms</CardTitle>
          <PermissionGate permission={PERMISSIONS.academicTerm.create}>
            <Button size="sm" variant="outline" onClick={() => setTermDialog({ open: true, record: null })}>
              <Plus className="size-4" />
              Add term
            </Button>
          </PermissionGate>
        </CardHeader>
        <CardContent>
          {termsQuery.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : terms.length ? (
            <ul className="divide-y">
              {terms.map((term) => (
                <li key={term.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{term.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(term.start_date)} – {formatDate(term.end_date)} ·{" "}
                      <span className="font-mono">{term.code}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={term.status} />
                    <PermissionGate permission={PERMISSIONS.academicTerm.update}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Edit term"
                        onClick={() => setTermDialog({ open: true, record: term })}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission={PERMISSIONS.academicTerm.delete}>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete term"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleting(term)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </PermissionGate>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              compact
              icon={CalendarRange}
              title="No terms"
              description={
                canCreateTerm
                  ? "Add terms to divide this academic year into periods."
                  : "No terms have been added to this year yet."
              }
            />
          )}
        </CardContent>
      </Card>

      {canEditYear ? (
        <RecordDialog<AcademicYear>
          open={yearEditOpen}
          onOpenChange={setYearEditOpen}
          record={year}
          title="Academic year"
          description="A school year with start and end dates."
          fields={[
            { name: "name", label: "Name", type: "text", required: true, placeholder: "2026–27" },
            { name: "code", label: "Code", type: "text", required: true, placeholder: "2026-27", createOnly: true },
            { name: "start_date", label: "Start date", type: "date", required: true },
            { name: "end_date", label: "End date", type: "date", required: true },
            { name: "status", label: "Status", type: "select", options: YEAR_STATUS_OPTIONS },
            { name: "is_current", label: "Current year", type: "switch", help: "Mark as the active school year." },
          ]}
          toFormValues={(record) => ({
            name: record.name,
            code: record.code,
            start_date: record.start_date,
            end_date: record.end_date,
            status: record.status,
            is_current: record.is_current,
          })}
          toCreatePayload={(values) => ({
            name: values.name as string,
            code: values.code as string,
            start_date: values.start_date as string,
            end_date: values.end_date as string,
            status: optionalString(values.status) ?? undefined,
            is_current: values.is_current === true,
          })}
          toUpdatePayload={(values, record) => ({
            name: values.name as string,
            start_date: values.start_date as string,
            end_date: values.end_date as string,
            status: optionalString(values.status) ?? undefined,
            is_current: values.is_current === true,
            version: record.version,
          })}
          onCreate={(payload) => createAcademicYear(payload as unknown as AcademicYearCreate)}
          onUpdate={(id, payload) => updateAcademicYear(id, payload as unknown as AcademicYearUpdate)}
          onSaved={invalidateYear}
          fetchRecord={getAcademicYear}
        />
      ) : null}

      {canCreateTerm ? (
        <RecordDialog<AcademicTerm>
          open={termDialog.open}
          onOpenChange={(open) => setTermDialog((prev) => ({ ...prev, open }))}
          record={termDialog.record ?? null}
          title="Term"
          description={`A term in ${year.name}.`}
          fields={termFields}
          toFormValues={(term) => ({
            name: term.name,
            code: term.code,
            start_date: term.start_date,
            end_date: term.end_date,
            status: term.status,
          })}
          toCreatePayload={(values) => ({
            name: values.name as string,
            code: values.code as string,
            academic_year_id: yearId,
            start_date: values.start_date as string,
            end_date: values.end_date as string,
            status: optionalString(values.status) ?? undefined,
          })}
          toUpdatePayload={(values, term) => ({
            name: values.name as string,
            start_date: values.start_date as string,
            end_date: values.end_date as string,
            status: optionalString(values.status) ?? undefined,
            version: term.version,
          })}
          onCreate={(payload) => createAcademicTerm(payload as unknown as AcademicTermCreate)}
          onUpdate={(id, payload) => updateAcademicTerm(id, payload as unknown as AcademicTermUpdate)}
          onSaved={invalidateTerms}
          fetchRecord={getAcademicTerm}
        />
      ) : null}

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete term"
        description={deleting ? `Delete ${deleting.name}? This cannot be undone.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteTerm}
      />
    </div>
  );
}