"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createAddress, updateAddress } from "@/services";
import type { Address, EntityType } from "@/types";
import { useSchoolContextValue } from "@/hooks/use-school-context";
import { schoolKeys } from "@/lib/query-keys";
import { COUNTRY_CODES } from "@/lib/display";
import {
  mapFieldErrors,
  showMutationError,
} from "@/lib/error-messages";
import { addressSchema, type AddressFormValues } from "./schemas";
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

interface AddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: EntityType;
  entityId: string;
  /** Present = edit mode; absent = create. */
  address?: Address | null;
}

export function AddressDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  address,
}: AddressDialogProps) {
  const { activeSchool } = useSchoolContextValue();
  const schoolId = activeSchool?.id ?? "";
  const isEditing = !!address;
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { isSubmitting },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema) as Resolver<AddressFormValues>,
    defaultValues: {
      address_type: "RESIDENTIAL",
      line1: "",
      line2: "",
      landmark: "",
      city: "",
      district: "",
      state: "",
      postal_code: "",
      country_code: "IN",
      is_primary: false,
    },
  });

  const isPrimary = watch("is_primary");

  useEffect(() => {
    if (!open) return;
    if (address) {
      reset({
        address_type: address.address_type,
        line1: address.line1 ?? "",
        line2: address.line2 ?? "",
        landmark: address.landmark ?? "",
        city: address.city ?? "",
        district: address.district ?? "",
        state: address.state ?? "",
        postal_code: address.postal_code ?? "",
        country_code: address.country_code,
        is_primary: address.is_primary,
      });
    } else {
      reset({
        address_type: "RESIDENTIAL",
        line1: "",
        line2: "",
        landmark: "",
        city: "",
        district: "",
        state: "",
        postal_code: "",
        country_code: "IN",
        is_primary: false,
      });
    }
  }, [open, address, reset]);

  const mutation = useMutation({
    mutationFn: (values: AddressFormValues) => {
      const payload = {
        entity_type: entityType,
        entity_id: entityId,
        address_type: values.address_type,
        line1: values.line1?.trim() ? values.line1.trim() : null,
        line2: values.line2?.trim() ? values.line2.trim() : null,
        landmark: values.landmark?.trim() ? values.landmark.trim() : null,
        city: values.city?.trim() ? values.city.trim() : null,
        district: values.district?.trim() ? values.district.trim() : null,
        state: values.state?.trim() ? values.state.trim() : null,
        postal_code: values.postal_code?.trim() ? values.postal_code.trim() : null,
        country_code: values.country_code,
        is_primary: values.is_primary,
      };
      if (isEditing && address) {
        return updateAddress(address.id, {
          address_type: values.address_type,
          line1: values.line1?.trim() ? values.line1.trim() : null,
          line2: values.line2?.trim() ? values.line2.trim() : null,
          landmark: values.landmark?.trim() ? values.landmark.trim() : null,
          city: values.city?.trim() ? values.city.trim() : null,
          district: values.district?.trim() ? values.district.trim() : null,
          state: values.state?.trim() ? values.state.trim() : null,
          postal_code: values.postal_code?.trim() ? values.postal_code.trim() : null,
          country_code: values.country_code,
          is_primary: values.is_primary,
          version: address.version,
        });
      }
      return createAddress(payload);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: schoolKeys.addresses(schoolId, entityType, entityId),
      });
      toast.success(isEditing ? "Address updated" : "Address added");
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
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit address" : "Add address"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this address."
              : "Add a residential, permanent, or correspondence address."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="address_type">Type</Label>
            <Select
              value={watch("address_type")}
              onValueChange={(value) =>
                setValue("address_type", value as AddressFormValues["address_type"])
              }
            >
              <SelectTrigger id="address_type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESIDENTIAL">Residential</SelectItem>
                <SelectItem value="PERMANENT">Permanent</SelectItem>
                <SelectItem value="CORRESPONDENCE">Correspondence</SelectItem>
                <SelectItem value="CAMPUS">Campus</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="line1">Address line 1</Label>
            <Input id="line1" {...register("line1")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="line2">Address line 2</Label>
            <Input id="line2" {...register("line2")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="landmark">Landmark</Label>
            <Input id="landmark" {...register("landmark")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="district">District</Label>
              <Input id="district" {...register("district")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...register("state")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="postal_code">Postal code</Label>
              <Input id="postal_code" {...register("postal_code")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country_code">Country</Label>
            <Select
              value={watch("country_code")}
              onValueChange={(value) => setValue("country_code", value)}
            >
              <SelectTrigger id="country_code" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="is_primary">Primary address</Label>
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
              {isEditing ? "Save changes" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}