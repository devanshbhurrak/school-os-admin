"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { confirmPasswordReset, changePassword } from "@/services/auth";
import {
  passwordResetConfirmSchema,
  passwordChangeSchema,
  type PasswordResetConfirmValues,
  type PasswordChangeValues,
} from "./schemas";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError, ErrorCode } from "@/types";

interface PasswordChangeFormProps {
  mode: "confirm-reset" | "force-change" | "voluntary";
  /** Reset token from the URL (confirm-reset mode only). */
  token?: string;
  onSuccess?: () => void;
}

/**
 * Shared form for password reset confirmation, forced password change,
 * and voluntary password change. The API revokes all sessions after a
 * successful change, so a success screen with sign-in is shown.
 */
export function PasswordChangeForm({
  mode,
  token,
  onSuccess,
}: PasswordChangeFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);

  const schema =
    mode === "confirm-reset" ? passwordResetConfirmSchema : passwordChangeSchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetConfirmValues | PasswordChangeValues>({
    resolver: zodResolver(schema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const titles: Record<PasswordChangeFormProps["mode"], { title: string; description: string }> = {
    "confirm-reset": {
      title: "Set a new password",
      description: "Choose a strong password for your account.",
    },
    "force-change": {
      title: "Change your password",
      description:
        "For security, you must set a new password before continuing.",
    },
    voluntary: {
      title: "Change your password",
      description: "Choose a strong password for your account.",
    },
  };

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (mode === "confirm-reset") {
        await confirmPasswordReset({
          token: token ?? "",
          new_password: values.new_password,
        });
      } else {
        await changePassword({
          current_password: (values as PasswordChangeValues).current_password,
          new_password: values.new_password,
        });
      }
      setSucceeded(true);
      onSuccess?.();
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError?.code === ErrorCode.Unauthorized) {
        setFormError(
          mode === "confirm-reset"
            ? "This reset link is invalid or has expired. Request a new one."
            : "The current password is incorrect.",
        );
        return;
      }
      setFormError(
        apiError?.code === ErrorCode.NetworkError
          ? "Unable to reach the server. Check your connection and try again."
          : "Something went wrong. Please try again.",
      );
    }
  });

  if (succeeded) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
          <CheckCircle2 className="size-6" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          {mode === "confirm-reset" ? "Password reset" : "Password changed"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "confirm-reset"
            ? "You can now sign in with your new password."
            : "Your sessions were signed out for security. Sign in with your new password."}
        </p>
        <Button asChild className="mt-2">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const isForceChange = mode === "force-change";
  const currentPasswordError = (
    errors as Record<string, { message?: string } | undefined>
  ).current_password;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">
          {titles[mode].title}
        </h1>
        <p className="text-sm text-muted-foreground">{titles[mode].description}</p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      {isForceChange ? (
        <div className="space-y-1.5">
          <Label htmlFor="current_password">Current password</Label>
          <PasswordInput
            id="current_password"
            autoComplete="current-password"
            aria-invalid={!!currentPasswordError}
            {...register("current_password")}
          />
          {currentPasswordError ? (
            <p className="text-xs text-destructive" role="alert">
              {currentPasswordError.message}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="new_password">New password</Label>
        <PasswordInput
          id="new_password"
          autoComplete="new-password"
          aria-invalid={!!errors.new_password}
          {...register("new_password")}
        />
        {errors.new_password ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.new_password.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <PasswordInput
          id="confirm_password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirm_password}
          {...register("confirm_password")}
        />
        {errors.confirm_password ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.confirm_password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {isForceChange ? "Set new password" : "Update password"}
      </Button>
    </form>
  );
}