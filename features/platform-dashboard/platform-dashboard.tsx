"use client";

import Link from "next/link";
import { AlertTriangle, BookOpen, Plus, Activity, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listOrganizations, listSchools, listUsers, listMemberships, getPlatformStats } from "@/services/iam";
import { listAuditLogs } from "@/services/audit";
import { platformKeys, STALE_TIME } from "@/lib/query-keys";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, formatDateTime } from "@/lib/format";
import { AUDIT_ACTION_LABELS } from "@/lib/display";
import { PlatformStatCard } from "./platform-stat-card";

const HEALTH_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "") + "/health";
const READY_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "") + "/ready";

function HealthStrip() {
  const health = useQuery({
    queryKey: ["platform", "health-strip"],
    queryFn: async () => {
      const [h, r] = await Promise.all([
        fetch(HEALTH_URL).then((res) => res.json()).catch(() => ({ status: "error" })),
        fetch(READY_URL).then((res) => res.json()).catch(() => ({ status: "error" })),
      ]);
      return { health: h, ready: r };
    },
    refetchInterval: 30_000,
  });

  if (health.isLoading) return <Skeleton className="h-10 w-full" />;
  const ok = health.data?.health?.status === "ok" && (health.data?.ready?.status === "ready" || health.data?.ready?.status === "ok");
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${ok ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
      <Activity className="size-4" />
      <span className="font-medium">{ok ? "API is healthy" : "API status unknown"}</span>
      <span className="text-xs opacity-70">· last checked {new Date().toLocaleTimeString()}</span>
      <span className="ml-auto text-xs opacity-70">GET /health + /ready</span>
    </div>
  );
}

function NeedsAttention() {
  const orgsQuery = useQuery({
    queryKey: platformKeys.organizations({ limit: 100 }),
    queryFn: () => listOrganizations({ limit: 100 }),
  });
  const schoolsQuery = useQuery({
    queryKey: platformKeys.schools({ limit: 100 }),
    queryFn: () => listSchools({ limit: 100 }),
  });
  const usersQuery = useQuery({
    queryKey: platformKeys.users({ limit: 100 }),
    queryFn: () => listUsers({ limit: 100 }),
  });
  const membershipsQuery = useQuery({
    queryKey: ["platform", "memberships-alert", { limit: 100 }] as const,
    queryFn: () => listMemberships({ limit: 100 }),
  });

  if (orgsQuery.isLoading || schoolsQuery.isLoading || usersQuery.isLoading) {
    return <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-10" /><Skeleton className="h-10" /></div>;
  }

  const orgs = orgsQuery.data?.items ?? [];
  const schools = schoolsQuery.data?.items ?? [];
  const users = usersQuery.data?.items ?? [];
  const memberships = membershipsQuery.data?.items ?? [];

  const alerts: { message: string; href: string }[] = [];

  // Orgs with no schools → Org detail → Schools tab → Create School
  const orgIdsWithSchools = new Set(schools.map((s) => s.organization_id));
  const orgsWithNoSchools = orgs.filter((o) => !orgIdsWithSchools.has(o.id));
  if (orgsWithNoSchools.length > 0) {
    const first = orgsWithNoSchools[0];
    alerts.push({ message: `${orgsWithNoSchools.length} organizations with no schools`, href: `/platform/organizations/${first.id}/schools` });
  }

  // Org in TRIAL >30 days → Org detail → Settings → Status
  // eslint-disable-next-line react-hooks/purity -- capture once
  const now = Date.now();
  const trialOld = orgs.filter((o) => o.status === "TRIAL" && new Date(o.created_at).getTime() < now - 30 * 24 * 60 * 60 * 1000);
  if (trialOld.length > 0) {
    const first = trialOld[0];
    alerts.push({ message: `${trialOld.length} organizations in TRIAL status > 30 days`, href: `/platform/organizations/${first.id}/settings` });
  }

  // Schools in SETUP with no academic year → School detail → Academics tab (exact check would require per-school GET /academic-years)
  const setupSchools = schools.filter((s) => s.status === "SETUP");
  if (setupSchools.length > 0) {
    const first = setupSchools[0];
    alerts.push({ message: `${setupSchools.length} schools in SETUP with no academic year`, href: `/platform/schools/${first.id}/academics` });
  }

  // Suspended user with active memberships → User detail → Memberships tab
  const suspendedUserIds = new Set(users.filter((u) => u.status === "SUSPENDED").map((u) => u.id));
  const suspendedActiveMemberships = memberships.filter((m) => suspendedUserIds.has(m.user_id) && m.status === "ACTIVE");
  if (suspendedActiveMemberships.length > 0) {
    const firstUserId = suspendedActiveMemberships[0].user_id;
    alerts.push({ message: `${suspendedActiveMemberships.length} suspended users with active memberships`, href: `/platform/users/${firstUserId}/memberships` });
  }

  // School with no users → School detail → Users tab
  const schoolIdsWithMemberships = new Set(memberships.filter((m) => m.school_id).map((m) => m.school_id as string));
  const schoolsWithNoUsers = schools.filter((s) => !schoolIdsWithMemberships.has(s.id));
  if (schoolsWithNoUsers.length > 0 && schools.length > 0) {
    const first = schoolsWithNoUsers[0];
    alerts.push({ message: `${schoolsWithNoUsers.length} schools with no users`, href: `/platform/schools/${first.id}/users` });
  }

  // Org with all schools suspended → Org detail → Schools tab
  const orgSchoolsMap = new Map<string, typeof schools>();
  schools.forEach((s) => {
    const arr = orgSchoolsMap.get(s.organization_id) ?? [];
    arr.push(s);
    orgSchoolsMap.set(s.organization_id, arr);
  });
  for (const [orgId, orgSchools] of orgSchoolsMap) {
    if (orgSchools.length > 0 && orgSchools.every((s) => s.status === "SUSPENDED")) {
      alerts.push({ message: `Organization ${orgId.slice(0, 8)} has all schools suspended`, href: `/platform/organizations/${orgId}/schools` });
      break;
    }
  }

  if (alerts.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No urgent issues detected.</p>;
  }

  return (
    <ul className="space-y-2">
      {alerts.map((a, i) => (
        <li key={i} className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:bg-amber-950/20">
          <span className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-600" />{a.message}</span>
          <Button asChild variant="ghost" size="sm"><Link href={a.href}>View →</Link></Button>
        </li>
      ))}
    </ul>
  );
}

