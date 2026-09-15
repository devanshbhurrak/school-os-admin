"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSchool, updateSchool } from "@/services";
import type { SchoolStatus, SchoolUpdate } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { orgKeys, STALE_TIME } from "@/lib/query-keys";
import { PERMISSIONS } from "@/lib/permissions";
import { SCHOOL_BOARDS } from "@/lib/display";
import {
  isStaleResourceError,
  mapFieldErrors,
  showMutationError,
} from "@/lib/error-messages";
import { schoolFormSchema, type SchoolFormValues } from "./schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/patterns/error-state";
import { FormSection } from "@/components/patterns/form-section";
import { StaleResourceDialog } from "@/components/patterns/stale-resource-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGate } from "@/components/ui/permission-gate";

const SCHOOL_STATUS_OPTIONS = [
  { value: "SETUP", label: "Setting up" },
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "CLOSED", label: "Closed" },
];

function emptyToNull(value: string | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

export function SchoolSettingsPage() {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);

  const schoolQuery = useQuery({
    queryKey: orgKeys.school(schoolId),
    queryFn: () => getSchool(schoolId),
    enabled: !!schoolId,
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
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolFormSchema),
    defaultValues: {
      name: "",
      short_name: "",
      status: "",
      board: "",
      affiliation_number: "",
      contact_email: "",
      contact_phone: "",
    },
  });

  useEffect(() => {
    if (!schoolQuery.data) return;
    const school = schoolQuery.data;
    reset({
      name: school.name,
      short_name: school.short_name ?? "",
      status: school.status,
      board: school.board ?? "",
      affiliation_number: school.affiliation_number ?? "",
      contact_email: school.contact_email ?? "",
      contact_phone: school.contact_phone ?? "",
    });
  }, [schoolQuery.data, reset]);

  const mutation = useMutation({
    mutationFn: (values: SchoolFormValues) => {
      const school = schoolQuery.data!;
      const payload: SchoolUpdate = {
        name: values.name.trim(),
        short_name: emptyToNull(values.short_name),
        status: values.status as SchoolStatus,
        board: emptyToNull(values.board),
        affiliation_number: emptyToNull(values.affiliation_number),
        contact_email: emptyToNull(values.contact_email),
        contact_phone: emptyToNull(values.contact_phone),
        version: school.version,
      };
      return updateSchool(school.id, payload);
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(orgKeys.school(schoolId), saved);
      void queryClient.invalidateQueries({ queryKey: ["org", "schools"] });
      toast.success("School settings saved");
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
    if (!schoolId) return;
    try {
      const fresh = await getSchool(schoolId);
      queryClient.setQueryData(orgKeys.school(schoolId), fresh);
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    }
  }

  if (schoolQuery.isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (schoolQuery.isError) {
    return (
      <ErrorState error={schoolQuery.error} onRetry={() => void schoolQuery.refetch()} />
    );
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-6" noValidate>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormSection title="Identity" bare>
              <div className="space-y-1.5">
                <Label htmlFor="school_code">School code</Label>
                <Input
                  id="school_code"
                  value={schoolQuery.data?.code ?? ""}
                  readOnly
                  disabled
                  className="font-mono text-muted-foreground"
                  aria-describedby="school_code_hint"
                />
                <p id="school_code_hint" className="text-xs text-muted-foreground">
                  The school code is assigned at creation and cannot be changed.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">School name *</Label>
                <Input
                  id="name"
                  aria-invalid={!!errors.name}
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-xs text-destructive" role="alert">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="short_name">Short name</Label>
                <Input id="short_name" {...register("short_name")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) => setValue("status", value)}
                >
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_STATUS_OPTIONS.map((option) => (
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
            </FormSection>

            <FormSection
              title="Education details"
              description="Optional board and affiliation information."
              bare
            >
              <div className="space-y-1.5">
                <Label htmlFor="board">Board</Label>
                <Select
                  value={watch("board") ?? ""}
                  onValueChange={(value) => setValue("board", value)}
                >
                  <SelectTrigger id="board" className="w-full">
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHOOL_BOARDS.map((board) => (
                      <SelectItem key={board} value={board}>
                        {board}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="affiliation_number">Affiliation number</Label>
                <Input id="affiliation_number" {...register("affiliation_number")} />
              </div>
            </FormSection>

            <FormSection title="Contact" bare>
              <div className="space-y-1.5">
                <Label htmlFor="contact_email">Contact email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  autoComplete="email"
                  {...register("contact_email")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_phone">Contact phone</Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  autoComplete="tel"
                  {...register("contact_phone")}
                />
              </div>
            </FormSection>

            <PermissionGate permission={PERMISSIONS.school.update}>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Save changes
              </Button>
            </PermissionGate>
          </CardContent>
        </Card>
      </form>

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