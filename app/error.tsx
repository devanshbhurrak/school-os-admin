"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary — catches unhandled errors thrown during rendering in
 * the root layout and any segment that doesn't have its own error.tsx.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log to an error-reporting service when available
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-8 text-destructive" aria-hidden />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              An unexpected error occurred. Our team has been notified.
            </p>
            {error.digest ? (
              <p className="text-xs text-muted-foreground">
                Error ID:{" "}
                <code className="font-mono">{error.digest}</code>
              </p>
            ) : null}
          </div>
          <Button onClick={reset} size="sm">
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
