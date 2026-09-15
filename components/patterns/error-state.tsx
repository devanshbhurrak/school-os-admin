"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/error-messages";

interface ErrorStateProps {
  /** The thrown error; mapped to a human message via its error code. */
  error?: unknown;
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Show a "Go to Home" link when no retry is available. */
  showHome?: boolean;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  error,
  title = "Something went wrong",
  description,
  onRetry,
  showHome = true,
  compact = false,
  className,
}: ErrorStateProps) {
  const message = description ?? errorMessage(error);
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 px-6 text-center ${
        compact ? "py-10" : "py-16"
      } ${className ?? ""}`}
    >
      <div className="mb-1 flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-6 text-destructive" aria-hidden />
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <div className="mt-3 flex items-center gap-2">
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {showHome && !onRetry ? (
          <Button size="sm" variant="outline" asChild>
            <Link href="/home">Go to Home</Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
