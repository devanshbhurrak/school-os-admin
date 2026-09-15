"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ApiError, ErrorCode } from "@/types";
import { loginSchema, type LoginValues } from "./schemas";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { mapFieldErrors } from "@/lib/error-messages";
import { Skeleton } from "@/components/ui/skeleton";

export function LoginForm() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [retryIn, setRetryIn] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      if (user?.must_change_password) {
        router.replace("/force-change-password");
      } else if (user?.is_platform_admin) {
        router.replace("/platform/dashboard");
      } else {
        // Non-platform users should not use the admin portal - send to login with message
        router.replace("/login");
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (retryIn === null) return;
    const timer = window.setTimeout(() => {
      setRetryIn((prev) => (prev === null ? null : prev <= 1 ? null : prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [retryIn]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const me = await login(values.identifier, values.password);
      if (me.must_change_password) {
        router.replace("/force-change-password");
      } else if (me.is_platform_admin) {
        router.replace("/platform/dashboard");
      } else {
        setFormError("This account is not a platform administrator. Please use the school portal.");
      }
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError?.code === ErrorCode.Unauthorized) {
        setFormError("Invalid email/phone or password.");
        return;
      }
      if (apiError?.code === ErrorCode.AccountInactive) {
        setFormError(
          "Your account is inactive. Contact your school administrator to regain access.",
        );
        return;
      }
      if (apiError?.code === ErrorCode.RateLimited) {
        const seconds = apiError.retryAfter ?? 30;
        setRetryIn(seconds);
        setFormError("Too many login attempts. Please wait before trying again.");
        return;
      }
      if (mapFieldErrors(error, setError)) return;
      setFormError(
        apiError?.code === ErrorCode.NetworkError
          ? "Unable to reach the server. Check your connection and try again."
          : "Something went wrong. Please try again.",
      );
    }
  });

  const disabled = isSubmitting || (retryIn !== null && retryIn > 0);

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <div className="inline-flex items-center rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest text-indigo-300">PLATFORM ADMIN</div>
        <h1 className="text-xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to the platform control plane.
        </p>
      </div>

      {formError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to sign in</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="identifier">Email or phone</Label>
        <Input
          id="identifier"
          type="text"
          autoComplete="username"
          placeholder="you@school.edu or +91 98765 43210"
          aria-invalid={!!errors.identifier}
          {...register("identifier")}
        />
        {errors.identifier ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.identifier.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/password-reset"
            className="text-xs font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-destructive" role="alert">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={disabled}>
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        {retryIn !== null && retryIn > 0
          ? `Try again in ${retryIn}s`
          : "Sign In"}
      </Button>
    </form>
  );
}