"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Building2, GraduationCap, Users, Plus, ScrollText, Settings } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { listOrganizations, listSchools, listUsers } from "@/services/iam";
import { platformKeys } from "@/lib/query-keys";

export function PlatformCommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const orgsQuery = useQuery({
    queryKey: platformKeys.organizations({ limit: 100 }),
    queryFn: () => listOrganizations({ limit: 100 }),
    enabled: open,
  });
  const schoolsQuery = useQuery({
    queryKey: platformKeys.schools({ limit: 100 }),
    queryFn: () => listSchools({ limit: 100 }),
    enabled: open,
  });
  const usersQuery = useQuery({
    queryKey: platformKeys.users({ limit: 100 }),
    queryFn: () => listUsers({ limit: 100 }),
    enabled: open,
  });

  const q = query.trim().toLowerCase();
  const orgs = (orgsQuery.data?.items ?? []).filter(
    (o) => !q || o.name.toLowerCase().includes(q) || o.code.toLowerCase().includes(q),
  );
  const schools = (schoolsQuery.data?.items ?? []).filter(
    (s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q),
  );
  const users = (usersQuery.data?.items ?? []).filter(
    (u) => !q || u.email?.toLowerCase().includes(q) || u.phone?.toLowerCase().includes(q),
  );

  function navigate(href: string) {
    onOpenChange(false);
    setQuery("");
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search Platform">
      <CommandInput placeholder="Search organizations, schools, users…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No results</CommandEmpty>

        {orgs.length > 0 && (
          <CommandGroup heading="Organizations">
            {orgs.slice(0, 5).map((org) => (
              <CommandItem key={org.id} value={`org ${org.name}`} onSelect={() => navigate(`/platform/organizations/${org.id}/overview`)}>
                <Building2 className="size-4" />
                <span>{org.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{org.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {schools.length > 0 && (
          <CommandGroup heading="Schools">
            {schools.slice(0, 5).map((s) => (
              <CommandItem key={s.id} value={`school ${s.name}`} onSelect={() => navigate(`/platform/schools/${s.id}/overview`)}>
                <GraduationCap className="size-4" />
                <span>{s.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{s.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {users.length > 0 && (
          <CommandGroup heading="Users">
            {users.slice(0, 5).map((u) => (
              <CommandItem key={u.id} value={`user ${u.email ?? u.phone}`} onSelect={() => navigate(`/platform/users/${u.id}/profile`)}>
                <Users className="size-4" />
                <span>{u.email ?? u.phone ?? u.id.slice(0, 8)}</span>
                <span className="ml-auto text-xs text-muted-foreground">{u.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandGroup heading="Actions">
          <CommandItem value="create organization" onSelect={() => navigate("/platform/organizations/new")}>
            <Plus className="size-4" />
            <span>Create Organization</span>
          </CommandItem>
          <CommandItem value="create school" onSelect={() => navigate("/platform/schools")}>
            <Plus className="size-4" />
            <span>Create School</span>
          </CommandItem>
          <CommandItem value="view audit log" onSelect={() => navigate("/platform/audit")}>
            <ScrollText className="size-4" />
            <span>View Platform Audit Log</span>
          </CommandItem>
          <CommandItem value="platform settings" onSelect={() => navigate("/platform/settings/profile")}>
            <Settings className="size-4" />
            <span>Platform Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />
        <p className="p-2 text-center text-xs text-muted-foreground">
          Tip: press <kbd className="rounded border bg-muted px-1">⌘</kbd> <kbd className="rounded border bg-muted px-1">K</kbd> anywhere
        </p>
      </CommandList>
    </CommandDialog>
  );
}
