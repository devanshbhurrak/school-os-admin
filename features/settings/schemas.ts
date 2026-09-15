import { z } from "zod";

export const schoolFormSchema = z.object({
  name: z.string().min(1, "School name is required.").max(255),
  short_name: z.string().max(100).optional(),
  status: z.string().min(1, "Choose a status."),
  board: z.string().max(100).optional(),
  affiliation_number: z.string().max(100).optional(),
  contact_email: z.string().max(255).optional(),
  contact_phone: z.string().max(64).optional(),
});

export const userFormSchema = z
  .object({
    email: z.string().max(255).optional(),
    phone: z.string().max(64).optional(),
    password: z.string().min(8, "Password must be at least 8 characters.").max(128).optional(),
    school_id: z.string().optional(),
    status: z.string().min(1, "Choose a status."),
    must_change_password: z.boolean().optional(),
  })
  .refine(
    (data) => {
      // Only enforce for create (no status means it came from create form)
      // For edit the status field is always set; for create we check contact presence.
      // We can't distinguish here perfectly, but the backend enforces it too.
      // If both are empty, surface an error on email field.
      const isCreate = data.password !== undefined;
      if (!isCreate) return true;
      return !!(data.email?.trim() || data.phone?.trim());
    },
    { message: "Provide an email or a phone number.", path: ["email"] },
  );

export const roleFormSchema = z.object({
  code: z.string().min(1, "Code is required.").max(64),
  name: z.string().min(1, "Role name is required.").max(255),
  description: z.string().max(512).optional(),
  scope_level: z.string().min(1, "Choose a scope."),
  data_scope: z.string().min(1, "Choose a data scope."),
  permission_codes: z.array(z.string()),
});

export const membershipFormSchema = z.object({
  user_id: z.string().min(1, "Choose a user."),
  school_id: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  is_default: z.boolean().optional(),
  role_ids: z.array(z.string()),
});

export type SchoolFormValues = z.infer<typeof schoolFormSchema>;
export type UserFormValues = z.infer<typeof userFormSchema>;
export type RoleFormValues = z.infer<typeof roleFormSchema>;
export type MembershipFormValues = z.infer<typeof membershipFormSchema>;