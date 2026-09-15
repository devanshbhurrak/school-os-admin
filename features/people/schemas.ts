import { z } from "zod";

export const personSchema = z.object({
  first_name: z.string().min(1, "First name is required.").max(255),
  middle_name: z.string().max(255).optional().nullable(),
  last_name: z.string().max(255).optional().nullable(),
  preferred_name: z.string().max(255).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  blood_group: z.string().optional().nullable(),
  nationality: z.string().max(255).optional().nullable(),
  primary_phone: z.string().max(64).optional().nullable(),
  primary_email: z.string().max(255).optional().nullable(),
});

export type PersonFormValues = z.infer<typeof personSchema>;

export const contactSchema = z.object({
  contact_type: z.enum(["PHONE", "EMAIL", "WHATSAPP"], {
    message: "Choose a contact type.",
  }),
  value: z.string().min(1, "Contact value is required.").max(512),
  label: z.string().max(255).optional().nullable(),
  is_primary: z.boolean().optional(),
  is_emergency: z.boolean().optional(),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

export const addressSchema = z.object({
  address_type: z.enum(["RESIDENTIAL", "PERMANENT", "CORRESPONDENCE", "CAMPUS", "OTHER"], {
    message: "Choose an address type.",
  }),
  line1: z.string().max(512).optional().nullable(),
  line2: z.string().max(512).optional().nullable(),
  landmark: z.string().max(255).optional().nullable(),
  city: z.string().max(255).optional().nullable(),
  district: z.string().max(255).optional().nullable(),
  state: z.string().max(255).optional().nullable(),
  postal_code: z.string().max(32).optional().nullable(),
  country_code: z.string().min(2).max(2).default("IN"),
  is_primary: z.boolean().optional(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;