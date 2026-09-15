"use client";

import Link from "next/link";
import { BookOpen, CalendarDays, CalendarRange, School, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import type { DataTableFeatures } from "@/components/ui/data-table";
import {
  AcademicYear,
  AcademicYearCreate,
  AcademicYearUpdate,
  AcademicTerm,
  AcademicTermCreate,
  AcademicTermUpdate,
  AcademicClass,
  AcademicClassCreate,
  AcademicClassUpdate,
  Subject,
  SubjectCreate,
  SubjectUpdate,
  Cohort,
  CohortCreate,
  CohortUpdate,
} from "@/types";
import {
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getAcademicYear,
  createAcademicTerm,
  updateAcademicTerm,
  deleteAcademicTerm,
  listAcademicYears,
  listAcademicTerms,
  createAcademicClass,
  updateAcademicClass,
  deleteAcademicClass,
  listAcademicClasses,
  createSubject,
  updateSubject,
  deleteSubject,
  listSubjects,
  createCohort,
  updateCohort,
  deleteCohort,
  listCohorts,
  getCohort,
  getAcademicClass,
  getSubject,
} from "@/services";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { schoolKeys } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { SUBJECT_TYPE_LABELS } from "@/lib/display";
import { EntityListPage, type EntityListConfig } from "./entity-list-page";
import { type FieldConfig, optionalString, optionalNumber } from "./record-dialog";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";

function statusOptions(labels: Record<string, string>): { value: string; label: string }[] {
  return Object.entries(labels).map(([value, label]) => ({ value, label }));
}

const YEAR_STATUS_OPTIONS = statusOptions({ DRAFT: "Draft", ACTIVE: "Active", CLOSED: "Closed" });
const TERM_STATUS_OPTIONS = statusOptions({ ACTIVE: "Active", CLOSED: "Closed" });
const CLASS_STATUS_OPTIONS = statusOptions({ ACTIVE: "Active", ARCHIVED: "Archived" });
const SUBJECT_STATUS_OPTIONS = CLASS_STATUS_OPTIONS;
const COHORT_STATUS_OPTIONS = CLASS_STATUS_OPTIONS;

function yearColumns(activeYearId?: string): ColumnDef<DataTableFeatures, AcademicYear, unknown>[] {
  return [
    {
      id: "name",
      accessorFn: (y) => y.name,
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/academics/years/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.original.name}
          </Link>
          {row.original.is_current ? <Badge>Current</Badge> : null}
          {activeYearId === row.original.id ? (
            <Badge variant="outline">Selected</Badge>
          ) : null}
        </div>
      ),
    },
    {
      id: "code",
      accessorFn: (y) => y.code,
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
    },
    {
      id: "period",
      accessorFn: (y) => y.start_date,
      header: "Period",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.start_date)} – {formatDate(row.original.end_date)}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (y) => y.status,
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];
}

