"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  createPerson,
  getPerson,
  updatePerson,
} from "@/services";
import type { Person } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys, STALE_TIME } from "@/lib/query-keys";
import { BLOOD_GROUPS, GENDER_OPTIONS } from "@/lib/display";
import {
  mapFieldErrors,
  showMutationError,
  isStaleResourceError,
} from "@/lib/error-messages";
import { personSchema, type PersonFormValues } from "./schemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FormSection } from "@/components/patterns/form-section";
import { StaleResourceDialog } from "@/components/patterns/stale-resource-dialog";

function toFormValues(person: Person): PersonFormValues {
  return {
    first_name: person.first_name,
    middle_name: person.middle_name ?? "",
    last_name: person.last_name ?? "",
    preferred_name: person.preferred_name ?? "",
    date_of_birth: person.date_of_birth ?? "",
    gender: person.gender ?? "",
    blood_group: person.blood_group ?? "",
    nationality: person.nationality ?? "",
    primary_phone: person.primary_phone ?? "",
    primary_email: person.primary_email ?? "",
  };
}

function emptyToNull(value: string | null | undefined): string | null {
  return value && value.trim() ? value.trim() : null;
}

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; absent = create. */
  person?: Person | null;
  onSaved?: (person: Person) => void;
}

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  onSaved,
}: PersonFormDialogProps) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const isEditing = !!person;
  const queryClient = useQueryClient();
  const [staleOpen, setStaleOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PersonFormValues>({
    resolver: zodResolver(personSchema),
    defaultValues: {
      first_name: "",
      middle_name: "",
      last_name: "",
      preferred_name: "",
      date_of_birth: "",
      gender: "",
      blood_group: "",
      nationality: "",
      primary_phone: "",
      primary_email: "",
    },
  });

  // Always load the freshest copy when editing so `version` is current.
  const personQuery = useQuery({
    queryKey: schoolKeys.person(schoolId, person?.id ?? ""),
    queryFn: () => getPerson(person!.id),
    enabled: isEditing && open && !!schoolId,
    staleTime: STALE_TIME.frequent,
  });

  useEffect(() => {
    if (!open) return;
    if (personQuery.data) {
      reset(toFormValues(personQuery.data));
    }
  }, [open, personQuery.data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: PersonFormValues) => {
      const payload = {
        first_name: values.first_name.trim(),
        middle_name: emptyToNull(values.middle_name),
        last_name: emptyToNull(values.last_name),
        preferred_name: emptyToNull(values.preferred_name),
        date_of_birth: emptyToNull(values.date_of_birth),
        gender: emptyToNull(values.gender),
        blood_group: emptyToNull(values.blood_group),
        nationality: emptyToNull(values.nationality),
        primary_phone: emptyToNull(values.primary_phone),
        primary_email: emptyToNull(values.primary_email),
      };
      if (isEditing && person) {
        return updatePerson(person.id, { ...payload, version: person.version });
      }
      return createPerson(payload);
    },
    onSuccess: (savedPerson) => {
      if (schoolId) {
        void queryClient.invalidateQueries({ queryKey: schoolKeys.persons(schoolId) });
        void queryClient.invalidateQueries({
          queryKey: schoolKeys.person(schoolId, savedPerson.id),
        });
      }
      toast.success(isEditing ? "Person updated" : "Person added", {
        description: `${savedPerson.first_name} ${savedPerson.last_name ?? ""}`.trim(),
      });
      onOpenChange(false);
      onSaved?.(savedPerson);
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
    await saveMutation.mutateAsync(values);
  });

  async function reloadFresh() {
    try {
      const fresh = await getPerson(person!.id);
      queryClient.setQueryData(schoolKeys.person(schoolId, fresh.id), fresh);
      reset(toFormValues(fresh));
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    }
  }

  const loading = isEditing && open && personQuery.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit person" : "Add person"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the person's details. Changes are saved immediately."
                : "Create a new person record."}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6" noValidate>
              <FormSection title="Personal information" bare>
                <div className="space-y-1.5">
                  <Label htmlFor="first_name">First name *</Label>
                  <Input
                    id="first_name"
                    autoComplete="given-name"
                    aria-invalid={!!errors.first_name}
                    {...register("first_name")}
                  />
                  {errors.first_name ? (
                    <p className="text-xs text-destructive" role="alert">
                      {errors.first_name.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="middle_name">Middle name</Label>
                  <Input
                    id="middle_name"
                    autoComplete="additional-name"
                    {...register("middle_name")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    autoComplete="family-name"
                    {...register("last_name")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="preferred_name">Preferred name</Label>
                  <Input
                    id="preferred_name"
                    placeholder="What they like to be called"
                    {...register("preferred_name")}
                  />
                </div>
              </FormSection>

              <FormSection
                title="Additional details"
                description="All fields are optional."
                bare
              >
                <div className="space-y-1.5">
                  <Label htmlFor="date_of_birth">Date of birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    {...register("date_of_birth")}
                  />
                </div>
                <Controller
                  control={control}
                  name="gender"
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="gender" className="w-full">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <Controller
                  control={control}
                  name="blood_group"
                  render={({ field }) => (
                    <div className="space-y-1.5">
                      <Label htmlFor="blood_group">Blood group</Label>
                      <Select
                        value={field.value ?? undefined}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="blood_group" className="w-full">
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                        <SelectContent>
                          {BLOOD_GROUPS.map((group) => (
                            <SelectItem key={group} value={group}>
                              {group}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input id="nationality" {...register("nationality")} />
                </div>
              </FormSection>

              <FormSection
                title="Primary contact"
                description="Shown on the profile header. Add more in the profile."
                bare
              >
                <div className="space-y-1.5">
                  <Label htmlFor="primary_phone">Primary phone</Label>
                  <Input
                    id="primary_phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="+91 98765 43210"
                    {...register("primary_phone")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="primary_email">Primary email</Label>
                  <Input
                    id="primary_email"
                    type="email"
                    autoComplete="email"
                    placeholder="person@school.edu"
                    {...register("primary_email")}
                  />
                </div>
              </FormSection>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  {isEditing ? "Save changes" : "Add person"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <StaleResourceDialog
        open={staleOpen}
        onOpenChange={setStaleOpen}
        onReload={reloadFresh}
        onDismiss={() => {
          setStaleOpen(false);
          onOpenChange(false);
        }}
        loading={personQuery.isFetching}
      />
    </>
  );
}