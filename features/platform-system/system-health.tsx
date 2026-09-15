"use client";

import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, XCircle, RefreshCw, Clock } from "lucide-react";
import { useState } from "react";

const HEALTH_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "") + "/health";
const READY_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "") + "/ready";

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
        <p className="text-sm text-muted-foreground">API liveness and readiness. Other operational panels are coming soon.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">API Status</CardTitle>
            <CardDescription>Checked via GET /health and GET /ready</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <HealthRow label="API is healthy" query={healthQuery} lastChecked={nowStr} />
          <HealthRow label="Database ready" query={readyQuery} lastChecked={nowStr} />
          {(healthQuery.isError || readyQuery.isError) && (
            <p className="text-xs text-muted-foreground">If the API is unreachable, check that the backend is running at {HEALTH_URL}.</p>
          )}
        </CardContent>
      </Card>

      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">Background Jobs <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal">Soon</span></CardTitle>
          <CardDescription>Requires job queue monitoring API</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Job queue status, retries, and worker health will appear here.</p>
        </CardContent>
      </Card>

      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">Feature Flags <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal">Soon</span></CardTitle>
          <CardDescription>Requires feature flag model + API</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Platform and per-organization feature flags will be managed here.</p>
        </CardContent>
      </Card>

      <Card className="opacity-60">
        <CardHeader>
          <CardTitle className="text-base">Email / SMS Delivery <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal">Soon</span></CardTitle>
          <CardDescription>Requires delivery provider integration</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Delivery status and provider health will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
