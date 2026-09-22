"use client";

import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const DEFAULTS = [
  { label: "Product Name", value: "School OS" },
  { label: "Support Email", value: "support@schoolos.com" },
  { label: "Support Phone", value: "+91 11 0000 0000" },
  { label: "Default Timezone", value: "Asia/Kolkata" },
  { label: "Default Locale", value: "en-IN" },
];

export function PlatformProfile() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-300">
        <Info className="mt-0.5 size-4 shrink-0" />
        <span>Platform settings require a dedicated settings API (Phase 2). Values shown are defaults.</span>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Platform Identity</CardTitle>
          <CardDescription>Product and support information shown across the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="divide-y">
            {DEFAULTS.map(({ label, value }) => (
              <div key={label} className="grid grid-cols-2 gap-4 py-3 text-sm">
                <dt className="font-medium text-muted-foreground">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
