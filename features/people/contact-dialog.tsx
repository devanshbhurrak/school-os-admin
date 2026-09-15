"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createContact, updateContact } from "@/services";
import type { Contact, EntityType } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys } from "@/lib/query-keys";
import {
  mapFieldErrors,
  showMutationError,
} from "@/lib/error-messages";
import { contactSchema, type ContactFormValues } from "./schemas";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
  /** Present = edit mode; absent = create. */
  contact?: Contact | null;
}

export function ContactDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  contact,
}: ContactDialogProps) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const isEditing = !!contact;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contact_type: "PHONE",
      value: "",
      label: "",
      is_primary: false,
      is_emergency: false,
    },
  });

  const isPrimary = watch("is_primary");
  const isEmergency = watch("is_emergency");

  useEffect(() => {
    if (!open) return;
    if (contact) {
      reset({
        contact_type: contact.contact_type,
        value: contact.value,
        label: contact.label ?? "",
        is_primary: contact.is_primary,
        is_emergency: contact.is_emergency,
      });
    } else {
      reset({
        contact_type: "PHONE",
        value: "",
        label: "",
        is_primary: false,
        is_emergency: false,
      });
    }
  }, [open, contact, reset]);

  const mutation = useMutation({
    mutationFn: (values: ContactFormValues) => {
      const payload = {
        entity_type: entityType,
        entity_id: entityId,
        contact_type: values.contact_type,
        value: values.value.trim(),
        label: values.label?.trim() ? values.label.trim() : null,
        is_primary: values.is_primary,
        is_emergency: values.is_emergency,
      };
      if (isEditing && contact) {
        return updateContact(contact.id, {
          contact_type: values.contact_type,
          value: values.value.trim(),
          label: values.label?.trim() ? values.label.trim() : null,
          is_primary: values.is_primary,
          is_emergency: values.is_emergency,
        });
      }
      return createContact(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.contacts(schoolId, entityType, entityId),
      });
      toast.success(isEditing ? "Contact updated" : "Contact added");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit contact" : "Add contact"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this contact method."
              : "Add a phone, email, or WhatsApp contact."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="contact_type">Type</Label>
            <Select
              value={watch("contact_type")}
              onValueChange={(value) => setValue("contact_type", value as ContactFormValues["contact_type"])}
            >
              <SelectTrigger id="contact_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PHONE">Phone</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="value">Value *</Label>
            <Input
              id="value"
              type={watch("contact_type") === "EMAIL" ? "email" : "text"}
              placeholder={
                watch("contact_type") === "EMAIL"
                  ? "person@example.com"
                  : "+91 98765 43210"
              }
              aria-invalid={!!errors.value}
              {...register("value")}
            />
            {errors.value ? (
              <p className="text-xs text-destructive" role="alert">
                {errors.value.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              placeholder='e.g. "Mother", "Guardian", "Office"'
              {...register("label")}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="is_primary">Primary contact</Label>
              <p className="text-xs text-muted-foreground">
                Shown first on the profile.
              </p>
            </div>
            <Switch
              id="is_primary"
              checked={isPrimary}
              onCheckedChange={(checked) => setValue("is_primary", checked)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="is_emergency">Emergency contact</Label>
              <p className="text-xs text-muted-foreground">
                Marked clearly for emergency use.
              </p>
            </div>
            <Switch
              id="is_emergency"
              checked={isEmergency}
              onCheckedChange={(checked) => setValue("is_emergency", checked)}
            />
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
              {isEditing ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}