export function YearsPage() {
  const { activeYear } = useSchoolContextValue();
  const config: EntityListConfig<AcademicYear> = {
    permissions: {
      list: PERMISSIONS.academicYear.list,
      create: PERMISSIONS.academicYear.create,
      update: PERMISSIONS.academicYear.update,
      delete: PERMISSIONS.academicYear.delete,
    },
    queryKey: (schoolId, filters) => schoolKeys.years(schoolId, filters),
    listFn: listAcademicYears,
    columns: yearColumns(activeYear?.id),
    mobileCard: (year) => (
      <Link
        href={`/academics/years/${year.id}`}
        className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate font-medium">
            {year.name}
            {year.is_current ? <Badge>Current</Badge> : null}
          </p>
          <p className="truncate text-sm text-muted-foreground">
            {formatDate(year.start_date)} – {formatDate(year.end_date)}
          </p>
        </div>
        <StatusBadge status={year.status} />
      </Link>
    ),
    rowHref: (year) => `/academics/years/${year.id}`,
    dialog: {
      title: "Academic year",
      description: "A school year with start and end dates.",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, placeholder: "2026–27" },
        { name: "code", label: "Code", type: "text", required: true, placeholder: "2026-27", createOnly: true },
        { name: "start_date", label: "Start date", type: "date", required: true },
        { name: "end_date", label: "End date", type: "date", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: YEAR_STATUS_OPTIONS,
        },
        { name: "is_current", label: "Current year", type: "switch", help: "Mark as the active school year." },
      ],
      toFormValues: (year) => ({
        name: year.name,
        code: year.code,
        start_date: year.start_date,
        end_date: year.end_date,
        status: year.status,
        is_current: year.is_current,
      }),
      toCreatePayload: (values) => ({
        name: values.name as string,
        code: values.code as string,
        start_date: values.start_date as string,
        end_date: values.end_date as string,
        status: optionalString(values.status) ?? undefined,
        is_current: values.is_current === true,
      }),
      toUpdatePayload: (values, year) => ({
        name: values.name as string,
        start_date: values.start_date as string,
        end_date: values.end_date as string,
        status: optionalString(values.status) ?? undefined,
        is_current: values.is_current === true,
        version: year.version,
      }),
      onCreate: (payload) => createAcademicYear(payload as unknown as AcademicYearCreate),
      onUpdate: (id, payload) => updateAcademicYear(id, payload as unknown as AcademicYearUpdate),
      fetchRecord: getAcademicYear,
    },
    onDelete: (year) => deleteAcademicYear(year.id, year.version),
    deleteConfirm: (year) => ({
      title: "Delete academic year",
      description: (
        <>
          Delete <span className="font-medium">{year.name}</span>? Terms and
          sections linked to this year may be affected.
        </>
      ),
    }),
    recordName: (year) => year.name,
    emptyTitle: "No academic years",
    emptyDescription: "Create your first academic year to start structuring the school calendar.",
    emptyActionLabel: "Add academic year",
    emptyIcon: CalendarRange,
    invalidatePrefixes: ["academic-years"],
  };
  return <EntityListPage config={config} />;
}

function termFields(yearOptions: { value: string; label: string }[]): FieldConfig[] {
  return [
    { name: "name", label: "Name", type: "text", required: true, placeholder: "Term 1" },
    { name: "code", label: "Code", type: "text", required: true, placeholder: "T1", createOnly: true },
    {
      name: "academic_year_id",
      label: "Academic year",
      type: "select",
      required: true,
      options: yearOptions,
    },
    { name: "start_date", label: "Start date", type: "date", required: true },
    { name: "end_date", label: "End date", type: "date", required: true },
    { name: "status", label: "Status", type: "select", options: TERM_STATUS_OPTIONS },
  ];
}

function termColumns(): ColumnDef<DataTableFeatures, AcademicTerm, unknown>[] {
  return [
    {
      id: "name",
      accessorFn: (t) => t.name,
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "code",
      accessorFn: (t) => t.code,
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
    },
    {
      id: "period",
      accessorFn: (t) => t.start_date,
      header: "Period",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.start_date)} – {formatDate(row.original.end_date)}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (t) => t.status,
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];
}

