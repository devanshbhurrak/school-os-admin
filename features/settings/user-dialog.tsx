"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createUser, updateUser, listSchools, getUser } from "@/services";
import type { User, UserCreate, UserUpdate } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { orgKeys, STALE_TIME } from "@/lib/query-keys";
import { STATUS_LABELS } from "@/lib/display";
import {
  isStaleResourceError,
  mapFieldErrors,
  showMutationError,
} from "@/lib/error-messages";
import { userFormSchema, type UserFormValues } from "./schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

export const USER_STATUS_OPTIONS = [
  { value: "INVITED", label: STATUS_LABELS.INVITED },
  { value: "ACTIVE", label: STATUS_LABELS.ACTIVE },
  { value: "SUSPENDED", label: STATUS_LABELS.SUSPENDED },
  { value: "DISABLED", label: STATUS_LABELS.DISABLED },
];

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserDialog({ open, onOpenChange, user }: UserDialogProps) {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { activeSchool } = useSchoolContextValue();
  const isPlatformAdmin = !!currentUser?.is_platform_admin;
  const [staleOpen, setStaleOpen] = useState(false);

  const schoolsQuery = useQuery({
    queryKey: orgKeys.schools(),
    queryFn: () => listSchools(),
    enabled: open && isPlatformAdmin,
    staleTime: STALE_TIME.config,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
      school_id: activeSchool?.id ?? "",
      status: "ACTIVE",
      must_change_password: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (user) {
      reset({
        email: user.email ?? "",
        phone: user.phone ?? "",
        password: "",
        school_id: "",
        status: user.status,
        must_change_password: user.must_change_password,
      });
    } else {
      reset({
        email: "",
        phone: "",
        password: "",
        school_id: activeSchool?.id ?? "",
        status: "ACTIVE",
        must_change_password: false,
      });
    }
  }, [open, user, activeSchool?.id, reset]);

  const mutation = useMutation({
    mutationFn: async (values: UserFormValues) => {
      if (user) {
        const payload: UserUpdate = {
          email: values.email?.trim() || null,
          phone: values.phone?.trim() || null,
          status: values.status as User["status"],
          must_change_password: !!values.must_change_password,
          version: user.version,
        };
        return updateUser(user.id, payload);
      }
      const payload: UserCreate = {
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        password: values.password,
        school_id: values.school_id || null,
      };
      return createUser(payload);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(orgKeys.user(saved.id), saved);
      void queryClient.invalidateQueries({ queryKey: ["org", "users"] });
      toast.success(user ? "User updated" : "User created");
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
    if (!user) return;
    try {
      const fresh = await getUser(user.id);
      queryClient.setQueryData(orgKeys.user(user.id), fresh);
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    }
  }

  const status = watch("status");
  const isPlatformUser = watch("school_id") === "";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{user ? "Edit user" : "Create user"}</DialogTitle>
            <DialogDescription>
              {user
                ? "Update account details for this user."
                : "Create a new user account."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {!user && (
              <div className="space-y-1.5">
                <Label htmlFor="ud-email">Email</Label>
                <Input
                  id="ud-email"
                  type="email"
                  autoComplete="off"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
            )}

            {!user && (
              <div className="space-y-1.5">
                <Label htmlFor="ud-phone">Phone</Label>
                <Input
                  id="ud-phone"
                  type="tel"
                  autoComplete="off"
                  aria-invalid={!!errors.phone}
                  {...register("phone")}
                />
                {errors.phone ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>
            )}

            {!user && (
              <div className="space-y-1.5">
                <Label htmlFor="ud-password">Password *</Label>
                <Input
                  id="ud-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>
            )}

            {!user && isPlatformAdmin && (
              <div className="space-y-1.5">
                <Label htmlFor="ud-school">School</Label>
                <Select
                  value={watch("school_id") ?? ""}
                  onValueChange={(value) => setValue("school_id", value)}
                >
                  <SelectTrigger id="ud-school" className="w-full">
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
                {isPlatformUser ? (
                  <p className="text-xs text-muted-foreground">
                    Platform users have access to every school. School-level users
                    need a membership (see memberships).
                  </p>
                ) : null}
              </div>
            )}

            {user && (
              <div className="space-y-1.5">
                <Label htmlFor="ud-status">Status *</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger id="ud-status" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.status.message}
                  </p>
                ) : null}
              </div>
            )}

            {user && (
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label htmlFor="ud-mcp">Force password change</Label>
                  <p className="text-xs text-muted-foreground">
                    Require this user to set a new password on next sign-in.
                  </p>
                </div>
                <Switch
                  id="ud-mcp"
                  checked={!!watch("must_change_password")}
                  onCheckedChange={(checked) => setValue("must_change_password", checked)}
                />
              </div>
            )}

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
                {user ? "Save changes" : "Create user"}
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