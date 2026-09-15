"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listAuditLogs, type AuditLog, type AuditLogListParams } from "@/services/audit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/patterns/error-state";
import { EmptyState } from "@/components/patterns/empty-state";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface AuditLogTableProps {
  /** Pre-applied filters (e.g. { school_id } or { actor_user_id }). Passed directly to listAuditLogs. */
  params?: AuditLogListParams;
  /** React Query cache key for this instance. Must include all relevant params. */
  queryKey: readonly unknown[];
  className?: string;
  /** Client-side filters for fields not yet supported server-side (applied to loaded pages). */
  clientFilter?: {
    organization_id?: string;
    action?: string;
  };
}

function humanizeAction(action: string): string {
  return action
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SnapshotDiff({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const [showRaw, setShowRaw] = useState(false);

  const allKeys = Array.from(
    new Set([
      ...Object.keys(before ?? {}),
      ...Object.keys(after ?? {}),
    ]),
  );

  const changedKeys = allKeys.filter(
    (k) => JSON.stringify((before ?? {})[k]) !== JSON.stringify((after ?? {})[k]),
  );

  const displayKeys = changedKeys.length > 0 ? changedKeys : allKeys;

  function renderValue(val: unknown): string {
    if (val === null || val === undefined) return "—";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  }

  return (
    <div className="space-y-3">
      {displayKeys.length > 0 ? (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="pb-1.5 pr-4 font-medium">Field</th>
              <th className="pb-1.5 pr-4 font-medium">Before</th>
              <th className="pb-1.5 font-medium">After</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayKeys.map((key) => {
              const bVal = renderValue((before ?? {})[key]);
              const aVal = renderValue((after ?? {})[key]);
              const changed = bVal !== aVal;
              return (
                <tr key={key} className={cn(changed && "bg-amber-50/50 dark:bg-amber-900/10")}>
                  <td className="py-1 pr-4 font-mono text-muted-foreground">{key}</td>
                  <td className="py-1 pr-4 text-red-700 dark:text-red-400">
                    {bVal}
                  </td>
                  <td className="py-1 text-emerald-700 dark:text-emerald-400">
                    {aVal}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-xs text-muted-foreground">No snapshot data available.</p>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => setShowRaw((v) => !v)}
      >
        {showRaw ? "Hide" : "Raw JSON"}
      </Button>

      {showRaw && (
        <pre className="overflow-x-auto rounded-md border bg-muted p-3 text-[11px] leading-relaxed">
          {JSON.stringify({ before, after }, null, 2)}
        </pre>
      )}
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail =
    entry.before_snapshot !== null || entry.after_snapshot !== null || entry.summary;

  return (
    <>
      <tr
        className={cn(
          "border-b transition-colors",
          hasDetail && "cursor-pointer hover:bg-muted/50",
        )}
        onClick={() => hasDetail && setExpanded((v) => !v)}
      >
        <td className="py-2.5 pl-4 pr-2 text-xs text-muted-foreground whitespace-nowrap">
          <span title={entry.created_at}>
            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
          </span>
        </td>
        <td className="py-2.5 px-2 text-xs font-medium">{humanizeAction(entry.action)}</td>
        <td className="py-2.5 px-2 text-xs text-muted-foreground">
          {entry.entity_type ?? "—"}
        </td>
        <td className="py-2.5 px-2 text-xs text-muted-foreground truncate max-w-[180px]">
          {entry.actor_label ?? entry.actor_user_id ?? "—"}
        </td>
        <td className="py-2.5 px-2 text-xs text-muted-foreground truncate max-w-[200px]">
          {entry.summary ?? "—"}
        </td>
        <td className="py-2.5 pr-4 pl-2 text-right">
          {hasDetail && (
            <span className="text-muted-foreground">
              {expanded ? (
                <ChevronDown className="size-3.5" />
              ) : (
                <ChevronRight className="size-3.5" />
              )}
            </span>
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b bg-muted/30">
          <td colSpan={6} className="px-4 py-3">
            <div className="space-y-1">
              {entry.ip_address && (
                <p className="text-[11px] text-muted-foreground">
                  IP: {entry.ip_address}
                  {entry.request_id && <> · req: {entry.request_id}</>}
                </p>
              )}
              <SnapshotDiff
                before={entry.before_snapshot}
                after={entry.after_snapshot}
              />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b">
      <td className="py-2.5 pl-4 pr-2"><Skeleton className="h-3 w-20" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-3 w-28" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-3 w-16" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-3 w-32" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-3 w-40" /></td>
      <td className="py-2.5 pr-4 pl-2" />
    </tr>
  );
}

export function AuditLogTable({ params = {}, queryKey, className, clientFilter }: AuditLogTableProps) {
  const { items: rawItems, hasMore, isInitialLoading, isFetchingMore, isError, fetchMore } =
    useCursorPagination<AuditLog>({
      queryKey,
      queryFn: (cursorParams) => listAuditLogs({ ...params, ...cursorParams }),
      limit: 25,
    });

  const items = rawItems.filter((entry) => {
    if (clientFilter?.organization_id && entry.organization_id !== clientFilter.organization_id) return false;
    if (clientFilter?.action && entry.action !== clientFilter.action) return false;
    return true;
  });

  const isFilteredEmpty = !isInitialLoading && rawItems.length > 0 && items.length === 0;

  if (isError) {
    return <ErrorState title="Failed to load audit log" />;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">Time</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Action</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Entity</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Actor</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Summary</th>
              <th className="py-2.5 pr-4 pl-2" />
            </tr>
          </thead>
          <tbody>
            {isInitialLoading ? (
              Array.from({ length: 8 }).map((_, i) => <RowSkeleton key={i} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12">
                  <EmptyState title={isFilteredEmpty ? "No matching entries in loaded page" : "No audit entries"} description={isFilteredEmpty ? "No entries in the current page match the organization/action filter. Try loading more." : "Actions taken on this entity will appear here."} />
                </td>
              </tr>
            ) : (
              items.map((entry) => <AuditRow key={entry.id} entry={entry} />)
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMore}
            disabled={isFetchingMore}
          >
            {isFetchingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
