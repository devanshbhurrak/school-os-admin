"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys } from "@/lib/query-keys";
import {
  getPerson,
  getAcademicYear,
  getCohort,
  getUser,
  getRole,
} from "@/services";
import type {
  AcademicYear,
  Cohort,
  Person,
  Role,
  User,
} from "@/types";
import { personDisplayName } from "@/lib/format";
import { SEGMENT_LABELS } from "./nav-config";

type EntityNameData = Person | AcademicYear | Cohort | User | Role;

const DYNAMIC_ENTITY: Record<string, { label: string; kind: "person" | "year" | "cohort" | "user" | "role" }> = {
  people: { label: "Person", kind: "person" },
  years: { label: "Academic Year", kind: "year" },
  cohorts: { label: "Section", kind: "cohort" },
  users: { label: "User", kind: "user" },
  roles: { label: "Role", kind: "role" },
};

function useEntityName(kind: "person" | "year" | "cohort" | "user" | "role", id: string) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id;

  const query = useQuery<EntityNameData>({
    queryKey:
      kind === "person"
        ? schoolKeys.person(schoolId ?? "", id)
        : kind === "year"
          ? schoolKeys.year(schoolId ?? "", id)
          : kind === "cohort"
            ? schoolKeys.cohort(schoolId ?? "", id)
            : ["org", kind === "user" ? "users" : "roles", id],
    queryFn: () =>
      kind === "person"
        ? getPerson(id)
        : kind === "year"
          ? getAcademicYear(id)
          : kind === "cohort"
            ? getCohort(id)
            : kind === "user"
              ? getUser(id)
              : getRole(id),
    enabled: !!id,
    staleTime: 5 * 60_000,
    retry: false,
  });

  if (!query.data) return null;
  if (kind === "person") return personDisplayName(query.data as Person);
  if (kind === "user")
    return (query.data as User).email ?? (query.data as User).phone ?? "User";
  return (query.data as { name: string }).name;
}

export function BreadcrumbNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const items: { label: string; href?: string; current?: boolean }[] = [];
  let currentKind: { label: string; kind: "person" | "year" | "cohort" | "user" | "role" } | undefined;
  let entityId: string | undefined;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;
    const href = `/${segments.slice(0, i + 1).join("/")}`;

    if (i === 0) {
      items.push({ label: SEGMENT_LABELS[segment] ?? segment, href: isLast ? undefined : href });
      continue;
    }

    if (currentKind && entityId) {
      if (isLast) {
        items.push({ label: currentKind.label, href, current: true });
      }
      break;
    }

    const dynamic = DYNAMIC_ENTITY[segment];
    if (dynamic) {
      currentKind = dynamic;
      const next = segments[i + 1];
      if (next) entityId = next;
      if (!next) {
        items.push({ label: dynamic.label, current: true });
      }
      continue;
    }

    items.push({ label: SEGMENT_LABELS[segment] ?? segment, href: isLast ? undefined : href });
  }

  const entityName = useEntityName(
    currentKind?.kind ?? "person",
    entityId ?? "",
  );

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {items.map((item, index) => (
          <span key={index} className="contents">
            <BreadcrumbItem>
              {item.current || !item.href ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < items.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight className="size-3.5" aria-hidden />
              </BreadcrumbSeparator>
            )}
          </span>
        ))}
        {currentKind && entityId ? (
          <>
            <BreadcrumbSeparator>
              <ChevronRight className="size-3.5" aria-hidden />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-40 truncate">
                {entityName ?? currentKind.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : null}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
