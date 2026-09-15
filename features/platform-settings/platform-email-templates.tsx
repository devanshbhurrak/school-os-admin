"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail } from "lucide-react";

export function PlatformEmailTemplates() {
  return (
    <Card className="border-dashed">
      <CardHeader className="items-center text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Mail className="size-6 text-muted-foreground" />
        </div>
        <CardTitle className="text-base">Email Templates — Coming Soon</CardTitle>
        <CardDescription>Transactional email templates for platform notifications</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground">Deferred until email template management API is available.</p>
        <p className="text-xs text-muted-foreground mt-2">Will include: welcome, password reset, organization invite, and system notifications.</p>
      </CardContent>
    </Card>
  );
}
