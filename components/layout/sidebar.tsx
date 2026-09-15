"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/hooks/use-permissions";
import { NAV_GROUPS, isNavGroupActive, isNavItemActive } from "./nav-config";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const COLLAPSE_KEY = "school-os.sidebar-collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { hasPermission } = usePermissions();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  const visibleGroups = NAV_GROUPS.filter((group) =>
    group.items.some(
      (item) => !item.permission || hasPermission(item.permission),
    ),
  );

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div className={cn("flex h-14 shrink-0 items-center gap-2 border-b px-3", collapsed && "justify-center px-0")}>
        <Link
          href="/home"
          className="flex min-w-0 items-center gap-2"
          aria-label="School OS home"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-4.5" aria-hidden />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">
              School OS
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Main navigation">
        {visibleGroups.map((group) => {
          const groupActive = isNavGroupActive(group, pathname);
          return (
            <div key={group.label}>
              {!collapsed && (
                <p
                  className={cn(
                    "mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
                    groupActive && "text-foreground",
                  )}
                >
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items
                  .filter((item) => !item.permission || hasPermission(item.permission))
                  .map((item) => {
                    const active = isNavItemActive(item, pathname);
                    const link = (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          active &&
                            "bg-sidebar-accent text-sidebar-accent-foreground",
                          collapsed && "justify-center px-0",
                        )}
                      >
                        <item.icon className="size-4 shrink-0" aria-hidden />
                        {!collapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </Link>
                    );
                    return collapsed ? (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      <li key={item.href}>{link}</li>
                    );
                  })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className={cn("border-t p-2", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full text-muted-foreground"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <>
              <PanelLeftClose className="size-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
