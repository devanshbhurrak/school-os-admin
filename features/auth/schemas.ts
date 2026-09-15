import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Enter your email or phone.")
    .max(255, "That value is too long."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(128, "That value is too long."),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const passwordResetSchema = z.object({
  identifier: z
    .string()
    .min(1, "Enter your email or phone.")
    .max(255, "That value is too long."),
});

export type PasswordResetValues = z.infer<typeof passwordResetSchema>;

export const newPasswordSchema = z.object({
  new_password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(128, "That value is too long."),
  confirm_password: z.string().min(1, "Re-enter your new password."),
});

export const passwordResetConfirmSchema = newPasswordSchema.refine(
  (values) => values.new_password === values.confirm_password,
  {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  },
);

export type PasswordResetConfirmValues = z.infer<typeof passwordResetConfirmSchema>;

export const passwordChangeSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password."),
    ...newPasswordSchema.shape,
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export type PasswordChangeValues = z.infer<typeof passwordChangeSchema>;