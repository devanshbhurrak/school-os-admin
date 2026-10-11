import { describe, it, expect } from "vitest";
import { loginSchema, newPasswordSchema, passwordResetSchema } from "@/features/auth/schemas";

describe("loginSchema", () => {
  it("accepts a valid email + password", () => {
    expect(
      loginSchema.safeParse({ identifier: "admin@demo.test", password: "Secret123!" }).success,
    ).toBe(true);
  });

  it("rejects an empty identifier", () => {
    const result = loginSchema.safeParse({ identifier: "", password: "Secret123!" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({ identifier: "admin@demo.test", password: "" });
    expect(result.success).toBe(false);
  });
});

describe("passwordResetSchema", () => {
  it("accepts a non-empty identifier", () => {
    expect(passwordResetSchema.safeParse({ identifier: "admin@demo.test" }).success).toBe(true);
  });

  it("rejects an empty identifier", () => {
    expect(passwordResetSchema.safeParse({ identifier: "" }).success).toBe(false);
  });
});

describe("newPasswordSchema", () => {
  it("rejects passwords shorter than 8 characters", () => {
    const result = newPasswordSchema.safeParse({
      new_password: "short",
      confirm_password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a strong password with matching confirmation", () => {
    const result = newPasswordSchema.safeParse({
      new_password: "StrongPass2026!",
      confirm_password: "StrongPass2026!",
    });
    expect(result.success).toBe(true);
  });
});
