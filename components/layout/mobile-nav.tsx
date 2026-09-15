"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePermissions } from "@/hooks/use-permissions";
import { isNavItemActive, NAV_GROUPS } from "./nav-config";
import { cn } from "@/lib/utils";

const MOBILE_TAB_PERMISSIONS: Record<string, string | undefined> = {
  Home: undefined,
  People: "people.person.list",
  Academics: "academic.academic_year.list",
  Settings: "iam.school.read",
};

/**
 * Bottom tab bar for small screens: Home, People, Academics, Settings.
 */
export function MobileNav() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();

  const tabs = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => !item.permission || hasPermission(item.permission),
    ),
  }))
    .map((group) => ({
      label: group.label,
      href: group.items[0]?.href ?? "/home",
      permission: MOBILE_TAB_PERMISSIONS[group.label],
      active: group.items.some((item) => isNavItemActive(item, pathname)),
      icon: group.items[0]?.icon,
    }))
    .filter((tab) => tab.href && tab.icon)
    .filter((tab) => !tab.permission || hasPermission(tab.permission));

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t bg-background/95 backdrop-blur lg:hidden"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          aria-current={tab.active ? "page" : undefined}
          className={cn(
            "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground",
            tab.active && "text-primary",
          )}
        >
          {tab.icon ? <tab.icon className="size-5" aria-hidden /> : null}
          <span className="leading-none">{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
