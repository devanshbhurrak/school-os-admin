"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";
import { PlatformCommandPalette } from "./platform-command-palette";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PlatformSidebar } from "./platform-sidebar";

export function PlatformHeader() {
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="lg:hidden" aria-label="Open navigation">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-slate-900 text-white border-slate-800">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <PlatformSidebar mobile onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link
          href="/platform/dashboard"
          className="flex shrink-0 items-center gap-2 lg:hidden"
          aria-label="Platform Admin home"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GraduationCap className="size-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-tight">School OS</span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center gap-2 lg:flex">
          <span className="font-mono text-xs font-semibold tracking-widest text-indigo-400 uppercase">Platform Admin</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
          <span className="font-mono text-[10px] font-semibold tracking-widest text-indigo-400 uppercase">Platform Admin</span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full max-w-60 justify-start gap-2 font-normal text-muted-foreground"
          aria-label="Search (⌘K)"
          onClick={() => setOpen(true)}
        >
          <Search className="size-4" aria-hidden />
          <span className="flex-1 text-left hidden sm:inline">Search…</span>
          <kbd className="pointer-events-none hidden rounded border bg-muted px-1 font-mono text-[10px] sm:inline-flex">⌘K</kbd>
        </Button>

        <UserMenu />
      </header>
      <PlatformCommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}
