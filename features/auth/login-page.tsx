"use client";

import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "./login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginPage({ notice }: { notice: "changed" | null }) {
  return (
    <div className="space-y-4">
      {notice === "changed" ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          <CheckCircle2 className="size-4" aria-hidden />
          <AlertDescription>
            Password changed. Sign in with your new password.
          </AlertDescription>
        </Alert>
      ) : null}
      <LoginForm />
    </div>
  );
}