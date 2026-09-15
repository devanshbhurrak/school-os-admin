"use client";

import { useMemo, useState } from "react";
import { Building2, Check, ChevronsUpDown, Search } from "lucide-react";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * School context selector. Auto-hidden (static text) for single-school users,
 * a searchable dropdown for multi-school users.
 */
export function SchoolSelector({ className }: { className?: string }) {
  const { schools, activeSchool, setActiveSchoolId, isLoadingSchools } =
    useSchoolContextValue();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(q) ||
        (school.short_name?.toLowerCase().includes(q) ?? false) ||
        school.code.toLowerCase().includes(q),
    );
  }, [schools, query]);

  if (isLoadingSchools) {
    return <Skeleton className="h-7 w-40" />;
  }

  if (schools.length <= 1) {
    return (
      <div className={cn("flex items-center gap-1.5 text-sm font-medium text-muted-foreground", className)}>
        <Building2 className="size-4" aria-hidden />
        <span className="max-w-40 truncate">
          {activeSchool?.name ?? (schools.length === 0 ? "No school" : "Select school")}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu onOpenChange={() => setQuery("")}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 max-w-56 justify-between gap-2 font-medium"
          aria-label="Select school"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate">{activeSchool?.name ?? "Select school"}</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Switch school
        </DropdownMenuLabel>
        <div className="px-2 pb-1">
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search schools…"
              className="h-8 pl-8"
              autoFocus
            />
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-72 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No schools found</p>
          ) : (
            filtered.map((school) => (
              <DropdownMenuItem
                key={school.id}
                onSelect={() => setActiveSchoolId(school.id)}
                className="gap-2"
              >
                <Building2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{school.name}</span>
                {school.short_name ? (
                  <span className="text-xs text-muted-foreground">
                    {school.short_name}
                  </span>
                ) : null}
                {activeSchool?.id === school.id ? (
                  <Check className="size-4 shrink-0 text-primary" aria-hidden />
                ) : null}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Submenu variant for the user menu (switch school while staying put). */
export function SchoolSelectorSubmenu() {
  const { schools, activeSchool, setActiveSchoolId } = useSchoolContextValue();
  if (schools.length <= 1) return null;
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Switch school</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="max-h-80 overflow-y-auto">
          {schools.map((school) => (
            <DropdownMenuItem
              key={school.id}
              onSelect={() => setActiveSchoolId(school.id)}
            >
              <span className="min-w-0 flex-1 truncate">{school.name}</span>
              {activeSchool?.id === school.id ? (
                <Check className="size-4 text-primary" aria-hidden />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
