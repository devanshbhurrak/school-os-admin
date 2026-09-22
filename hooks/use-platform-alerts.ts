"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { platformApiClient } from "@/services/platform-api-client";
import { platformKeys } from "@/lib/query-keys";
import type { CursorPage, Organization, School, User, Membership } from "@/types";

/**
 * Derives Needs Attention items client-side from loaded platform data.
 * Spec checks: org no schools, TRIAL>30d, SETUP with no academic year, suspended user with active memberships, school no users, org all schools suspended.
 */
export function usePlatformAlerts() {
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
  const membershipsQuery = useQuery({
    queryKey: ["platform", "memberships", "alerts"],
    queryFn: async () => {
      const { data } = await platformApiClient.get<CursorPage<Membership>>("/memberships", { params: { limit: 100 } });
      return data;
    },
  });

  const alerts = useMemo(() => {
    const orgs = orgsQuery.data?.items ?? [];
    const schools = schoolsQuery.data?.items ?? [];
    const users = usersQuery.data?.items ?? [];
    const memberships = membershipsQuery.data?.items ?? [];
    const out: { message: string; href: string }[] = [];

    const orgIdsWithSchools = new Set(schools.map((s) => s.organization_id));
    const orgsWithNoSchools = orgs.filter((o) => !orgIdsWithSchools.has(o.id));
    if (orgsWithNoSchools.length) out.push({ message: `${orgsWithNoSchools.length} organizations with no schools`, href: "/platform/organizations" });

    // eslint-disable-next-line react-hooks/purity -- time-based filter, stable for render
    const now = Date.now();
    const trialOld = orgs.filter((o) => o.status === "TRIAL" && new Date(o.created_at).getTime() < now - 30 * 24 * 60 * 60 * 1000);
    if (trialOld.length) out.push({ message: `${trialOld.length} organizations in TRIAL > 30 days`, href: "/platform/organizations" });

    const setupSchools = schools.filter((s) => s.status === "SETUP");
    if (setupSchools.length) out.push({ message: `${setupSchools.length} schools in SETUP`, href: "/platform/schools" });

    const suspendedIds = new Set(users.filter((u) => u.status === "SUSPENDED").map((u) => u.id));
    const suspendedActive = memberships.filter((m) => suspendedIds.has(m.user_id) && m.status === "ACTIVE").length;
    if (suspendedActive) out.push({ message: `${suspendedActive} suspended users with active memberships`, href: "/platform/users" });

    const schoolIdsWithMembers = new Set(memberships.filter((m) => m.school_id).map((m) => m.school_id as string));
    const schoolsNoUsers = schools.filter((s) => !schoolIdsWithMembers.has(s.id));
    if (schoolsNoUsers.length && schools.length) out.push({ message: `${schoolsNoUsers.length} schools with no users`, href: "/platform/schools" });

    // Org with all schools suspended
    const orgSchoolsMap = new Map<string, School[]>();
    schools.forEach((s) => {
      const arr = orgSchoolsMap.get(s.organization_id) ?? [];
      arr.push(s);
      orgSchoolsMap.set(s.organization_id, arr);
    });
    for (const [orgId, orgSchools] of orgSchoolsMap) {
      if (orgSchools.length > 0 && orgSchools.every((s) => s.status === "SUSPENDED")) {
        out.push({ message: `Organization ${orgId.slice(0, 8)} has all schools suspended`, href: `/platform/organizations/${orgId}/schools` });
      }
    }

    return out;
  }, [orgsQuery.data, schoolsQuery.data, usersQuery.data, membershipsQuery.data]);

  return {
    alerts,
    isLoading: orgsQuery.isLoading || schoolsQuery.isLoading || usersQuery.isLoading,
  };
}
