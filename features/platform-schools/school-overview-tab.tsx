"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getOrganization, getSchool, listMemberships } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/patterns/error-state";
import { formatDateTime } from "@/lib/format";
import { platformApiClient } from "@/services/platform-api-client";
import type { CursorPage, AcademicYear, Cohort } from "@/types";

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}

interface SchoolOverviewTabProps {
  schoolId: string;
}

export function SchoolOverviewTab({ schoolId }: SchoolOverviewTabProps) {
  const { data: school, isLoading, isError, error, refetch } = useQuery({
    queryKey: platformKeys.school(schoolId),
    queryFn: () => getSchool(schoolId),
  });

  const orgQuery = useQuery({
    queryKey: school ? platformKeys.organization(school.organization_id) : ["platform", "organizations", "pending"],
    queryFn: () => getOrganization(school!.organization_id),
    enabled: !!school?.organization_id,
  });

  const membershipsQuery = useQuery({
    queryKey: platformKeys.schoolMemberships(schoolId),
    queryFn: () => listMemberships({ limit: 100, school_id: schoolId }),
    enabled: !!schoolId,
  });

  const cohortsQuery = useQuery({
    queryKey: ["platform", "schools", schoolId, "cohorts-count"],
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<Cohort>>("/cohorts", {
        headers: { "X-School-ID": schoolId },
        params: { limit: 1 },
      });
      return data;
    },
    enabled: !!schoolId,
  });
  const classesQuery = useQuery({
    queryKey: ["platform", "schools", schoolId, "classes-count"],
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<unknown>>("/academic-classes", {
        headers: { "X-School-ID": schoolId },
        params: { limit: 1 },
      });
      return data;
    },
    enabled: !!schoolId,
  });
  const subjectsQuery = useQuery({
    queryKey: ["platform", "schools", schoolId, "subjects-count"],
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<unknown>>("/subjects", {
        headers: { "X-School-ID": schoolId },
        params: { limit: 1 },
      });
      return data;
    },
    enabled: !!schoolId,
  });
  const yearsQuery = useQuery({
    queryKey: ["platform", "schools", schoolId, "years-count"],
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<AcademicYear>>("/academic-years", {
        headers: { "X-School-ID": schoolId },
        params: { limit: 10 },
      });
      return data;
    },
    enabled: !!schoolId,
  });

  const currentYear = yearsQuery.data?.items.find((y) => y.is_current);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (isError || !school) {
    return <ErrorState error={error} onRetry={() => void refetch()} title="Failed to load school" />;
  }

  const distinctUserCount = new Set((membershipsQuery.data?.items ?? []).map((m) => m.user_id)).size;
  const hasMoreUsers = membershipsQuery.data?.has_more ?? false;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <FieldRow label="Name" value={school.name} />
              <FieldRow label="Short name" value={school.short_name} />
              <FieldRow label="Code" value={<span className="font-mono">{school.code}</span>} />
              <FieldRow label="Status" value={<StatusBadge status={school.status} />} />
              <FieldRow
                label="Organization"
                value={
                  <Link
                    href={`/platform/organizations/${school.organization_id}/overview`}
                    className="hover:underline text-primary"
                  >
                    {orgQuery.data?.name ?? school.organization_id.slice(0, 8) + "…"}
                  </Link>
                }
              />
              <FieldRow label="Board" value={school.board} />
              <FieldRow label="Affiliation #" value={school.affiliation_number} />
              <FieldRow label="Contact email" value={school.contact_email} />
              <FieldRow label="Contact phone" value={school.contact_phone} />
              <FieldRow label="Timezone" value={school.timezone} />
              <FieldRow label="Locale" value={school.locale} />
              <FieldRow label="Created" value={formatDateTime(school.created_at)} />
              <FieldRow label="Updated" value={formatDateTime(school.updated_at)} />
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">At a Glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border p-3 text-center">
                <p className="text-xl font-bold">
                  {membershipsQuery.isLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : `${distinctUserCount}${hasMoreUsers ? "+" : ""}`}
                </p>
                <p className="text-xs text-muted-foreground">Users</p>
                {hasMoreUsers && <p className="text-[10px] text-muted-foreground">100+ loaded</p>}
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-xl font-bold">
                  {cohortsQuery.isLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : `${cohortsQuery.data?.items.length ?? 0}${cohortsQuery.data?.has_more ? "+" : ""}`}
                </p>
                <p className="text-xs text-muted-foreground">Cohorts</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-xl font-bold">
                  {classesQuery.isLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : `${classesQuery.data?.items.length ?? 0}${classesQuery.data?.has_more ? "+" : ""}`}
                </p>
                <p className="text-xs text-muted-foreground">Classes</p>
              </div>
              <div className="rounded-md border p-3 text-center">
                <p className="text-xl font-bold">
                  {subjectsQuery.isLoading ? <Skeleton className="h-6 w-8 mx-auto" /> : `${subjectsQuery.data?.items.length ?? 0}${subjectsQuery.data?.has_more ? "+" : ""}`}
                </p>
                <p className="text-xs text-muted-foreground">Subjects</p>
              </div>
            </div>
            {yearsQuery.data && (
              <p className="text-xs text-muted-foreground text-center">
                Current Year: {currentYear ? `${currentYear.code} (${currentYear.status})` : "—"} {yearsQuery.data.items.length > 0 ? `· ${yearsQuery.data.items.length} year(s)` : ""}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
