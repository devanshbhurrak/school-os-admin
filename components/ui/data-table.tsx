"use client";

import * as React from "react";
import {
  createSortedRowModel,
  flexRender,
  rowSortingFeature,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const DATA_TABLE_FEATURES = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { text: sortFn_text },
});

/** The table features this DataTable is configured with. */
export type DataTableFeatures = typeof DATA_TABLE_FEATURES;

export interface DataTableColumnMeta {
  /** Column shown in the mobile card fallback (when no mobileCard renderer is given). */
  mobilePriority?: number;
}

export interface DataTableEmptyState {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData, unknown>[];
  data: TData[];
  rowKey: (row: TData) => string;
  isLoading?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRowClick?: (row: TData) => void;
  emptyState?: React.ReactNode | DataTableEmptyState;
  /** Card layout for small screens; table renders below `md` otherwise. */
  mobileCard?: (row: TData) => React.ReactNode;
  skeletonRows?: number;
  className?: string;
}

function SkeletonRows({ rows, cells }: { rows: number; cells: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={`skeleton-${rowIndex}`}>
          {Array.from({ length: cells }).map((_, cellIndex) => (
            <TableCell key={`cell-${cellIndex}`}>
              <Skeleton className="h-4 w-full max-w-36" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function EmptyStateContent({ state }: { state: DataTableEmptyState }) {
  const Icon = state.icon;
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {Icon ? (
        <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-6 text-muted-foreground" aria-hidden />
        </div>
      ) : null}
      <p className="font-medium">{state.title}</p>
      {state.description ? (
        <p className="max-w-sm text-sm text-muted-foreground">{state.description}</p>
      ) : null}
      {state.action ? <div className="mt-2">{state.action}</div> : null}
    </div>
  );
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  rowKey,
  isLoading = false,
  isFetchingMore = false,
  hasMore = false,
  onLoadMore,
  onRowClick,
  emptyState,
  mobileCard,
  skeletonRows = 5,
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useTable<typeof DATA_TABLE_FEATURES, TData, SortingState>(
    {
      features: DATA_TABLE_FEATURES,
      data,
      columns,
      state: { sorting },
      onSortingChange: setSorting,
    },
    (state) => state.sorting,
  );

  const showSkeleton = isLoading && data.length === 0;

  const emptyStateNode =
    emptyState && typeof emptyState === "object" && "title" in emptyState ? (
      <EmptyStateContent state={emptyState as DataTableEmptyState} />
    ) : (
      (emptyState as React.ReactNode)
    );

  return (
    <div className={cn("space-y-3", className)}>
      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-9 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              <SkeletonRows rows={skeletonRows} cells={columns.length} />
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={rowKey(row.original)}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(
                    onRowClick &&
                      "cursor-pointer transition-colors hover:bg-muted/50",
                  )}
                >
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  {emptyStateNode}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {mobileCard ? (
        <div className="space-y-2 md:hidden">
          {showSkeleton ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-background p-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))
          ) : data.length ? (
            data.map((row) => (
              <div key={rowKey(row)}>{mobileCard(row)}</div>
            ))
          ) : (
            emptyStateNode
          )}
        </div>
      ) : null}

      {!isLoading && data.length === 0 && (
        <div className="md:hidden">{mobileCard ? null : emptyStateNode}</div>
      )}

      {hasMore && data.length > 0 && (
        <div className="flex justify-center pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onLoadMore}
            disabled={isFetchingMore}
            className="min-h-9 min-w-40"
          >
            {isFetchingMore && <Loader2 className="size-4 animate-spin" />}
            {isFetchingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface SortableHeaderProps {
  column: { getIsSorted: () => false | "asc" | "desc"; toggleSorting: (desc?: boolean) => void };
  children: React.ReactNode;
  className?: string;
}

export function SortableHeader({ column, children, className }: SortableHeaderProps) {
  const sorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("-ml-2 h-7 gap-1 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:bg-transparent", className)}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {children}
      {sorted === "asc" ? (
        <ArrowUp className="size-3.5" />
      ) : sorted === "desc" ? (
        <ArrowDown className="size-3.5" />
      ) : (
        <ArrowUpDown className="size-3.5 opacity-50" />
      )}
    </Button>
  );
}