export function TermsPage() {
  const { years } = useSchoolContextValue();
  const yearOptions = years.map((year) => ({ value: year.id, label: year.name }));
  const fields = termFields(yearOptions);

  const config: EntityListConfig<AcademicTerm> = {
    permissions: {
      list: PERMISSIONS.academicTerm.list,
      create: PERMISSIONS.academicTerm.create,
      update: PERMISSIONS.academicTerm.update,
      delete: PERMISSIONS.academicTerm.delete,
    },
    queryKey: (schoolId, filters) => schoolKeys.terms(schoolId, filters),
    listFn: (params) => listAcademicTerms(params),
    columns: termColumns(),
    mobileCard: (term) => (
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{term.name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {formatDate(term.start_date)} – {formatDate(term.end_date)}
          </p>
        </div>
        <StatusBadge status={term.status} />
      </div>
    ),
    filters: [{ key: "academic_year_id", label: "All years", options: yearOptions }],
    dialog: {
      title: "Term",
      description: "A term within an academic year.",
      fields,
      toFormValues: (term) => ({
        name: term.name,
        code: term.code,
        academic_year_id: term.academic_year_id,
        start_date: term.start_date,
        end_date: term.end_date,
        status: term.status,
      }),
      toCreatePayload: (values) => ({
        name: values.name as string,
        code: values.code as string,
        academic_year_id: values.academic_year_id as string,
        start_date: values.start_date as string,
        end_date: values.end_date as string,
        status: optionalString(values.status) ?? undefined,
      }),
      toUpdatePayload: (values, term) => ({
        name: values.name as string,
        start_date: values.start_date as string,
        end_date: values.end_date as string,
        status: optionalString(values.status) ?? undefined,
        version: term.version,
      }),
      onCreate: (payload) => createAcademicTerm(payload as unknown as AcademicTermCreate),
      onUpdate: (id, payload) => updateAcademicTerm(id, payload as unknown as AcademicTermUpdate),
    },
    onDelete: (term) => deleteAcademicTerm(term.id, term.version),
    deleteConfirm: (term) => ({
      title: "Delete term",
      description: `Delete ${term.name}? This cannot be undone.`,
    }),
    recordName: (term) => term.name,
    emptyTitle: "No terms",
    emptyDescription: "Terms divide the academic year into periods.",
    emptyActionLabel: "Add term",
    emptyIcon: CalendarDays,
    invalidatePrefixes: ["academic-terms"],
  };
  return <EntityListPage config={config} />;
}

function classColumns(): ColumnDef<DataTableFeatures, AcademicClass, unknown>[] {
  return [
    {
      id: "name",
      accessorFn: (c) => c.name,
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "code",
      accessorFn: (c) => c.code,
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
    },
    {
      id: "description",
      accessorFn: (c) => c.description ?? "",
      header: "Description",
      cell: ({ row }) => (
        <span className="block max-w-64 truncate text-sm text-muted-foreground">
          {row.original.description ?? "—"}
        </span>
      ),
    },
    {
      id: "status",
      accessorFn: (c) => c.status,
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];
}

export function ClassesPage() {
  const config: EntityListConfig<AcademicClass> = {
    permissions: {
      list: PERMISSIONS.academicClass.list,
      create: PERMISSIONS.academicClass.create,
      update: PERMISSIONS.academicClass.update,
      delete: PERMISSIONS.academicClass.delete,
    },
    queryKey: (schoolId, filters) => schoolKeys.classes(schoolId, filters),
    listFn: (params) => listAcademicClasses(params),
    columns: classColumns(),
    mobileCard: (record) => (
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{record.name}</p>
          <p className="truncate font-mono text-sm text-muted-foreground">{record.code}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>
    ),
    dialog: {
      title: "Class",
      description: "A class group, e.g. Grade 6.",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, placeholder: "Grade 6" },
        { name: "code", label: "Code", type: "text", required: true, placeholder: "G6", createOnly: true },
        { name: "description", label: "Description", type: "text", wide: true },
        { name: "sort_order", label: "Sort order", type: "number", placeholder: "10" },
        { name: "status", label: "Status", type: "select", options: CLASS_STATUS_OPTIONS },
      ],
      toFormValues: (record) => ({
        name: record.name,
        code: record.code,
        description: record.description ?? "",
        sort_order: record.sort_order != null ? String(record.sort_order) : "",
        status: record.status,
      }),
      toCreatePayload: (values) => ({
        name: values.name as string,
        code: values.code as string,
        description: optionalString(values.description),
        sort_order: optionalNumber(values.sort_order) ?? undefined,
        status: optionalString(values.status) ?? undefined,
      }),
      toUpdatePayload: (values, record) => ({
        name: values.name as string,
        description: optionalString(values.description),
        sort_order: optionalNumber(values.sort_order) ?? undefined,
        status: optionalString(values.status) ?? undefined,
        version: record.version,
      }),
      onCreate: (payload) => createAcademicClass(payload as unknown as AcademicClassCreate),
      onUpdate: (id, payload) => updateAcademicClass(id, payload as unknown as AcademicClassUpdate),
      fetchRecord: getAcademicClass,
    },
    onDelete: (record) => deleteAcademicClass(record.id, record.version),
    deleteConfirm: (record) => ({
      title: "Delete class",
      description: `Delete ${record.name}? This cannot be undone.`,
    }),
    recordName: (record) => record.name,
    emptyTitle: "No classes",
    emptyDescription: "Classes group students, e.g. Grade 6, Grade 7.",
    emptyActionLabel: "Add class",
    emptyIcon: School,
    invalidatePrefixes: ["academic-classes"],
  };
  return <EntityListPage config={config} />;
}

