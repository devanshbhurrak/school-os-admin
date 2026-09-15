"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  isStaleResourceError,
  mapFieldErrors,
  showMutationError,
} from "@/lib/error-messages";
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
import { Switch } from "@/components/ui/switch";
import { StaleResourceDialog } from "@/components/patterns/stale-resource-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FormValue = string | boolean | undefined;

export interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "date" | "number" | "select" | "switch";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  help?: string;
  /** 2-col grid option for wider forms. */
  wide?: boolean;
  /** Field is only editable on create; shown as read-only text in edit mode. */
  createOnly?: boolean;
}

interface RecordDialogProps<T extends { id: string }> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode; null = create. */
  record: T | null;
  title: string;
  description?: string;
  fields: FieldConfig[];
  toFormValues: (record: T) => Record<string, FormValue>;
  toCreatePayload: (values: Record<string, FormValue>) => Record<string, unknown>;
  toUpdatePayload: (
    values: Record<string, FormValue>,
    record: T,
  ) => Record<string, unknown>;
  onCreate: (payload: Record<string, unknown>) => Promise<T>;
  onUpdate: (id: string, payload: Record<string, unknown>) => Promise<T>;
  /** Called after a successful create/update (e.g. invalidate queries). */
  onSaved?: (record: T) => void;
  /** Re-fetch a fresh copy when the record went stale. */
  fetchRecord?: (id: string) => Promise<T>;
  isFetchingFresh?: boolean;
}

/**
 * Config-driven create/edit dialog for academic records. Builds a zod schema
 * from the field list, maps VALIDATION_ERRORs onto fields, and handles
 * STALE_RESOURCE with a reload dialog.
 */
export function RecordDialog<T extends { id: string }>({
  open,
  onOpenChange,
  record,
  title,
  description,
  fields,
  toFormValues,
  toCreatePayload,
  toUpdatePayload,
  onCreate,
  onUpdate,
  onSaved,
  fetchRecord,
  isFetchingFresh,
}: RecordDialogProps<T>) {
  const isEditing = !!record;
  const [staleOpen, setStaleOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodType> = {};
    for (const field of fields) {
      if (field.type === "switch") {
        shape[field.name] = z.boolean().optional();
        continue;
      }
      // createOnly fields are disabled in edit mode — no validation needed
      if (isEditing && field.createOnly) {
        shape[field.name] = z.string().optional();
        continue;
      }
      if (field.required) {
        shape[field.name] = z.string().min(1, `${field.label} is required.`);
      } else {
        shape[field.name] = z.string().optional();
      }
    }
    return z.object(shape);
  }, [fields, isEditing]);

  const defaultValues = useMemo(() => {
    const values: Record<string, FormValue> = {};
    for (const field of fields) {
      values[field.name] = field.type === "switch" ? false : "";
    }
    return values;
  }, [fields]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, FormValue>>({
    resolver: zodResolver(schema) as Resolver<Record<string, FormValue>>,
    defaultValues,
  });

  useEffect(() => {
    if (!open) return;
    reset(record ? toFormValues(record) : defaultValues);
  }, [open, record, toFormValues, defaultValues, reset]);

  const mutation = useMutation({
    mutationFn: (values: Record<string, FormValue>) => {
      if (isEditing && record) {
        return onUpdate(record.id, toUpdatePayload(values, record));
      }
      return onCreate(toCreatePayload(values));
    },
    onSuccess: (saved) => {
      toast.success(isEditing ? "Updated" : "Created", {
        description: title.toLowerCase(),
      });
      onOpenChange(false);
      onSaved?.(saved);
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
    if (!record || !fetchRecord) return;
    setLoading(true);
    try {
      const fresh = await fetchRecord(record.id);
      reset(toFormValues(fresh));
      setStaleOpen(false);
      toast.info("Loaded the latest version of this record.");
    } catch {
      setStaleOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => {
                const error = errors[field.name] as { message?: string } | undefined;
                const value = watch(field.name);

                return (
                  <div
                    key={field.name}
                    className={cn("space-y-1.5", field.wide && "sm:col-span-2")}
                  >
                    {field.type === "switch" ? (
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <Label htmlFor={field.name}>{field.label}</Label>
                          {field.help ? (
                            <p className="text-xs text-muted-foreground">{field.help}</p>
                          ) : null}
                        </div>
                        <Switch
                          id={field.name}
                          checked={value === true}
                          onCheckedChange={(checked) => setValue(field.name, checked)}
                        />
                      </div>
                    ) : field.type === "select" ? (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required ? " *" : ""}
                        </Label>
                        <Select
                          value={typeof value === "string" ? value : ""}
                          onValueChange={(selected) => setValue(field.name, selected)}
                        >
                          <SelectTrigger
                            id={field.name}
                            className="w-full"
                            aria-invalid={!!error}
                          >
                            <SelectValue placeholder={field.placeholder ?? "Select…"} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {error ? (
                          <p className="text-xs text-destructive" role="alert">
                            {error.message}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor={field.name}>
                          {field.label}
                          {field.required ? " *" : ""}
                        </Label>
                        <Input
                          id={field.name}
                          type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                          placeholder={field.placeholder}
                          aria-invalid={!!error}
                          disabled={isEditing && field.createOnly}
                          {...register(field.name)}
                        />
                        {error ? (
                          <p className="text-xs text-destructive" role="alert">
                            {error.message}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

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
                {isEditing ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
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
        loading={loading || isFetchingFresh}
      />
    </>
  );
}

/** Small helper: form value to null-or-string for optional API fields. */
export function optionalString(value: string | boolean | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/** Small helper: parse a numeric form string to number or null. */
export function optionalNumber(value: string | boolean | undefined): number | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}