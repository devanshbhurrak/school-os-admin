"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNavItemActive, isNavGroupActive } from "./nav-config";
import { PLATFORM_NAV_GROUPS, PLATFORM_SETTINGS_NAV } from "./platform-nav-config";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const COLLAPSE_KEY = "school-os.platform-sidebar-collapsed";

export function PlatformSidebar({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
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

  if (mobile) {
    return (
      <aside className="flex h-full w-64 flex-col bg-slate-900">
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-slate-800 px-3">
          <Link href="/platform/dashboard" className="flex min-w-0 items-center gap-2" aria-label="Platform Admin home" onClick={onNavigate}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <GraduationCap className="size-4.5" aria-hidden />
            </span>
            <span className="truncate text-sm font-semibold tracking-tight text-white">School OS</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Platform navigation">
          {PLATFORM_NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  const cls = cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                    item.badge ? "cursor-default text-slate-500" : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    active && !item.badge && "bg-slate-700 text-white",
                  );
                  const content = (
                    <>
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">{item.badge}</span>}
                    </>
                  );
                  return (
                    <li key={item.href}>
                      {item.badge ? (
                        <div className={cls} aria-disabled="true">{content}</div>
                      ) : (
                        <Link href={item.href} aria-current={active ? "page" : undefined} className={cls} onClick={onNavigate}>
                          {content}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="border-t border-slate-800 pt-3">
            <ul>
              <li>
                <Link href={PLATFORM_SETTINGS_NAV.href} className={cn("flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white", isNavItemActive(PLATFORM_SETTINGS_NAV, pathname) && "bg-slate-700 text-white")} onClick={onNavigate}>
                  <PLATFORM_SETTINGS_NAV.icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{PLATFORM_SETTINGS_NAV.label}</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col bg-slate-900 border-r border-slate-800 transition-[width] duration-200 lg:flex",
        collapsed ? "w-14" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b border-slate-800 px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <Link
          href="/platform/dashboard"
          className="flex min-w-0 items-center gap-2"
          aria-label="Platform Admin home"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GraduationCap className="size-4.5" aria-hidden />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight text-white">
              School OS
            </span>
          )}
        </Link>
      </div>

      <nav
        className="flex-1 space-y-5 overflow-y-auto px-2 py-4"
        aria-label="Platform navigation"
      >
        {PLATFORM_NAV_GROUPS.map((group) => {
          const groupActive = isNavGroupActive(group, pathname);
          return (
            <div key={group.label}>
              {!collapsed && (
                <p
                  className={cn(
                    "mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500",
                    groupActive && "text-slate-300",
                  )}
                >
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isNavItemActive(item, pathname);
                  const itemClass = cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                    item.badge
                      ? "cursor-default text-slate-500"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white",
                    active && !item.badge && "bg-slate-700 text-white",
                    collapsed && "justify-center px-0",
                  );
                  const content = (
                    <>
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </>
                  );
                  const link = item.badge ? (
                    <div key={item.href} className={itemClass} aria-disabled="true">
                      {content}
                    </div>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={itemClass}
                    >
                      {content}
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

        {/* Separator + Settings */}
        <div className="border-t border-slate-800 pt-3">
          <ul>
            {(() => {
              const item = PLATFORM_SETTINGS_NAV;
              const active = isNavItemActive(item, pathname);
              const link = (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white",
                    active && "bg-slate-700 text-white",
                    collapsed && "justify-center px-0",
                  )}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
              return collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ) : (
                <li>{link}</li>
              );
            })()}
          </ul>
        </div>
      </nav>

      <div className={cn("border-t border-slate-800 p-2", collapsed && "flex justify-center")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="w-full text-slate-400 hover:bg-slate-800 hover:text-white"
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
