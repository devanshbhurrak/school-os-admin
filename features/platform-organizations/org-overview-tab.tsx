"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrganization, listSchools, listMemberships } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/patterns/error-state";
import { formatDateTime } from "@/lib/format";

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
}

function FieldRow({ label, value }: FieldRowProps) {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 border-b last:border-b-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm break-all">{value ?? <span className="text-muted-foreground">—</span>}</dd>
    </div>
  );
}

function formatEntitlementValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

interface OrgOverviewTabProps {
  orgId: string;
}

export function OrgOverviewTab({ orgId }: OrgOverviewTabProps) {
  const { data: org, isLoading, isError, error, refetch } = useQuery({
    queryKey: platformKeys.organization(orgId),
    queryFn: () => getOrganization(orgId),
  });

  const schoolsQuery = useQuery({
    queryKey: platformKeys.orgSchools(orgId),
    queryFn: () => listSchools({ limit: 100, organization_id: orgId } as never),
    enabled: !!orgId,
  });

  const membershipsQuery = useQuery({
    queryKey: platformKeys.orgMemberships(orgId),
    queryFn: () => listMemberships({ limit: 100, organization_id: orgId } as never),
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (isError || !org) {
    return <ErrorState error={error} onRetry={() => void refetch()} title="Failed to load organization" />;
  }

  const memberships = membershipsQuery.data?.items ?? [];
  const schools = schoolsQuery.data?.items ?? [];
  const isSchoolsTruncated = schoolsQuery.data?.has_more ?? false;
  const isMembershipsTruncated = membershipsQuery.data?.has_more ?? false;
  const activeSchools = schools.filter((s) => s.status === "ACTIVE").length;
  const setupSchools = schools.filter((s) => s.status === "SETUP").length;
  const suspendedSchools = schools.filter((s) => s.status === "SUSPENDED").length;
  const distinctUsers = new Set(memberships.map((m) => m.user_id)).size;

  const entitlementEntries = Object.entries(org.entitlements ?? {});

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl>
              <FieldRow label="Name" value={org.name} />
              <FieldRow label="Code" value={<span className="font-mono">{org.code}</span>} />
              <FieldRow label="Slug" value={<span className="font-mono">{org.code.toLowerCase().replace(/_/g, "-")}</span>} />
              <FieldRow label="Legal name" value={org.legal_name} />
              <FieldRow label="Status" value={<StatusBadge status={org.status} />} />
              <FieldRow label="Plan" value={org.plan_code} />
              <FieldRow label="Contact email" value={org.contact_email} />
              <FieldRow label="Contact phone" value={org.contact_phone} />
              <FieldRow label="Timezone" value={org.timezone} />
              <FieldRow label="Locale" value={org.locale} />
              <FieldRow label="Created" value={formatDateTime(org.created_at)} />
              <FieldRow label="Updated" value={formatDateTime(org.updated_at)} />
            </dl>
          </CardContent>
        </Card>

        {entitlementEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Entitlements</CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                {entitlementEntries.map(([key, value]) => (
                  <FieldRow
                    key={key}
                    label={key}
                    value={formatEntitlementValue(value)}
                  />
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-2xl font-bold">
                {schoolsQuery.isLoading ? <Skeleton className="h-8 w-10 inline-block" /> : `${schools.length}${isSchoolsTruncated ? "+" : ""}`}
              </p>
              <p className="text-sm text-muted-foreground">Schools {isSchoolsTruncated && <span className="text-[11px]">(100+ loaded)</span>}</p>
              <p className="text-xs text-muted-foreground">{activeSchools} active · {setupSchools} setup · {suspendedSchools} suspended</p>
              {schoolsQuery.isError && <p className="text-xs text-amber-600">Failed to load schools</p>}
            </div>
            <div>
              <p className="text-2xl font-bold">
                {membershipsQuery.isLoading ? <Skeleton className="h-8 w-10 inline-block" /> : `${distinctUsers}${isMembershipsTruncated ? "+" : ""}`}
              </p>
              <p className="text-sm text-muted-foreground">Users {isMembershipsTruncated && <span className="text-[11px]">(100+ memberships loaded)</span>}</p>
              {membershipsQuery.isError && <p className="text-xs text-amber-600">Failed to load memberships</p>}
            </div>
            <div>
              <p className="text-2xl font-bold">
                {membershipsQuery.isLoading ? <Skeleton className="h-8 w-10 inline-block" /> : `${memberships.length}${isMembershipsTruncated ? "+" : ""}`}
              </p>
              <p className="text-sm text-muted-foreground">Memberships {isMembershipsTruncated && <span className="text-[11px]">(truncated)</span>}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
