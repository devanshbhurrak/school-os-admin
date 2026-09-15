"use client";

import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listAuditLogs, type AuditLog } from "@/services/audit";
import { platformKeys } from "@/lib/query-keys";

interface OrgAuditTabProps {
  orgId: string;
}

/**
 * Org-scoped audit log.
 *
 * API gap: GET /audit-logs does not yet support organization_id filter.
 * Workaround: fetch school-scoped entries (by school_id for each school) is too
 * expensive. Instead we fetch platform-wide and filter client-side on organization_id
 * until the backend adds the filter.
 *
 * The AuditLog type has an `organization_id` field — we post-filter in the table.
 * When the API adds organization_id filter, replace the params with { organization_id: orgId }.
 */
export function OrgAuditTab({ orgId }: OrgAuditTabProps) {
  // API gap: organization_id filter not yet supported. Fetch platform-wide and filter client-side.
  // We use a wrapper that filters items where organization_id === orgId
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing platform-wide audit entries — filtered to this organization client-side.
        Range may be incomplete if there are many entries. When API adds organization_id filter, this will be server-side.
      </p>
      <FilteredAuditTable orgId={orgId} />
    </div>
  );
}

function FilteredAuditTable({ orgId }: { orgId: string }) {
  const { items, hasMore, isInitialLoading, isFetchingMore, isError, fetchMore, refetch } = useCursorPagination<AuditLog>({
    queryKey: platformKeys.orgAudit(orgId),
    queryFn: (params) => listAuditLogs(params),
    limit: 25,
  });
  const filtered = items.filter((i) => i.organization_id === orgId);
  if (isError) return <div className="py-10 text-center text-sm text-muted-foreground">Failed to load audit log. <button onClick={() => refetch()} className="text-primary hover:underline">Retry</button></div>;
  if (isInitialLoading) return <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse rounded" />)}</div>;
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">Time</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Action</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Entity</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Actor</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Summary</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-sm text-muted-foreground">No audit entries for this organization in loaded page. {hasMore ? "Load more to see more." : "Platform-wide entries exist but none match."}</td></tr>
            ) : (
              filtered.map((entry) => (
                <tr key={entry.id} className="border-b">
                  <td className="py-2.5 pl-4 pr-2 text-xs text-muted-foreground whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-xs font-medium">{entry.action.replace(/_/g, " ").toLowerCase()}</td>
                  <td className="py-2.5 px-2 text-xs text-muted-foreground">{entry.entity_type ?? "—"}</td>
                  <td className="py-2.5 px-2 text-xs text-muted-foreground truncate max-w-[150px]">{entry.actor_label ?? entry.actor_user_id ?? "—"}</td>
                  <td className="py-2.5 px-2 text-xs text-muted-foreground truncate max-w-[200px]">{entry.summary ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {hasMore && <div className="flex justify-center"><button onClick={fetchMore} disabled={isFetchingMore} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">{isFetchingMore ? "Loading…" : "Load more"}</button></div>}
      <p className="text-xs text-muted-foreground">Client-side filtered on loaded page; full org filter requires API <code>organization_id</code> support.</p>
    </div>
  );
}
