"use client";

import {
  CalendarRange,
  CalendarDays,
  GraduationCap,
  Home,
  LayoutGrid,
  Library,
  ListChecks,
  School,
  Settings,
  ShieldCheck,
  UserRoundCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/permissions";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hide when the user lacks this permission. */
  permission?: string;
  /** Subpaths considered part of this item (for active state). */
  match?: string[];
  /** Optional badge text shown as a pill (e.g. "Soon"). */
  badge?: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Home",
    items: [
      {
        href: "/home",
        label: "Home",
        icon: Home,
        match: ["/home"],
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/people",
        label: "People",
        icon: Users,
        permission: PERMISSIONS.person.list,
        match: ["/people"],
      },
    ],
  },
  {
    label: "Academics",
    items: [
      {
        href: "/academics/years",
        label: "Academic Years",
        icon: CalendarRange,
        permission: PERMISSIONS.academicYear.list,
        match: ["/academics/years"],
      },
      {
        href: "/academics/terms",
        label: "Terms",
        icon: CalendarDays,
        permission: PERMISSIONS.academicTerm.list,
        match: ["/academics/terms"],
      },
      {
        href: "/academics/classes",
        label: "Classes",
        icon: LayoutGrid,
        permission: PERMISSIONS.academicClass.list,
        match: ["/academics/classes"],
      },
      {
        href: "/academics/subjects",
        label: "Subjects",
        icon: Library,
        permission: PERMISSIONS.subject.list,
        match: ["/academics/subjects"],
      },
      {
        href: "/academics/subject-assignments",
        label: "Subject Assignments",
        icon: ListChecks,
        permission: PERMISSIONS.classSubject.list,
        match: ["/academics/subject-assignments"],
      },
      {
        href: "/academics/cohorts",
        label: "Sections",
        icon: GraduationCap,
        permission: PERMISSIONS.cohort.list,
        match: ["/academics/cohorts"],
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/settings/school",
        label: "School Profile",
        icon: School,
        permission: PERMISSIONS.school.read,
        match: ["/settings/school"],
      },
      {
        href: "/settings/users",
        label: "Users",
        icon: UserRoundCog,
        permission: PERMISSIONS.user.list,
        match: ["/settings/users"],
      },
      {
        href: "/settings/roles",
        label: "Roles",
        icon: ShieldCheck,
        permission: PERMISSIONS.role.list,
        match: ["/settings/roles"],
      },
      {
        href: "/settings/memberships",
        label: "Access",
        icon: Settings,
        permission: PERMISSIONS.membership.list,
        match: ["/settings/memberships"],
      },
    ],
  },
];

/** Human-readable breadcrumb labels for route segments. */
export const SEGMENT_LABELS: Record<string, string> = {
  home: "Home",
  people: "People",
  academics: "Academics",
  years: "Academic Years",
  terms: "Terms",
  classes: "Classes",
  subjects: "Subjects",
  "subject-assignments": "Subject Assignments",
  cohorts: "Sections",
  settings: "Settings",
  school: "School Profile",
  users: "Users",
  roles: "Roles",
  memberships: "Access",
};

/** Which sidebar item owns each route prefix (for active states). */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const matches = item.match ?? [item.href];
  return matches.some(
    (m) => pathname === m || (m !== "/" && pathname.startsWith(`${m}/`)),
  );
}

/** Is any item of the group active on this pathname? */
export function isNavGroupActive(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => isNavItemActive(item, pathname));
}
