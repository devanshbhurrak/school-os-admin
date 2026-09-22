"use client";

import { useQuery } from "@tanstack/react-query";
import { platformApiClient } from "@/services/platform-api-client";
import type { Person, AcademicYear, AcademicClass, Cohort, Subject } from "@/types";
import type { CursorPage } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/patterns/error-state";
import { AlertTriangle, ExternalLink } from "lucide-react";
import Link from "next/link";

function useSchoolData<T>(schoolId: string, path: string, key: string) {
  return useQuery({
    queryKey: ["platform", "schools", schoolId, key],
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<T>>(path, {
        headers: { "X-School-ID": schoolId },
        params: { limit: 100 },
      });
      return data;
    },
    enabled: !!schoolId,
  });
}

interface Issue {
  severity: "HIGH" | "MEDIUM" | "LOW";
  message: string;
  count: number;
  href: string;
}

export function SchoolDataQualityTab({ schoolId }: { schoolId: string }) {
  const personsQuery = useSchoolData<Person>(schoolId, "/persons", "persons");
  const yearsQuery = useSchoolData<AcademicYear>(schoolId, "/academic-years", "years");
  const classesQuery = useSchoolData<AcademicClass>(schoolId, "/academic-classes", "classes");
  const cohortsQuery = useSchoolData<Cohort>(schoolId, "/cohorts", "cohorts");
  const subjectsQuery = useSchoolData<Subject>(schoolId, "/subjects", "subjects");
  const classSubjectsQuery = useSchoolData<{ academic_class_id: string }>(schoolId, "/class-subjects", "class-subjects");

  const isLoading = personsQuery.isLoading || yearsQuery.isLoading || classesQuery.isLoading || cohortsQuery.isLoading || subjectsQuery.isLoading || classSubjectsQuery.isLoading;
  const isError = personsQuery.isError || yearsQuery.isError || classesQuery.isError || cohortsQuery.isError || subjectsQuery.isError || classSubjectsQuery.isError;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  if (isError) {
    // Don't show false "No issues" when data failed to load.
    const err = personsQuery.error ?? yearsQuery.error ?? classesQuery.error ?? cohortsQuery.error ?? subjectsQuery.error ?? classSubjectsQuery.error;
    return <ErrorState error={err} title="Failed to load data quality checks" compact />;
  }

  const persons = personsQuery.data?.items ?? [];
  const classes = classesQuery.data?.items ?? [];
  const cohorts = cohortsQuery.data?.items ?? [];
  const subjects = subjectsQuery.data?.items ?? [];
  const isTruncated = (personsQuery.data?.has_more || classesQuery.data?.has_more || cohortsQuery.data?.has_more || subjectsQuery.data?.has_more || classSubjectsQuery.data?.has_more) ?? false;

  const issues: Issue[] = [];
  const schoolPortal = process.env.NEXT_PUBLIC_SCHOOL_PORTAL_URL?.replace(/\/$/, "") ?? "";

  const withoutContact = persons.filter((p) => !p.primary_email && !p.primary_phone).length;
  if (withoutContact > 0) issues.push({ severity: "HIGH", message: `${withoutContact} persons without contact information`, count: withoutContact, href: schoolPortal ? `${schoolPortal}/people?schoolId=${schoolId}` : `/platform/schools/${schoolId}/people` });
  const withoutAddress = persons.filter((p) => !p.address_id).length;
  if (withoutAddress > 0) issues.push({ severity: "HIGH", message: `${withoutAddress} persons without an address`, count: withoutAddress, href: schoolPortal ? `${schoolPortal}/people?schoolId=${schoolId}` : `/platform/schools/${schoolId}/people` });
  const missingDob = persons.filter((p) => !p.date_of_birth).length;
  if (missingDob > 0) issues.push({ severity: "LOW", message: `${missingDob} persons missing date of birth`, count: missingDob, href: schoolPortal ? `${schoolPortal}/people?schoolId=${schoolId}` : `/platform/schools/${schoolId}/people` });
  const missingGender = persons.filter((p) => !p.gender).length;
  if (missingGender > 0) issues.push({ severity: "LOW", message: `${missingGender} persons missing gender`, count: missingGender, href: schoolPortal ? `${schoolPortal}/people?schoolId=${schoolId}` : `/platform/schools/${schoolId}/people` });

  const classSubjectLinks = classSubjectsQuery.data?.items ?? [];
  const classIdsWithSubjects = new Set(classSubjectLinks.map((cs) => cs.academic_class_id));
  const classesNoSubjects = classes.filter((c) => !classIdsWithSubjects.has(c.id)).length;
  if (classesNoSubjects > 0) {
    issues.push({ severity: "MEDIUM", message: `${classesNoSubjects} classes with no subject assignments`, count: classesNoSubjects, href: schoolPortal ? `${schoolPortal}/academics/subject-assignments?schoolId=${schoolId}` : `/platform/schools/${schoolId}/academics` });
  } else if (subjects.length === 0 && classes.length > 0) {
    issues.push({ severity: "MEDIUM", message: `${classes.length} classes with no subject assignments`, count: classes.length, href: schoolPortal ? `${schoolPortal}/academics/subject-assignments?schoolId=${schoolId}` : `/platform/schools/${schoolId}/academics` });
  }

  // Cohort capacity check: only flag cohorts whose capacity is set to 0
  // (likely mis-configured). We cannot check current occupancy vs capacity
  // since the Cohort model does not include a current_count field.
  const zeroCap = cohorts.filter((c) => c.capacity !== null && c.capacity === 0).length;
  if (zeroCap > 0) issues.push({ severity: "MEDIUM", message: `${zeroCap} cohorts with zero capacity`, count: zeroCap, href: schoolPortal ? `${schoolPortal}/academics/cohorts?schoolId=${schoolId}` : `/platform/schools/${schoolId}/academics` });

  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No issues detected. All checked data looks complete.</p>
          {isTruncated && <p className="mt-2 text-xs text-amber-600">Note: some data was truncated at 100 records — counts may be incomplete.</p>}
        </CardContent>
      </Card>
    );
  }

  const severityColor: Record<string, string> = {
    HIGH: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-300",
    MEDIUM: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-300",
    LOW: "bg-zinc-50 border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Data Quality</h3>
        <span className="text-xs text-muted-foreground">Issues Found: {issues.length}</span>
      </div>
      {isTruncated && <p className="text-xs text-amber-600">Some lists were truncated at 100 — issue counts are lower bounds.</p>}

      <div className="space-y-2">
        {issues.map((issue, i) => (
          <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border px-3 py-2.5 text-sm ${severityColor[issue.severity]}`}>
            <span className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="size-4 shrink-0" />
              <span className="font-mono text-xs font-medium">{issue.severity}</span>
              <span className="truncate">{issue.message}</span>
            </span>
            <Link href={issue.href} target={issue.href.startsWith("http") ? "_blank" : undefined} className="inline-flex items-center gap-1 text-xs font-medium hover:underline shrink-0">
              View <ExternalLink className="size-3" />
            </Link>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Each issue links to the relevant school portal area with context set (people, academics, etc.). No health score percentage is shown.</p>
    </div>
  );
}
