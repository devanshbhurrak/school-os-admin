import { describe, it, expect, vi } from "vitest";
import {
  errorMessage,
  isForbiddenError,
  isStaleResourceError,
  mapConflictError,
  mapFieldErrors,
} from "@/lib/error-messages";
import { ErrorCode, ApiError, type ErrorDetails } from "@/types";

function apiError(code: ErrorCode, message = "server message", details: ErrorDetails = {}): ApiError {
  return new ApiError(400, { code, message, details });
}

describe("errorMessage", () => {
  it("maps 401 to a session-expired message", () => {
    expect(errorMessage(apiError(ErrorCode.Unauthorized))).toMatch(/session has expired/i);
  });

  it("maps 403 to a permission message", () => {
    expect(errorMessage(apiError(ErrorCode.Forbidden))).toMatch(/permission/i);
  });

  it("maps 404 to a missing-record message", () => {
    expect(errorMessage(apiError(ErrorCode.NotFound))).toMatch(/no longer exists/i);
  });

  it("maps 409 STALE_RESOURCE to a reload message", () => {
    expect(errorMessage(apiError(ErrorCode.StaleResource))).toMatch(/someone else/i);
  });

  it("maps 429 with retry_after to a countdown message", () => {
    expect(errorMessage(apiError(ErrorCode.RateLimited, "slow down", { retry_after: 42 }))).toMatch(
      /42 seconds/,
    );
  });

  it("maps 429 without retry_after to a generic throttle message", () => {
    expect(errorMessage(apiError(ErrorCode.RateLimited))).toMatch(/try again shortly/i);
  });

  it("maps network errors to a connectivity message", () => {
    expect(errorMessage(apiError(ErrorCode.NetworkError))).toMatch(/unable to reach/i);
  });

  it("falls back to the server message for unknown codes", () => {
    expect(errorMessage({ code: "SOME_NEW_CODE", message: "custom msg" })).toBe("custom msg");
  });

  it("uses the fallback string when nothing else applies", () => {
    expect(errorMessage(null, "fallback text")).toBe("fallback text");
  });

  it("prefers the conflict detail message when present", () => {
    expect(errorMessage(apiError(ErrorCode.Conflict, "Email already in use."))).toBe(
      "Email already in use.",
    );
  });
});

describe("error predicates", () => {
  it("detects stale-resource errors", () => {
    expect(isStaleResourceError(apiError(ErrorCode.StaleResource))).toBe(true);
    expect(isStaleResourceError(apiError(ErrorCode.Conflict))).toBe(false);
    expect(isStaleResourceError(null)).toBe(false);
  });

  it("detects forbidden errors", () => {
    expect(isForbiddenError(apiError(ErrorCode.Forbidden))).toBe(true);
    expect(isForbiddenError(apiError(ErrorCode.NotFound))).toBe(false);
  });
});

describe("mapFieldErrors", () => {
  it("maps server field errors onto the form", () => {
    const setError = vi.fn();
    const err = apiError(ErrorCode.ValidationError, "invalid", {
      fields: [{ field: "email", message: "Invalid email." }],
    });
    expect(mapFieldErrors(err, setError)).toBe(true);
    expect(setError).toHaveBeenCalledWith("email", {
      type: "server",
      message: "Invalid email.",
    });
  });

  it("returns false for non-validation errors", () => {
    expect(mapFieldErrors(apiError(ErrorCode.Conflict), vi.fn())).toBe(false);
    expect(mapFieldErrors(null, vi.fn())).toBe(false);
  });
});

describe("mapConflictError", () => {
  it("maps a conflict onto the given field", () => {
    const setError = vi.fn();
    const err = apiError(ErrorCode.Conflict, "Admission number taken.");
    expect(mapConflictError(err, "admission_number", setError)).toBe(true);
    expect(setError).toHaveBeenCalledWith("admission_number", {
      type: "server",
      message: "Admission number taken.",
    });
  });

  it("returns false for other error codes", () => {
    expect(mapConflictError(apiError(ErrorCode.NotFound), "email", vi.fn())).toBe(false);
  });
});
