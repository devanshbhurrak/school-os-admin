"use client";

import { useQuery } from "@tanstack/react-query";
import { platformApiClient } from "@/services/platform-api-client";
import { platformKeys } from "@/lib/query-keys";
import type { CursorPage, Organization, School, User } from "@/types";

/**
 * Fetches org/school/user counts for dashboard.
 * Uses platformApiClient (no X-School-ID) and limit=100 for approximate totals.
 * Spec: counts derived via limit=1 has_more or full list when small — approx totals.
 */
export function usePlatformStats() {
  const orgsQuery = useQuery({
    queryKey: platformKeys.organizations({ limit: 100 }),
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<Organization>>("/organizations", { params: { limit: 100 } });
      return data;
    },
  });

  const schoolsQuery = useQuery({
    queryKey: platformKeys.schools({ limit: 100 }),
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<School>>("/schools", { params: { limit: 100 } });
      return data;
    },
  });

  const usersQuery = useQuery({
    queryKey: platformKeys.users({ limit: 100 }),
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<User>>("/users", { params: { limit: 100 } });
      return data;
    },
  });

  return { orgsQuery, schoolsQuery, usersQuery };
}
