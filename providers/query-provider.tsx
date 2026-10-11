"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { GC_TIME, STALE_TIME } from "@/lib/constants";
import { ApiError } from "@/types";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: STALE_TIME.frequent,
            gcTime: GC_TIME,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && (error.status === 429 || error.status >= 500)) {
                return failureCount < 3;
              }
              return failureCount < 2;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status === 429) {
                return failureCount < 3;
              }
              return false;
            },
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
