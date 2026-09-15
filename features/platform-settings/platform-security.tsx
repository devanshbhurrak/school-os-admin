"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";

export function PlatformSecurity() {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Shield className="size-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-base">Security — Coming Soon</CardTitle>
        <CardDescription>Password policy, session policy, and 2FA requirements</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">Deferred until security policy API is available.</p>
      </CardContent>
    </Card>
  );
}
