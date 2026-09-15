import { toast } from "sonner";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ErrorCode, type ApiError } from "@/types";

/** Human-readable message for a given API error, keyed by error.code. */
export function errorMessage(error: unknown, fallback?: string): string {
  const apiError = error as ApiError | undefined;
  const code = apiError?.code;

  switch (code) {
    case ErrorCode.Unauthorized:
      return "Your session has expired. Please sign in again.";
    case ErrorCode.AccountInactive:
      return "Your account has been locked. Contact your administrator.";
    case ErrorCode.Forbidden:
      return "You don't have permission to do this.";
    case ErrorCode.TenantContext:
      return "Please select a school to continue.";
    case ErrorCode.NotFound:
      return "This record no longer exists. It may have been removed.";
    case ErrorCode.ValidationError:
      return "Please check the highlighted fields and try again.";
    case ErrorCode.Conflict:
      return apiError?.message || "This record already exists or is in use.";
    case ErrorCode.StaleResource:
      return "This record was modified by someone else. Reload to see the latest version.";
    case ErrorCode.RateLimited:
      return apiError?.retryAfter
        ? `Too many attempts. Please try again in ${apiError.retryAfter} seconds.`
        : "Too many attempts. Please try again shortly.";
    case ErrorCode.NetworkError:
      return "Unable to reach the server. Check your connection and try again.";
    case ErrorCode.InternalError:
      return "Something went wrong. Please try again.";
    default:
      return (
        apiError?.message ||
        fallback ||
        "Something went wrong. Please try again."
      );
  }
}

/** Show a toast for a failed mutation with a human-readable message. */
export function showMutationError(error: unknown, fallback?: string) {
  const apiError = error as ApiError | undefined;
  if (apiError?.code === ErrorCode.RateLimited && apiError.retryAfter) {
    const retryIn = apiError.retryAfter;
    const id = toast.error("Too many attempts", {
      description: `Please try again in ${retryIn} seconds.`,
    });
    window.setTimeout(() => toast.dismiss(id), (retryIn + 1) * 1000);
    return;
  }
  toast.error(errorMessage(error, fallback));
}

/** Map a VALIDATION_ERROR's per-field errors onto React Hook Form fields. */
export function mapFieldErrors<TForm extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TForm>,
): boolean {
  const apiError = error as ApiError | undefined;
  if (!apiError || apiError.code !== ErrorCode.ValidationError) return false;
  const fields = apiError.fieldErrors;
  if (!fields.length) return false;
  for (const fieldError of fields) {
    // API field names like "items.0.name" or "custom_fields.x" can't map 1:1
    const direct = fieldError.field.split(".")[0] as Path<TForm>;
    setError(direct, {
      type: "server",
      message: fieldError.message,
    });
  }
  return true;
}

/** Map a CONFLICT error (duplicate code/email/phone) onto a form field. */
export function mapConflictError<TForm extends FieldValues>(
  error: unknown,
  field: Path<TForm>,
  setError: UseFormSetError<TForm>,
  message?: string,
): boolean {
  const apiError = error as ApiError | undefined;
  if (!apiError || apiError.code !== ErrorCode.Conflict) return false;
  setError(field, {
    type: "server",
    message: message ?? apiError.message ?? "This value is already in use.",
  });
  return true;
}

export function isStaleResourceError(error: unknown): boolean {
  return (error as ApiError | undefined)?.code === ErrorCode.StaleResource;
}

export function isForbiddenError(error: unknown): boolean {
  return (error as ApiError | undefined)?.code === ErrorCode.Forbidden;
}
