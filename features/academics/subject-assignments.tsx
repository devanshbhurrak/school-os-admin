"use client";

import { useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createClassSubject,
  deleteClassSubject,
  listAcademicClasses,
  listClassSubjects,
  listSubjects,
} from "@/services";
import type { ClassSubject, ClassSubjectCreate } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { mapFieldErrors, showMutationError } from "@/lib/error-messages";
import { classSubjectFormSchema } from "./schemas";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { PermissionGate } from "@/components/ui/permission-gate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssignSubjectFormValues {
  academic_class_id: string;
  subject_id: string;
  effective_from_year_id: string;
  effective_to_year_id: string;
}

function AssignSubjectDialog({
  open,
  onOpenChange,
  classOptions,
  subjectOptions,
  yearOptions,
  onAssigned,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classOptions: { value: string; label: string }[];
  subjectOptions: { value: string; label: string }[];
  yearOptions: { value: string; label: string }[];
  onAssigned: () => void;
}) {
  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssignSubjectFormValues>({
    resolver: zodResolver(classSubjectFormSchema) as Resolver<AssignSubjectFormValues>,
    defaultValues: {
      academic_class_id: "",
      subject_id: "",
      effective_from_year_id: "",
      effective_to_year_id: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: AssignSubjectFormValues) =>
      createClassSubject({
        academic_class_id: values.academic_class_id,
        subject_id: values.subject_id,
        effective_from_year_id: values.effective_from_year_id,
        effective_to_year_id: values.effective_to_year_id
          ? values.effective_to_year_id
          : null,
      } satisfies ClassSubjectCreate),
    onSuccess: () => {
      toast.success("Subject assigned");
      reset();
      onOpenChange(false);
      onAssigned();
    },
    onError: (error) => {
      if (mapFieldErrors(error, setError)) return;
      showMutationError(error);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign subject</DialogTitle>
          <DialogDescription>
            Assign a subject to a class for a range of academic years.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="as-class">Class *</Label>
            <Select
              value={watch("academic_class_id")}
              onValueChange={(value) => setValue("academic_class_id", value)}
            >
              <SelectTrigger id="as-class" className="w-full">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.academic_class_id ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.academic_class_id.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="as-subject">Subject *</Label>
            <Select
              value={watch("subject_id")}
              onValueChange={(value) => setValue("subject_id", value)}
            >
              <SelectTrigger id="as-subject" className="w-full">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.subject_id ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.subject_id.message}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="as-from">From year *</Label>
              <Select
                value={watch("effective_from_year_id")}
                onValueChange={(value) => setValue("effective_from_year_id", value)}
              >
                <SelectTrigger id="as-from" className="w-full">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.effective_from_year_id ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.effective_from_year_id.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="as-to">To year</Label>
              <Select
                value={watch("effective_to_year_id")}
                onValueChange={(value) => setValue("effective_to_year_id", value)}
              >
                <SelectTrigger id="as-to" className="w-full">
                  <SelectValue placeholder="Until further notice" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Assign subject
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SubjectAssignmentsPage() {
  const { activeSchool, years } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();

  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [yearFilter, setYearFilter] = useState<string>("ALL");
  const [assignOpen, setAssignOpen] = useState(false);
  const [removing, setRemoving] = useState<ClassSubject | null>(null);

  const yearOptions = years.map((year) => ({ value: year.id, label: year.name }));

  const classesQuery = useQuery({
    queryKey: schoolKeys.classes(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listAcademicClasses({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.academicClass.list),
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });
  const classOptions = (classesQuery.data ?? []).map((record) => ({
    value: record.id,
    label: record.name,
  }));

  const subjectsQuery = useQuery({
    queryKey: schoolKeys.subjects(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listSubjects({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.subject.list),
    staleTime: STALE_TIME.config,
    select: (data) => data.items,
  });
  const subjectOptions = (subjectsQuery.data ?? []).map((record) => ({
    value: record.id,
    label: record.name,
  }));

  const params = useMemo(() => {
    const value: Record<string, string | undefined> = {};
    if (classFilter !== "ALL") value.academic_class_id = classFilter;
    if (yearFilter !== "ALL") value.year_id = yearFilter;
    return value;
  }, [classFilter, yearFilter]);

  const assignmentsQuery = useQuery({
    queryKey: schoolKeys.classSubjects(schoolId, params),
    queryFn: () => listClassSubjects({ ...params, limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.classSubject.list),
    staleTime: STALE_TIME.frequent,
    select: (data) => data.items,
  });

  const assignments = assignmentsQuery.data ?? [];
  const classNames = new Map((classesQuery.data ?? []).map((c) => [c.id, c.name]));
  const subjectNames = new Map((subjectsQuery.data ?? []).map((s) => [s.id, s.name]));
  const yearNames = new Map(years.map((y) => [y.id, y.name]));

  const canAssign = hasPermission(PERMISSIONS.classSubject.create);

  function invalidate() {
    void queryClient.invalidateQueries({ queryKey: ["school", schoolId, "class-subjects"] });
  }

  async function handleRemove() {
    if (!removing) return;
    try {
      await deleteClassSubject(removing.id);
      toast.success("Assignment removed");
      setRemoving(null);
      invalidate();
    } catch (error) {
      showMutationError(error);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by class"
          >
            <option value="ALL">All classes</option>
            {classOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="h-8 rounded-lg border bg-background px-2 text-sm outline-none"
            aria-label="Filter by year"
          >
            <option value="ALL">All years</option>
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <PermissionGate permission={PERMISSIONS.classSubject.create}>
          <Button onClick={() => setAssignOpen(true)} className="sm:ml-auto">
            <Plus className="size-4" />
            Assign subject
          </Button>
        </PermissionGate>
      </div>

      {assignmentsQuery.isError ? (
        <ErrorState
          error={assignmentsQuery.error}
          onRetry={() => void assignmentsQuery.refetch()}
        />
      ) : assignmentsQuery.isPending ? (
        <div className="space-y-2">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      ) : assignments.length ? (
        <ul className="divide-y overflow-hidden rounded-lg border bg-background">
          {assignments.map((assignment) => (
            <li
              key={assignment.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <BookOpen className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {subjectNames.get(assignment.subject_id) ?? "Unknown subject"}
                  </p>
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    {classNames.get(assignment.academic_class_id) ?? "Unknown class"}
                    <Badge variant="secondary" className="gap-0.5">
                      {yearNames.get(assignment.effective_from_year_id) ?? "?"}
                      {assignment.effective_to_year_id
                        ? ` – ${yearNames.get(assignment.effective_to_year_id) ?? "?"}`
                        : " onwards"}
                    </Badge>
                  </p>
                </div>
              </div>
              <PermissionGate permission={PERMISSIONS.classSubject.delete}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove assignment"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setRemoving(assignment)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </PermissionGate>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={BookOpen}
          title="No subject assignments"
          description={
            canAssign
              ? "Assign subjects to classes to set up the curriculum."
              : "No subjects are assigned to classes yet."
          }
          action={
            canAssign ? (
              <Button onClick={() => setAssignOpen(true)}>
                <Plus className="size-4" />
                Assign subject
              </Button>
            ) : undefined
          }
        />
      )}

      {canAssign ? (
        <AssignSubjectDialog
          open={assignOpen}
          onOpenChange={setAssignOpen}
          classOptions={classOptions}
          subjectOptions={subjectOptions}
          yearOptions={yearOptions}
          onAssigned={invalidate}
        />
      ) : null}

      <ConfirmDialog
        open={!!removing}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
        title="Remove subject assignment"
        description={
          removing
            ? `Remove ${subjectNames.get(removing.subject_id) ?? "this subject"} from ${classNames.get(removing.academic_class_id) ?? "this class"}?`
            : undefined
        }
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemove}
      />
    </div>
  );
}