"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createMembership,
  grantRoleToMembership,
  listRoles,
  listSchools,
  listUsers,
} from "@/services";
import type {
  Membership,
  MembershipCreate,
  Role,
  RoleGrantCreate,
} from "@/types";
import { orgKeys, STALE_TIME } from "@/lib/query-keys";
import { mapFieldErrors, showMutationError } from "@/lib/error-messages";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { membershipFormSchema, type MembershipFormValues } from "./schemas";
import { MultiSelect } from "@/components/patterns/multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MembershipCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function MembershipCreateDialog({
  open,
  onOpenChange,
  userId,
}: MembershipCreateDialogProps) {
  const queryClient = useQueryClient();
  const { activeSchool } = useSchoolContextValue();

  const schoolsQuery = useQuery({
    queryKey: orgKeys.schools(),
    queryFn: () => listSchools(),
    enabled: open,
    staleTime: STALE_TIME.config,
  });

  const rolesQuery = useQuery({
    queryKey: orgKeys.roles(),
    queryFn: () => listRoles({ limit: 50 }),
    enabled: open,
    staleTime: STALE_TIME.config,
  });

  const usersQuery = useQuery({
    queryKey: orgKeys.users(),
    queryFn: () => listUsers({ limit: 50 }),
    enabled: open && !userId,
    staleTime: STALE_TIME.config,
  });

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<MembershipFormValues>({
    resolver: zodResolver(membershipFormSchema),
    defaultValues: {
      user_id: userId ?? "",
      school_id: activeSchool?.id ?? "",
      start_date: "",
      end_date: "",
      is_default: false,
      role_ids: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      user_id: userId ?? "",
      school_id: activeSchool?.id ?? "",
      start_date: "",
      end_date: "",
      is_default: false,
      role_ids: [],
    });
  }, [open, userId, activeSchool?.id, reset]);

  const mutation = useMutation({
    mutationFn: (values: MembershipFormValues) => {
      const payload: MembershipCreate = {
        user_id: values.user_id,
        school_id: values.school_id || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        is_default: !!values.is_default,
        role_ids: values.role_ids,
      };
      return createMembership(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "memberships"] });
      toast.success("Membership added");
      onOpenChange(false);
    },
    onError: (error) => {
      if (mapFieldErrors(error, setError)) return;
      showMutationError(error);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  const selectedSchoolId = watch("school_id") ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add membership</DialogTitle>
          <DialogDescription>
            Give this user access to a school with an optional set of roles.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          {!userId ? (
            <div className="space-y-1.5">
              <Label htmlFor="mc-user">User *</Label>
              <Select
                value={watch("user_id")}
                onValueChange={(value) => setValue("user_id", value)}
              >
                <SelectTrigger id="mc-user" className="w-full">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {usersQuery.isPending ? (
                    <SelectItem value="__loading__" disabled>
                      Loading users…
                    </SelectItem>
                  ) : (
                    (usersQuery.data?.items ?? []).map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email ?? user.phone ?? user.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.user_id ? (
                <p className="text-xs text-destructive" role="alert">
                  {errors.user_id.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="mc-school">School</Label>
            <Select
              value={selectedSchoolId}
              onValueChange={(value) => setValue("school_id", value)}
            >
              <SelectTrigger id="mc-school" className="w-full">
                <SelectValue placeholder="Platform (no school)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Platform (no school)</SelectItem>
                {schoolsQuery.data?.items?.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mc-start">Start date</Label>
              <Input id="mc-start" type="date" {...registerDate("start_date")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mc-end">End date</Label>
              <Input id="mc-end" type="date" {...registerDate("end_date")} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="mc-default">Default membership</Label>
              <p className="text-xs text-muted-foreground">
                Used when signing in with this user.
              </p>
            </div>
            <Switch
              id="mc-default"
              checked={!!watch("is_default")}
              onCheckedChange={(checked) => setValue("is_default", checked)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Roles</Label>
            <MultiSelect
              options={(rolesQuery.data?.items ?? []).map((role) => ({
                value: role.id,
                label: role.name,
              }))}
              values={watch("role_ids")}
              onValuesChange={(values) => setValue("role_ids", values)}
              placeholder="Select roles…"
              disabled={rolesQuery.isPending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Add membership
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  function registerDate(name: "start_date" | "end_date") {
    return {
      name,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setValue(name, event.target.value),
      value: watch(name) ?? "",
    };
  }
}

interface GrantRoleDialogProps {
  membership: Membership;
  roles: Role[];
  rolesLoading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrantRoleDialog({
  membership,
  roles,
  rolesLoading,
  open,
  onOpenChange,
}: GrantRoleDialogProps) {
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const mutation = useMutation({
    mutationFn: () => {
      const payload: RoleGrantCreate = { role_id: selectedRole };
      return grantRoleToMembership(membership.id, payload);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(orgKeys.membership(saved.id), saved);
      queryClient.invalidateQueries({ queryKey: ["org", "memberships"] });
      toast.success("Role granted");
      onOpenChange(false);
    },
    onError: (error) => {
      showMutationError(error);
    },
  });

  const availableRoles = roles.filter(
    (role) => !membership.role_codes.includes(role.code),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant role</DialogTitle>
          <DialogDescription>
            Assign an additional role to this membership.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (selectedRole) void mutation.mutateAsync(undefined);
          }}
          className="space-y-5"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="gr-role">Role *</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger id="gr-role" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {rolesLoading ? (
                  <SelectItem value="__loading__" disabled>
                    Loading roles…
                  </SelectItem>
                ) : availableRoles.length === 0 ? (
                  <SelectItem value="__none__" disabled>
                    All roles already granted
                  </SelectItem>
                ) : (
                  availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedRole || mutation.isPending}
            >
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Grant role
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}