"use client";

import { useCallback, useMemo } from "react";
import {
  useInfiniteQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import type { ApiError, CursorPage, CursorParams } from "@/types";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";

export interface CursorPaginationOptions<T> {
  queryKey: readonly unknown[];
  queryFn: (params: CursorParams) => Promise<CursorPage<T>>;
  enabled?: boolean;
  limit?: number;
  staleTime?: number;
}

/**
 * Generic wrapper around useInfiniteQuery for the API's cursor-paginated
 * endpoints. Flattens loaded pages and exposes a "load more" trigger.
 */
export function useCursorPagination<T>({
  queryKey,
  queryFn,
  enabled = true,
  limit = DEFAULT_PAGE_SIZE,
  staleTime,
}: CursorPaginationOptions<T>) {
  const query = useInfiniteQuery<
    CursorPage<T>,
    ApiError,
    InfiniteData<CursorPage<T>, string | undefined>,
    readonly unknown[],
    string | undefined
  >({
    queryKey,
    queryFn: ({ pageParam }) => queryFn({ limit, cursor: pageParam }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled,
    staleTime,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );

  const hasMore = useMemo(
    () => query.data?.pages.at(-1)?.has_more ?? false,
    [query.data],
  );

  const fetchMore = useCallback(() => {
    if (!query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query]);

  return {
    items,
    hasMore,
    isInitialLoading: query.isPending,
    isLoading: query.isPending || query.isFetchingNextPage,
    isFetching: query.isFetching,
    isFetchingMore: query.isFetchingNextPage,
    error: query.error,
    isError: query.isError,
    fetchMore,
    refetch: query.refetch,
    queryKey,
  };
}
