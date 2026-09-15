"use client";

import { useQuery } from "@tanstack/react-query";
import { platformApiClient } from "@/services/platform-api-client";
import type { AcademicYear, AcademicClass, Subject, Cohort, AcademicTerm } from "@/types";
import type { CursorPage } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function useSchoolScopedQuery<T>(schoolId: string, path: string, key: string, params: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["platform", "schools", schoolId, key, params],
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<T>>(path, {
        headers: { "X-School-ID": schoolId },
        params,
      });
      return data;
    },
    enabled: !!schoolId,
  });
}

export function SchoolAcademicsTab({ schoolId }: { schoolId: string }) {
  const yearsQuery = useSchoolScopedQuery<AcademicYear>(schoolId, "/academic-years", "years", { limit: 50 });
  const termsQuery = useSchoolScopedQuery<AcademicTerm>(schoolId, "/academic-terms", "terms", { limit: 100 });
  const classesQuery = useSchoolScopedQuery<AcademicClass>(schoolId, "/academic-classes", "classes", { limit: 100 });
  const subjectsQuery = useSchoolScopedQuery<Subject>(schoolId, "/subjects", "subjects", { limit: 100 });
  const cohortsQuery = useSchoolScopedQuery<Cohort>(schoolId, "/cohorts", "cohorts", { limit: 100 });

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-amber-50/50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/20 dark:text-amber-300">
        ⓘ Read-only view. School admins manage academic data.
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Academic Years</CardTitle>
        </CardHeader>
        <CardContent>
          {yearsQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : yearsQuery.isError ? (
            <p className="text-sm text-muted-foreground">Failed to load academic years.</p>
          ) : (yearsQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No academic years.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-xs text-muted-foreground">
                    <th className="py-2 text-left font-medium">Code</th>
                    <th className="py-2 text-left font-medium">Name</th>
                    <th className="py-2 text-left font-medium">Status</th>
                    <th className="py-2 text-left font-medium">Current</th>
                    <th className="py-2 text-left font-medium">Terms</th>
                  </tr>
                </thead>
                <tbody>
                  {yearsQuery.data?.items.map((y) => {
                    const termsForYear = (termsQuery.data?.items ?? []).filter((t) => t.academic_year_id === y.id).length;
                    return (
                      <tr key={y.id} className="border-b last:border-0">
                        <td className="py-2 font-mono text-xs">{y.code}</td>
                        <td className="py-2">{y.name}</td>
                        <td className="py-2"><Badge variant="outline">{y.status}</Badge></td>
                        <td className="py-2">{y.is_current ? "✓" : "—"}</td>
                        <td className="py-2 text-xs text-muted-foreground">{termsQuery.isLoading ? "…" : termsForYear}{termsQuery.data?.has_more ? "+" : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {yearsQuery.data?.has_more && <p className="text-xs text-amber-600 mt-2">More years exist (truncated at 50).</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {classesQuery.isLoading ? (
              <Skeleton className="h-20" />
            ) : classesQuery.isError ? (
              <p className="text-sm text-muted-foreground">Failed to load.</p>
            ) : (classesQuery.data?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No classes.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {classesQuery.data?.items.map((c) => (
                  <span key={c.id} className="rounded-full border px-2.5 py-1 text-xs">
                    {c.name}
                  </span>
                ))}
              </div>
            )}
            {classesQuery.data && (
              <p className="mt-2 text-xs text-muted-foreground">{classesQuery.data.items.length} total{classesQuery.data.has_more ? " (truncated)" : ""}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            {subjectsQuery.isLoading ? (
              <Skeleton className="h-20" />
            ) : subjectsQuery.isError ? (
              <p className="text-sm text-muted-foreground">Failed to load.</p>
            ) : (subjectsQuery.data?.items.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">No subjects.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {subjectsQuery.data?.items.map((s) => (
                  <span key={s.id} className="rounded-full border px-2.5 py-1 text-xs">
                    {s.name}
                  </span>
                ))}
              </div>
            )}
            {subjectsQuery.data && (
              <p className="mt-2 text-xs text-muted-foreground">{subjectsQuery.data.items.length} total{subjectsQuery.data.has_more ? " (truncated)" : ""}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cohorts (Sections)</CardTitle>
        </CardHeader>
        <CardContent>
          {cohortsQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : cohortsQuery.isError ? (
            <p className="text-sm text-muted-foreground">Failed to load cohorts.</p>
          ) : (cohortsQuery.data?.items.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No cohorts.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-xs text-muted-foreground">
                    <th className="py-2 text-left font-medium">Name</th>
                    <th className="py-2 text-left font-medium">Code</th>
                    <th className="py-2 text-left font-medium">Capacity</th>
                    <th className="py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortsQuery.data?.items.map((c) => (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-2">{c.name}</td>
                      <td className="py-2 font-mono text-xs">{c.code}</td>
                      <td className="py-2 text-xs">{c.capacity ?? "—"}</td>
                      <td className="py-2"><Badge variant="outline">{c.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {cohortsQuery.data?.has_more && <p className="text-xs text-amber-600 mt-2">More cohorts exist (truncated at 100).</p>}
        </CardContent>
      </Card>

      <ClassSubjectsSection
        schoolId={schoolId}
        classes={classesQuery.data?.items ?? []}
        subjects={subjectsQuery.data?.items ?? []}
        years={yearsQuery.data?.items ?? []}
      />
    </div>
  );
}

function ClassSubjectsSection({ schoolId, classes, subjects, years }: { schoolId: string; classes: AcademicClass[]; subjects: Subject[]; years: AcademicYear[] }) {
  const classSubjectsQuery = useSchoolScopedQuery<{ id: string; academic_class_id: string; subject_id: string; effective_from_year_id: string; effective_to_year_id: string | null }>(schoolId, "/class-subjects", "class-subjects-detail", { limit: 100 });

  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s.name]));
  const yearMap = new Map(years.map((y) => [y.id, y.code]));

  if (classSubjectsQuery.isLoading) return <Skeleton className="h-20" />;
  if (classSubjectsQuery.isError) return <p className="text-sm text-muted-foreground">Failed to load class subjects.</p>;
  const items = classSubjectsQuery.data?.items ?? [];
  if (items.length === 0) return <Card><CardHeader><CardTitle className="text-base">Class Subjects</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">No class-subject assignments.</p></CardContent></Card>;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Class Subjects — Effective Year Range</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-xs text-muted-foreground">
                <th className="py-2 text-left font-medium">Class</th>
                <th className="py-2 text-left font-medium">Subject</th>
                <th className="py-2 text-left font-medium">From Year</th>
                <th className="py-2 text-left font-medium">To Year</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 20).map((cs) => (
                <tr key={cs.id} className="border-b last:border-0">
                  <td className="py-2 text-xs">{classMap.get(cs.academic_class_id) ?? cs.academic_class_id.slice(0, 8)}</td>
                  <td className="py-2 text-xs">{subjectMap.get(cs.subject_id) ?? cs.subject_id.slice(0, 8)}</td>
                  <td className="py-2 font-mono text-xs">{yearMap.get(cs.effective_from_year_id) ?? cs.effective_from_year_id.slice(0, 8)}</td>
                  <td className="py-2 font-mono text-xs">{cs.effective_to_year_id ? (yearMap.get(cs.effective_to_year_id) ?? cs.effective_to_year_id.slice(0, 8)) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{items.length} assignments total{classSubjectsQuery.data?.has_more ? " (truncated)" : ""}; showing 20</p>
      </CardContent>
    </Card>
  );
}
