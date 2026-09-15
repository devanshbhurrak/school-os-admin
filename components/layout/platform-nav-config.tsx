"use client";

import {
  Activity,
  Building2,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import type { NavGroup, NavItem } from "./nav-config";

export const PLATFORM_NAV_GROUPS: NavGroup[] = [
  {
    label: "OVERVIEW",
    items: [
      { href: "/platform/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "ORGANIZATIONS",
    items: [
      {
        href: "/platform/organizations",
        label: "Organizations",
        icon: Building2,
        match: ["/platform/organizations"],
      },
      {
        href: "/platform/schools",
        label: "Schools",
        icon: GraduationCap,
        match: ["/platform/schools"],
      },
    ],
  },
  {
    label: "IDENTITY",
    items: [
      { href: "/platform/users", label: "Users", icon: Users },
      { href: "/platform/roles", label: "Roles", icon: Shield },
    ],
  },
  {
    label: "PLATFORM",
    items: [
      { href: "/platform/audit", label: "Audit Log", icon: ScrollText },
      {
        href: "/platform/system",
        label: "System",
        icon: Activity,
      },
    ],
  },
  {
    label: "BUSINESS",
    items: [
      {
        href: "/platform/billing",
        label: "Billing",
        icon: CreditCard,
        badge: "Soon",
      },
    ],
  },
];

export const PLATFORM_SETTINGS_NAV: NavItem = {
  href: "/platform/settings",
  label: "Settings",
  icon: Settings,
};
