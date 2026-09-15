"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export function BillingSoon() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">Subscriptions, plans, invoices, and usage</p>
      </div>

      <Card className="border-dashed">
        <CardHeader className="items-center text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <CreditCard className="size-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-base">Coming Soon</CardTitle>
          <CardDescription>Billing will be available when the subscription model ships.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mx-auto max-w-lg text-sm text-muted-foreground">
            The Organization model already has <span className="font-mono">plan_code</span> and <span className="font-mono">entitlements</span> fields.
            Billing will extend these with subscription lifecycle, invoicing, and usage tracking.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-2.5 py-1">Subscriptions</span>
            <span className="rounded-full border px-2.5 py-1">Plans</span>
            <span className="rounded-full border px-2.5 py-1">Invoices</span>
            <span className="rounded-full border px-2.5 py-1">Usage Metrics</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
