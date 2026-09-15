"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  LogOut,
  UserRound,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { initials } from "@/lib/format";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SchoolSelectorSubmenu } from "./school-selector";

export function UserMenu() {
  const { user, logout } = useAuth();
  const { activeSchool } = useSchoolContextValue();
  const router = useRouter();

  const displayName = useMemo(() => {
    if (!user) return "";
    return user.email ?? user.phone ?? "User";
  }, [user]);

  const roleLabel = useMemo(() => {
    if (!user) return "";
    const roles = user.role_codes.map((code) =>
      code
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    );
    if (user.is_platform_admin) return "Platform Admin";
    const context = activeSchool ? ` at ${activeSchool.name}` : "";
    return `${roles[0] ?? "User"}${context}`;
  }, [user, activeSchool]);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-1.5"
          aria-label="User menu"
        >
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials(user?.email ?? user?.phone ?? "U")}
            </AvatarFallback>
          </Avatar>
          <span className="hidden max-w-40 flex-col items-start text-left lg:flex">
            <span className="max-w-full truncate text-xs font-medium leading-tight">
              {displayName}
            </span>
            <span className="max-w-full truncate text-[11px] leading-tight text-muted-foreground">
              {roleLabel}
            </span>
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-foreground">
              {displayName}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {roleLabel}
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <SchoolSelectorSubmenu />
        <DropdownMenuItem asChild>
          <Link href="/change-password">
            <KeyRound className="size-4" aria-hidden />
            Change password
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function UserIdentity() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-8">
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials(user.email ?? user.phone ?? "U")}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">
          <UserRound className="mr-1 inline size-3.5" aria-hidden />
          {user.email ?? user.phone}
        </span>
      </div>
    </div>
  );
}
