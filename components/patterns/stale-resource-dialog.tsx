"use client";

import { RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface StaleResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fetch the latest record, refresh the form, then close the dialog. */
  onReload: () => void | Promise<void>;
  /** Called when the user keeps their local changes. */
  onDismiss?: () => void;
  loading?: boolean;
}

/**
 * Shown when a mutation returns STALE_RESOURCE (409): the record was
 * modified by someone else since the user loaded it.
 */
export function StaleResourceDialog({
  open,
  onOpenChange,
  onReload,
  onDismiss,
  loading = false,
}: StaleResourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modified by someone else</DialogTitle>
          <DialogDescription>
            This record was updated by another user while you were working on it.
            Would you like to reload with the latest changes?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => {
              onDismiss?.();
              onOpenChange(false);
            }}
            disabled={loading}
          >
            Keep my changes
          </Button>
          <Button onClick={onReload} disabled={loading}>
            {loading ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Reload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