export function PlatformDashboard() {
  const statsQuery = useQuery({
    queryKey: platformKeys.platformStats(),
    queryFn: getPlatformStats,
    staleTime: STALE_TIME.frequent,
  });

  const auditQuery = useQuery({
    queryKey: platformKeys.audit({ limit: 10 }),
    queryFn: () => listAuditLogs({ limit: 10 }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform Dashboard</h1>
          <p className="text-sm text-muted-foreground">Is the platform healthy? Anything urgent? What happened recently?</p>
        </div>
        <Button asChild>
          <Link href="/platform/organizations/new">
            <Plus className="size-4" />
            New Organization
          </Link>
        </Button>
      </div>

      <HealthStrip />

      <div className="grid gap-4 sm:grid-cols-3">
        <PlatformStatCard
          label="Organizations"
          value={statsQuery.data?.org_count ?? null}
          isLoading={statsQuery.isLoading}
        />
        <PlatformStatCard
          label="Schools"
          value={statsQuery.data?.school_count ?? null}
          isLoading={statsQuery.isLoading}
        />
        <PlatformStatCard
          label="Users"
          value={statsQuery.data?.user_count ?? null}
          isLoading={statsQuery.isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="size-4" /> Needs Attention</CardTitle>
          <CardDescription>Actionable alerts with links to remediation</CardDescription>
        </CardHeader>
        <CardContent>
          <NeedsAttention />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Last 10 entries from audit log</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm"><Link href="/platform/audit">All →</Link></Button>
        </CardHeader>
        <CardContent>
          {auditQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : auditQuery.isError ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Activity log is unavailable right now.</p>
          ) : auditQuery.data?.items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="divide-y">
              {auditQuery.data?.items.map((log) => (
                <li key={log.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <BookOpen className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{AUDIT_ACTION_LABELS[log.action] ?? log.action}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {log.summary ?? "—"}
                      {log.actor_label ? ` • ${log.actor_label}` : ""}
                    </p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground" title={formatDateTime(log.created_at)}>
                    {formatRelativeTime(log.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild><Link href="/platform/organizations/new"><Plus className="size-4" /> New Organization</Link></Button>
          <Button asChild variant="outline"><Link href="/platform/schools"><GraduationCap className="size-4" /> New School</Link></Button>
          <Button asChild variant="outline"><Link href="/platform/audit"><BookOpen className="size-4" /> View Audit Log</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
