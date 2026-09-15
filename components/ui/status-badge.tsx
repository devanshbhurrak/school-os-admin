import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/display";

type Tone = "green" | "gray" | "blue" | "amber" | "red" | "zinc";

const TONE_STYLES: Record<Tone, { badge: string; dot: string }> = {
  green: {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  gray: {
    badge: "border-gray-200 bg-gray-100 text-gray-700 dark:border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-300",
    dot: "bg-gray-400",
  },
  blue: {
    badge: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  amber: {
    badge: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  red: {
    badge: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300",
    dot: "bg-red-500",
  },
  zinc: {
    badge: "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-500/10 dark:text-zinc-300",
    dot: "bg-zinc-400",
  },
};

const STATUS_TONES: Record<string, Tone> = {
  ACTIVE: "green",
  INACTIVE: "gray",
  DRAFT: "gray",
  ARCHIVED: "gray",
  CLOSED: "gray",
  ENDED: "gray",
  SETUP: "blue",
  INVITED: "blue",
  TRIAL: "blue",
  CURRENT: "blue",
  SUSPENDED: "amber",
  MERGED: "amber",
  DECEASED: "zinc",
  DISABLED: "red",
};

export interface StatusMeta {
  label: string;
  tone: Tone;
}

export function getStatusMeta(status: string): StatusMeta {
  return {
    label: STATUS_LABELS[status] ?? status,
    tone: STATUS_TONES[status] ?? "gray",
  };
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

/** Semantic status badge with a leading dot so status is never color-only. */
export function StatusBadge({ status, className }: StatusBadgeProps) {
  const meta = getStatusMeta(status);
  const styles = TONE_STYLES[meta.tone];
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 py-0.5 font-medium", styles.badge, className)}
    >
      <span className={cn("size-1.5 rounded-full", styles.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}
