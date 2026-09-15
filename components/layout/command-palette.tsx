"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarRange, GraduationCap, Users } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { usePermissions } from "@/hooks/use-permissions";
import { PERMISSIONS } from "@/lib/permissions";
import { schoolKeys } from "@/lib/query-keys";
import { listCohorts, listPersons } from "@/services";
import { StatusBadge } from "@/components/ui/status-badge";
import { personDisplayName } from "@/lib/format";
import type { LucideIcon } from "lucide-react";

interface PaletteAction {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  href: string;
  permission?: string;
}

const ACTIONS: PaletteAction[] = [
  {
    id: "add-person",
    label: "Add a person",
    hint: "People",
    icon: Users,
    href: "/people?new=1",
    permission: PERMISSIONS.person.create,
  },
  {
    id: "create-section",
    label: "Create a section",
    hint: "Academics",
    icon: GraduationCap,
    href: "/academics/cohorts?new=1",
    permission: PERMISSIONS.cohort.create,
  },
  {
    id: "configure-year",
    label: "Configure academic year",
    hint: "Academics",
    icon: CalendarRange,
    href: "/academics/years",
    permission: PERMISSIONS.academicYear.list,
  },
  {
    id: "manage-users",
    label: "Manage users & access",
    hint: "Settings",
    icon: Users,
    href: "/settings/users",
    permission: PERMISSIONS.user.list,
  },
  {
    id: "manage-roles",
    label: "Manage roles",
    hint: "Settings",
    icon: Users,
    href: "/settings/roles",
    permission: PERMISSIONS.role.list,
  },
];

interface CommandPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CommandPalette({ open: controlledOpen, onOpenChange: controlledOnOpenChange }: CommandPaletteProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { activeSchool, activeYear } = useSchoolContextValue();
  const { hasPermission } = usePermissions();

  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const searchTerm = query.trim().length >= 2 ? query.trim() : null;

  const personsQuery = useQuery({
    queryKey: schoolKeys.persons(activeSchool?.id ?? "", {
      search: searchTerm ?? undefined,
      limit: 8,
    }),
    queryFn: () => listPersons({ search: searchTerm ?? undefined, limit: 8 }),
    enabled: !!searchTerm && !!activeSchool?.id,
    staleTime: 30_000,
    select: (data) => data.items,
  });

  const cohortsQuery = useQuery({
    queryKey: schoolKeys.cohorts(activeSchool?.id ?? "", {
      academic_year_id: activeYear?.id,
      limit: 8,
    }),
    queryFn: () =>
      listCohorts({
        academic_year_id: activeYear?.id,
        limit: 8,
      }),
    enabled: !!activeSchool?.id && !!activeYear?.id,
    staleTime: 5 * 60_000,
    select: (data) => data.items,
  });

  const visibleActions = ACTIONS.filter(
    (action) => !action.permission || hasPermission(action.permission),
  );

  const cohortMatches = (cohortsQuery.data ?? []).filter((cohort) => {
    if (!searchTerm) return true;
    return cohort.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const navigate = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search School OS">
      <CommandInput
        placeholder="Search people, sections, actions…"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        <CommandGroup heading="Actions">
          {visibleActions.map((action) => (
            <CommandItem
              key={action.id}
              value={action.label}
              onSelect={() => navigate(action.href)}
            >
              <action.icon className="size-4" aria-hidden />
              <span>{action.label}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {action.hint}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        {!query.trim() && cohortMatches.length > 0 ? (
          <CommandGroup heading="Sections">
            {cohortMatches.slice(0, 5).map((cohort) => (
              <CommandItem
                key={cohort.id}
                value={`section ${cohort.name} ${cohort.code}`}
                onSelect={() => navigate(`/academics/cohorts/${cohort.id}`)}
              >
                <GraduationCap className="size-4" aria-hidden />
                <span>{cohort.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  Section
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {searchTerm ? (
          <CommandGroup heading="People">
            {personsQuery.isLoading ? (
              <CommandItem disabled>Searching people…</CommandItem>
            ) : (
              (personsQuery.data ?? []).map((person) => (
                <CommandItem
                  key={person.id}
                  value={`person ${personDisplayName(person)}`}
                  onSelect={() => navigate(`/people/${person.id}`)}
                >
                  <Users className="size-4" aria-hidden />
                  <span>{personDisplayName(person)}</span>
                  <span className="ml-auto">
                    <StatusBadge status={person.status} />
                  </span>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        ) : null}
        <CommandSeparator />
        <p className="p-2 text-center text-xs text-muted-foreground">
          Tip: press <kbd className="rounded border bg-muted px-1">⌘</kbd>{" "}
          <kbd className="rounded border bg-muted px-1">K</kbd> anywhere to search
        </p>
      </CommandList>
    </CommandDialog>
  );
}
