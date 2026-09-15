"use client";

import Link from "next/link";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listMemberships } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { KeyRound } from "lucide-react";
import type { Membership } from "@/types";
import { format } from "date-fns";

interface SchoolMembershipsTabProps {
  schoolId: string;
}

function Row({ membership }: { membership: Membership }) {
  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-2.5 pl-4 pr-2 text-sm">
        <Link
          href={`/platform/users/${membership.user_id}/memberships`}
          className="font-mono text-xs hover:underline text-muted-foreground"
        >
          {membership.user_id.slice(0, 8)}…
        </Link>
      </td>
      <td className="py-2.5 px-2">
        <div className="flex flex-wrap gap-1">
          {membership.role_codes.length > 0
            ? membership.role_codes.map((code) => (
                <span
                  key={code}
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]"
                >
                  {code}
                </span>
              ))
            : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </td>
      <td className="py-2.5 px-2">
        <StatusBadge status={membership.status} />
      </td>
      <td className="py-2.5 pr-4 pl-2 text-xs text-muted-foreground whitespace-nowrap">
        {membership.start_date
          ? format(new Date(membership.start_date), "MMM d, yyyy")
          : "—"}
      </td>
    </tr>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b">
      <td className="py-2.5 pl-4 pr-2"><Skeleton className="h-3 w-20" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-4 w-24" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-5 w-16" /></td>
      <td className="py-2.5 pr-4 pl-2"><Skeleton className="h-3 w-20" /></td>
    </tr>
  );
}

export function SchoolMembershipsTab({ schoolId }: SchoolMembershipsTabProps) {
  const { items, hasMore, isInitialLoading, isFetchingMore, isError, fetchMore } =
    useCursorPagination<Membership>({
      queryKey: platformKeys.schoolMemberships(schoolId),
      queryFn: (params) => listMemberships({ ...params, school_id: schoolId }),
    });

  if (isError) return <ErrorState title="Failed to load memberships" />;

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-[500px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">User</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Roles</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="py-2.5 pr-4 pl-2 text-left text-xs font-medium text-muted-foreground">Start</th>
            </tr>
          </thead>
          <tbody>
            {isInitialLoading
              ? Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="py-12">
                    <EmptyState
                      icon={KeyRound}
                      title="No memberships"
                      description="School memberships will appear here."
                    />
                  </td>
                </tr>
              )
              : items.map((m) => <Row key={m.id} membership={m} />)}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={fetchMore} disabled={isFetchingMore}>
            {isFetchingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