function subjectColumns(): ColumnDef<DataTableFeatures, Subject, unknown>[] {
  return [
    {
      id: "name",
      accessorFn: (s) => s.name,
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "code",
      accessorFn: (s) => s.code,
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
    },
    {
      id: "type",
      accessorFn: (s) => s.subject_type,
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {SUBJECT_TYPE_LABELS[row.original.subject_type] ?? row.original.subject_type}
        </Badge>
      ),
    },
    {
      id: "status",
      accessorFn: (s) => s.status,
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ];
}

export function SubjectsPage() {
  const config: EntityListConfig<Subject> = {
    permissions: {
      list: PERMISSIONS.subject.list,
      create: PERMISSIONS.subject.create,
      update: PERMISSIONS.subject.update,
      delete: PERMISSIONS.subject.delete,
    },
    queryKey: (schoolId, filters) => schoolKeys.subjects(schoolId, filters),
    listFn: (params) => listSubjects(params),
    columns: subjectColumns(),
    mobileCard: (record) => (
      <div className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{record.name}</p>
          <p className="truncate font-mono text-sm text-muted-foreground">{record.code}</p>
        </div>
        <StatusBadge status={record.status} />
      </div>
    ),
    dialog: {
      title: "Subject",
      description: "A subject taught at the school.",
      fields: [
        { name: "name", label: "Name", type: "text", required: true, placeholder: "Mathematics" },
        { name: "code", label: "Code", type: "text", required: true, placeholder: "MATH", createOnly: true },
        { name: "description", label: "Description", type: "text", wide: true },
        {
          name: "subject_type",
          label: "Subject type",
          type: "select",
          required: true,
          options: statusOptions(SUBJECT_TYPE_LABELS),
        },
        { name: "status", label: "Status", type: "select", options: SUBJECT_STATUS_OPTIONS },
      ],
      toFormValues: (record) => ({
        name: record.name,
        code: record.code,
        description: record.description ?? "",
        subject_type: record.subject_type,
        status: record.status,
      }),
      toCreatePayload: (values) => ({
        name: values.name as string,
        code: values.code as string,
        description: optionalString(values.description),
        subject_type: values.subject_type as string,
        status: optionalString(values.status) ?? undefined,
      }),
      toUpdatePayload: (values, record) => ({
        name: values.name as string,
        description: optionalString(values.description),
        subject_type: values.subject_type as string,
        status: optionalString(values.status) ?? undefined,
        version: record.version,
      }),
      onCreate: (payload) => createSubject(payload as unknown as SubjectCreate),
      onUpdate: (id, payload) => updateSubject(id, payload as unknown as SubjectUpdate),
      fetchRecord: getSubject,
    },
    onDelete: (record) => deleteSubject(record.id, record.version),
    deleteConfirm: (record) => ({
      title: "Delete subject",
      description: `Delete ${record.name}? This cannot be undone.`,
    }),
    recordName: (record) => record.name,
    emptyTitle: "No subjects",
    emptyDescription: "Subjects are taught across classes, e.g. Mathematics, Science.",
    emptyActionLabel: "Add subject",
    emptyIcon: BookOpen,
    invalidatePrefixes: ["subjects"],
  };
  return <EntityListPage config={config} />;
}

