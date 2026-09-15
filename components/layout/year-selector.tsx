"use client";

import { CalendarRange, Check, ChevronsUpDown } from "lucide-react";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Academic year selector — auto-selects the `is_current` year. */
export function YearSelector({ className }: { className?: string }) {
  const { years, activeYear, setActiveYearId, isLoadingYears } =
    useSchoolContextValue();

  if (isLoadingYears && !years.length) {
    return <Skeleton className={cn("h-7 w-28", className)} />;
  }

  if (!years.length) {
    return (
      <span className={cn("hidden text-sm text-muted-foreground md:inline", className)}>
        No academic year
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 max-w-44 justify-between gap-1.5 font-medium text-muted-foreground", className)}
          aria-label="Select academic year"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <CalendarRange className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{activeYear?.name ?? "Select year"}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Academic year
        </DropdownMenuLabel>
        {years.map((year) => (
          <DropdownMenuItem
            key={year.id}
            onSelect={() => setActiveYearId(year.id)}
            className="gap-2"
          >
            <CalendarRange className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{year.name}</span>
            {year.is_current ? (
              <span className="text-xs font-medium text-primary">Current</span>
            ) : null}
            {activeYear?.id === year.id ? (
              <Check className="size-4 shrink-0 text-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
