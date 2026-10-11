"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/constants";
import { platformKeys, STALE_TIME } from "@/lib/query-keys";
import {
  getOutboxSummary,
  listFeatureFlags,
  listOutboxEvents,
  type OutboxEvent,
} from "@/services/system";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, RefreshCw, Clock } from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const HEALTH_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "") + "/health";
const READY_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "") + "/health/ready";

async function fetchHealth(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<{ status: string }>;
}

function HealthRow({ label, query, lastChecked }: { label: string; query: { isLoading: boolean; isError: boolean; data?: { status: string } }; lastChecked: string }) {
  if (query.isLoading) return <Skeleton className="h-10 w-full" />;
  const ok = !query.isError && (query.data?.status === "ok" || query.data?.status === "ready");
  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2.5">
      <span className={`size-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium flex items-center gap-2">
          {ok ? <CheckCircle2 className="size-4 text-emerald-600" /> : <XCircle className="size-4 text-red-600" />}
          {label}: {query.isError ? "Unavailable" : query.data?.status ?? "Unknown"}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="size-3" /> Last checked: {lastChecked}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "SENT") return <Badge variant="default">Sent</Badge>;
  if (status === "FAILED") return <Badge variant="destructive">Failed</Badge>;
  if (status === "PROCESSING") return <Badge variant="secondary">Processing</Badge>;
  return <Badge variant="outline">Pending</Badge>;
}

function BackgroundJobsCard({ lastChecked }: { lastChecked: string }) {
  const summaryQuery = useQuery({
    queryKey: platformKeys.outboxSummary(),
    queryFn: getOutboxSummary,
    staleTime: STALE_TIME.frequent,
    refetchInterval: 15_000,
  });
  const eventsQuery = useQuery({
    queryKey: platformKeys.outboxEvents({ limit: 10 }),
    queryFn: () => listOutboxEvents({ limit: 10 }),
    staleTime: STALE_TIME.frequent,
    refetchInterval: 15_000,
  });

  const summary = summaryQuery.data;
  const events: OutboxEvent[] = eventsQuery.data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Background Jobs</CardTitle>
        <CardDescription>
          Outbox dispatcher state — polled every 15s.{" "}
          {summaryQuery.isError && "Summary unavailable (check API connectivity)."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {summaryQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : summary ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {[
              ["Pending", summary.pending],
              ["Processing", summary.processing],
              ["Sent", summary.sent],
              ["Failed", summary.failed],
              ["Dead-lettered", summary.dead_lettered],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border px-3 py-2">
                <p className="text-xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        ) : null}

        {eventsQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : eventsQuery.isError ? (
          <p className="text-sm text-muted-foreground">Recent events unavailable right now.</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No outbox events yet — publish an announcement to see dispatcher activity.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {events.map((event) => (
              <li key={event.id} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.event_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    {event.last_error ? ` • ${event.last_error}` : ""}
                    {event.attempts > 0 ? ` • attempt ${event.attempts}` : ""}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">Last checked: {lastChecked}</p>
      </CardContent>
    </Card>
  );
}

function FeatureFlagsCard() {
  const flagsQuery = useQuery({
    queryKey: platformKeys.featureFlags({ limit: 50 }),
    queryFn: () => listFeatureFlags({ limit: 50 }),
    staleTime: STALE_TIME.config,
  });

  const flags = flagsQuery.data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feature Flags</CardTitle>
        <CardDescription>Read-only list of configured flags</CardDescription>
      </CardHeader>
      <CardContent>
        {flagsQuery.isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : flagsQuery.isError ? (
          <p className="text-sm text-muted-foreground">Feature flags unavailable right now.</p>
        ) : flags.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data — no feature flags configured.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {flags.map((flag) => (
              <li key={flag.id} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-medium">{flag.key}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {flag.description ?? "—"}
                    {flag.organization_id ? ` • org ${flag.organization_id.slice(0, 8)}` : ""}
                    {flag.school_id ? ` • school ${flag.school_id.slice(0, 8)}` : ""}
                  </p>
                </div>
                <Badge variant={flag.enabled ? "default" : "outline"}>
                  {flag.enabled ? "On" : "Off"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function SystemHealth() {
  const [tick, setTick] = useState(() => Date.now());
  const nowStr = new Date(tick).toLocaleTimeString();

  const healthQuery = useQuery({
    queryKey: ["platform", "health", tick],
    queryFn: () => fetchHealth(HEALTH_URL),
    retry: false,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });

  const readyQuery = useQuery({
    queryKey: ["platform", "ready", tick],
    queryFn: () => fetchHealth(READY_URL),
    retry: false,
    refetchOnWindowFocus: false,
    gcTime: 0,
  });

  function refresh() {
    setTick(Date.now());
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground">API liveness, readiness, background jobs, and feature flags.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">API Status</CardTitle>
            <CardDescription>Checked via GET /health and GET /health/ready</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <HealthRow label="API is healthy" query={healthQuery} lastChecked={nowStr} />
          <HealthRow label="Database + Redis ready" query={readyQuery} lastChecked={nowStr} />
          {(healthQuery.isError || readyQuery.isError) && (
            <p className="text-xs text-muted-foreground">If the API is unreachable, check that the backend is running at {HEALTH_URL}.</p>
          )}
        </CardContent>
      </Card>

      <BackgroundJobsCard lastChecked={nowStr} />

      <FeatureFlagsCard />

      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">Email / SMS Delivery <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal">Phase 4</span></CardTitle>
          <CardDescription>External channels plug into the outbox dispatcher next phase</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">In-app delivery is live via Background Jobs above. Email and WhatsApp providers will appear here in Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  );
}