export function CohortsPage() {
  const { years, activeSchool } = useSchoolContextValue();
  const { hasPermission } = usePermissions();
  const schoolId = activeSchool?.id ?? "";
  const yearOptions = years.map((year) => ({ value: year.id, label: year.name }));

  const classesQuery = useQuery({
    queryKey: schoolKeys.classes(schoolId, { limit: MAX_PAGE_SIZE }),
    queryFn: () => listAcademicClasses({ limit: MAX_PAGE_SIZE }),
    enabled: !!schoolId && hasPermission(PERMISSIONS.academicClass.list),
    staleTime: 5 * 60_000,
    select: (data) => data.items,
  });
  const classOptions = (classesQuery.data ?? []).map((record) => ({
    value: record.id,
    label: record.name,
  }));

  const fields: FieldConfig[] = [
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
  ];

  const config: EntityListConfig<Cohort> = {
    permissions: {
      list: PERMISSIONS.cohort.list,
      create: PERMISSIONS.cohort.create,
      update: PERMISSIONS.cohort.update,
      delete: PERMISSIONS.cohort.delete,
    },
    queryKey: (schoolId, filters) => schoolKeys.cohorts(schoolId, filters),
    listFn: (params) => listCohorts(params),
    columns: [
      {
        id: "name",
        accessorFn: (c) => c.name,
        header: "Name",
        cell: ({ row }) => (
          <Link href={`/academics/cohorts/${row.original.id}`} className="font-medium hover:underline">
            {row.original.name}
          </Link>
        ),
      },
      {
        id: "code",
        accessorFn: (c) => c.code,
        header: "Code",
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.code}</span>,
      },
      {
        id: "capacity",
        accessorFn: (c) => c.capacity ?? "",
        header: "Capacity",
        cell: ({ row }) => <span className="text-sm">{row.original.capacity ?? "—"}</span>,
      },
      {
        id: "status",
        accessorFn: (c) => c.status,
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
    ],
    mobileCard: (record) => (
      <Link
        href={`/academics/cohorts/${record.id}`}
        className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3"
      >
        <div className="min-w-0">
          <p className="truncate font-medium">{record.name}</p>
          <p className="truncate font-mono text-sm text-muted-foreground">{record.code}</p>
        </div>
        <StatusBadge status={record.status} />
      </Link>
    ),
    rowHref: (record) => `/academics/cohorts/${record.id}`,
    filters: [
      { key: "academic_year_id", label: "All years", options: yearOptions },
      { key: "academic_class_id", label: "All classes", options: classOptions },
    ],
    dialog: {
      title: "Section",
      description: "A section of a class in an academic year.",
      fields,
      toFormValues: (record) => ({
        name: record.name,
        code: record.code,
        academic_year_id: record.academic_year_id,
        academic_class_id: record.academic_class_id,
        capacity: record.capacity != null ? String(record.capacity) : "",
        status: record.status,
      }),
      toCreatePayload: (values) => ({
        name: values.name as string,
        code: values.code as string,
        academic_year_id: values.academic_year_id as string,
        academic_class_id: values.academic_class_id as string,
        capacity: optionalNumber(values.capacity),
        status: optionalString(values.status) ?? undefined,
      }),
      toUpdatePayload: (values, record) => ({
        name: values.name as string,
        capacity: optionalNumber(values.capacity),
        status: optionalString(values.status) ?? undefined,
        version: record.version,
      }),
      onCreate: (payload) => createCohort(payload as unknown as CohortCreate),
      onUpdate: (id, payload) => updateCohort(id, payload as unknown as CohortUpdate),
      fetchRecord: getCohort,
    },
    onDelete: (record) => deleteCohort(record.id, record.version),
    deleteConfirm: (record) => ({
      title: "Delete section",
      description: `Delete ${record.name}? This cannot be undone.`,
    }),
    recordName: (record) => record.name,
    emptyTitle: "No sections",
    emptyDescription: "Sections group students of a class in a year.",
    emptyActionLabel: "Add section",
    emptyIcon: Users,
    invalidatePrefixes: ["cohorts"],
  };
  return <EntityListPage config={config} />;
}