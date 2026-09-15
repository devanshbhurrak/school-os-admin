"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DangerZoneAction {
  label: string;
  description: string;
  /** The exact string the user must type to enable the button. */
  confirmValue: string;
  confirmPrompt?: string;
  buttonLabel: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

interface DangerZoneProps {
  actions: DangerZoneAction[];
  className?: string;
}

function DangerAction({
  label,
  description,
  confirmValue,
  confirmPrompt,
  buttonLabel,
  onConfirm,
  isLoading,
}: DangerZoneAction) {
  const [input, setInput] = useState("");
  const confirmed = input === confirmValue;

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        <div className="mt-3 space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {confirmPrompt ?? (
              <>
                Type <span className="font-mono font-semibold text-foreground">{confirmValue}</span> to confirm
              </>
            )}
          </Label>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={confirmValue}
            className="h-8 max-w-xs font-mono text-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>
      <div className="shrink-0">
        <Button
          variant="destructive"
          size="sm"
          disabled={!confirmed || isLoading}
          onClick={onConfirm}
        >
          {isLoading ? "Working…" : buttonLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * Red-bordered danger zone section housing one or more destructive actions,
 * each requiring the user to type a confirmation string before proceeding.
 */
export function DangerZone({ actions, className }: DangerZoneProps) {
  return (
    <div className={cn("rounded-lg border border-red-200 bg-red-50/40 dark:border-red-900/50 dark:bg-red-950/20", className)}>
      <div className="flex items-center gap-2 border-b border-red-200 px-4 py-3 dark:border-red-900/50">
        <AlertTriangle className="size-4 shrink-0 text-red-600 dark:text-red-500" />
        <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Danger Zone</h3>
      </div>
      <div className="divide-y divide-red-200/60 px-4 dark:divide-red-900/40">
        {actions.map((action) => (
          <DangerAction key={action.label} {...action} />
        ))}
      </div>
    </div>
  );
}
