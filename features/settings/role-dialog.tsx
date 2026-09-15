"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRole, getRole, updateRole } from "@/services";
import type { Role, RoleCreate, RoleUpdate } from "@/types";
import { orgKeys } from "@/lib/query-keys";
import { PERMISSION_CATALOGUE } from "@/lib/permissions";
import { DATA_SCOPE_LABELS } from "@/lib/display";
import {
  isStaleResourceError,
  mapFieldErrors,
  showMutationError,
} from "@/lib/error-messages";
import { roleFormSchema, type RoleFormValues } from "./schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StaleResourceDialog } from "@/components/patterns/stale-resource-dialog";
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

export const ROLE_SCOPE_OPTIONS = [
  { value: "SCHOOL", label: "School" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "PLATFORM", label: "Platform" },
];

const DATA_SCOPE_OPTIONS = (["OWN", "ASSIGNED", "SCHOOL", "ORGANIZATION", "PLATFORM"] as const)
  .map((scope) => ({ value: scope, label: DATA_SCOPE_LABELS[scope] }));

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
}

export function RoleDialog({ open, onOpenChange, role }: RoleDialogProps) {
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);
  const editing = !!role;
  const isSystemRole = !!role?.is_system;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      scope_level: "SCHOOL",
      data_scope: "SCHOOL",
      permission_codes: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    if (role) {
      reset({
        code: role.code,
        name: role.name,
        description: role.description ?? "",
        scope_level: role.scope_level,
        data_scope: role.data_scope,
        permission_codes: [...role.permission_codes],
      });
    } else {
      reset({
        code: "",
        name: "",
        description: "",
        scope_level: "SCHOOL",
        data_scope: "SCHOOL",
        permission_codes: [],
      });
    }
  }, [open, role, reset]);

  const mutation = useMutation({
    mutationFn: (values: RoleFormValues) => {
      if (role) {
        const payload: RoleUpdate = {
          name: values.name.trim(),
          description: values.description?.trim() || null,
          data_scope: values.data_scope as Role["data_scope"],
          permission_codes: values.permission_codes,
          version: role.version,
        };
        return updateRole(role.id, payload);
      }
      const payload: RoleCreate = {
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || null,
        scope_level: values.scope_level as Role["scope_level"],
        data_scope: values.data_scope as Role["data_scope"],
        permission_codes: values.permission_codes,
      };
      return createRole(payload);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(orgKeys.role(saved.id), saved);
      queryClient.invalidateQueries({ queryKey: ["org", "roles"] });
      toast.success(role ? "Role updated" : "Role created");
      onOpenChange(false);
    },
    onError: (error) => {
      if (isStaleResourceError(error)) {
        setStaleOpen(true);
        return;
      }
      if (mapFieldErrors(error, setError)) return;
      showMutationError(error);
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await mutation.mutateAsync(values);
  });

  async function reloadFresh() {
    if (!role) return;
    try {
      const fresh = await getRole(role.id);
      queryClient.setQueryData(orgKeys.role(role.id), fresh);
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    }
  }

  const permissionCodes = watch("permission_codes");

  function togglePermission(code: string) {
    setValue(
      "permission_codes",
      permissionCodes.includes(code)
        ? permissionCodes.filter((c) => c !== code)
        : [...permissionCodes, code],
    );
  }

  const hasRolePerm = (code: string) =>
    permissionCodes.includes(code) || (role?.is_system ?? false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{role ? "Edit role" : "Create role"}</DialogTitle>
            <DialogDescription>
              {role
                ? "Update the name, scope and permissions for this role."
                : "Define a role and the permissions it grants."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="r-code">Code *</Label>
                <Input
                  id="r-code"
                  placeholder="e.g. class_teacher"
                  disabled={editing || isSystemRole}
                  aria-invalid={!!errors.code}
                  {...register("code")}
                />
                {errors.code ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.code.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-name">Name *</Label>
                <Input
                  id="r-name"
                  placeholder="e.g. Class teacher"
                  disabled={role?.is_system}
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-desc">Description</Label>
              <Input id="r-desc" {...register("description")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="r-scope">Scope *</Label>
                <Select
                  value={watch("scope_level")}
                  onValueChange={(value) => setValue("scope_level", value)}
                >
                  <SelectTrigger id="r-scope" className="w-full" disabled={editing}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-data">Data scope *</Label>
                <Select
                  value={watch("data_scope")}
                  onValueChange={(value) => setValue("data_scope", value)}
                >
                  <SelectTrigger id="r-data" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="max-h-56 space-y-4 overflow-y-auto rounded-md border p-3">
                {PERMISSION_CATALOGUE.map((module) => (
                  <div key={module.module}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {module.moduleLabel}
                    </p>
                    <div className="space-y-3">
                      {module.resources.map((resource) => (
                        <div key={resource.resource}>
                          <p className="mb-1 text-sm font-medium">
                            {resource.resourceLabel}
                          </p>
                          <div className="grid gap-1 sm:grid-cols-2">
                            {resource.actions.map((permission) => {
                              const granted = hasRolePerm(permission.code);
                              return (
                                <label
                                  key={permission.code}
                                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-accent"
                                >
                                  <input
                                    type="checkbox"
                                    checked={granted}
                                    disabled={role?.is_system}
                                    onChange={() => togglePermission(permission.code)}
                                    className="size-3.5 accent-primary"
                                  />
                                  {permission.label}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {role?.is_system ? (
                <p className="text-xs text-muted-foreground">
                  System roles have a fixed set of permissions.
                </p>
              ) : null}
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
                {role ? "Save changes" : "Create role"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={reloadFresh}
        onDismiss={() => setStaleOpen(false)}
        loading={mutation.isPending}
      />
    </>
  );
}