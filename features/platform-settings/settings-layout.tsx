"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Profile", href: "/platform/settings/profile" },
  { label: "Default Roles", href: "/platform/settings/roles" },
  { label: "Security", href: "/platform/settings/security" },
  { label: "Email Templates", href: "/platform/settings/email-templates" },
];

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform Settings</h1>
        <p className="text-sm text-muted-foreground">Manage platform-wide configuration</p>
      </div>
      <nav className="flex flex-col sm:flex-row gap-1 border-b overflow-x-auto" aria-label="Settings tabs">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors border-b-2 sm:border-b-2 border-l-2 sm:border-l-0 -mb-px sm:-mb-px whitespace-nowrap",
                active ? "border-primary text-foreground bg-muted/30 sm:bg-transparent border-l-primary sm:border-b-primary" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/20",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div>{children}</div>
    </div>
  );
}
