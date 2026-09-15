"use client";

import Link from "next/link";
import { Bell, GraduationCap, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SchoolSelector } from "./school-selector";
import { YearSelector } from "./year-selector";
import { UserMenu } from "./user-menu";

interface HeaderProps {
  onSearchClick?: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
      {/* Logo — visible on mobile only (sidebar is hidden on small screens) */}
      <Link
        href="/home"
        className="flex shrink-0 items-center gap-2 lg:hidden"
        aria-label="School OS home"
      >
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-4" aria-hidden />
        </span>
        <span className="text-sm font-semibold tracking-tight">School OS</span>
      </Link>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SchoolSelector className="hidden md:flex" />
        <div className="hidden md:block">
          <YearSelector />
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-8 w-full max-w-60 justify-start gap-2 font-normal text-muted-foreground"
        data-command-trigger
        aria-label="Search (⌘K)"
        onClick={onSearchClick}
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="pointer-events-none rounded border bg-muted px-1 font-mono text-[10px]">
          ⌘K
        </kbd>
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            disabled
            aria-label="Notifications (coming soon)"
          >
            <Bell className="size-4.5" aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications are coming soon</TooltipContent>
      </Tooltip>

      <UserMenu />
    </header>
  );
}
