"use client";

import { useState } from "react";
import Link from "next/link";
import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { listSchools } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/patterns/empty-state";
import { ErrorState } from "@/components/patterns/error-state";
import { GraduationCap, Plus } from "lucide-react";
import { CreateSchoolDialog } from "@/features/platform-schools/create-school-dialog";
import type { School } from "@/types";
import { format } from "date-fns";

interface OrgSchoolsTabProps {
  orgId: string;
}

function Row({ school }: { school: School }) {
  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="py-2.5 pl-4 pr-2">
        <Link href={`/platform/schools/${school.id}/overview`} className="font-medium text-sm hover:underline">
          {school.name}
        </Link>
      </td>
      <td className="py-2.5 px-2 text-xs text-muted-foreground">{school.short_name ?? "—"}</td>
      <td className="py-2.5 px-2 text-xs text-muted-foreground">{school.board ?? "—"}</td>
      <td className="py-2.5 px-2">
        <StatusBadge status={school.status} />
      </td>
      <td className="py-2.5 pr-4 pl-2 text-xs text-muted-foreground whitespace-nowrap">
        {format(new Date(school.created_at), "MMM d, yyyy")}
      </td>
    </tr>
  );
}

function RowSkeleton() {
  return (
    <tr className="border-b">
      <td className="py-2.5 pl-4 pr-2"><Skeleton className="h-4 w-40" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-3 w-16" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-3 w-16" /></td>
      <td className="py-2.5 px-2"><Skeleton className="h-5 w-20" /></td>
      <td className="py-2.5 pr-4 pl-2"><Skeleton className="h-3 w-20" /></td>
    </tr>
  );
}


export function OrgSchoolsTab({ orgId }: OrgSchoolsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { items, hasMore, isInitialLoading, isFetchingMore, isError, fetchMore } =
    useCursorPagination<School>({
      queryKey: [...platformKeys.orgSchools(orgId), "infinite"],
      queryFn: (params) => listSchools({ ...params, organization_id: orgId }),
    });

  if (isError) return <ErrorState title="Failed to load schools" />;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" /> Add School
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border hidden sm:block">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground">Name</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Short</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Board</th>
              <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="py-2.5 pr-4 pl-2 text-left text-xs font-medium text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody>
            {isInitialLoading
              ? Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
              : items.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <EmptyState icon={GraduationCap} title="No schools yet" description="Schools in this organization will appear here." />
                  </td>
                </tr>
              )
              : items.map((school) => <Row key={school.id} school={school} />)}
          </tbody>
        </table>
      </div>
      <div className="sm:hidden space-y-2">
        {isInitialLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-md border" />)
          : items.length === 0 ? <EmptyState icon={GraduationCap} title="No schools yet" description="Schools in this organization will appear here." />
          : items.map((school) => (
              <Link key={school.id} href={`/platform/schools/${school.id}/overview`} className="block rounded-md border p-3 hover:bg-muted/50">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{school.name}</p>
                  <StatusBadge status={school.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{school.short_name ? `${school.short_name} · ` : ""}{school.board ?? "—"} · {school.code}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(school.created_at), "MMM d, yyyy")}</p>
              </Link>
            ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={fetchMore} disabled={isFetchingMore}>
            {isFetchingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      <CreateSchoolDialog preselectedOrgId={orgId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
