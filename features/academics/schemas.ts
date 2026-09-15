import { z } from "zod";

export const yearFormSchema = z.object({
  name: z.string().min(1, "Year name is required.").max(255),
  code: z.string().min(1, "Code is required.").max(64),
  start_date: z.string().min(1, "Start date is required."),
  end_date: z.string().min(1, "End date is required."),
  is_current: z.boolean().optional(),
  status: z.string().optional(),
});

export const termFormSchema = z.object({
  name: z.string().min(1, "Term name is required.").max(255),
  code: z.string().min(1, "Code is required.").max(64),
  academic_year_id: z.string().min(1, "Choose an academic year."),
  start_date: z.string().min(1, "Start date is required."),
  end_date: z.string().min(1, "End date is required."),
  status: z.string().optional(),
});

export const classFormSchema = z.object({
  name: z.string().min(1, "Class name is required.").max(255),
  code: z.string().min(1, "Code is required.").max(64),
  description: z.string().max(512).optional(),
  sort_order: z.string().optional(),
  status: z.string().optional(),
});

export const subjectFormSchema = z.object({
  name: z.string().min(1, "Subject name is required.").max(255),
  code: z.string().min(1, "Code is required.").max(64),
  description: z.string().max(512).optional(),
  subject_type: z.string().min(1, "Choose a subject type."),
  status: z.string().optional(),
});

export const cohortFormSchema = z.object({
  name: z.string().min(1, "Section name is required.").max(255),
  code: z.string().min(1, "Code is required.").max(64),
  academic_year_id: z.string().min(1, "Choose an academic year."),
  academic_class_id: z.string().min(1, "Choose a class."),
  capacity: z.string().optional(),
  status: z.string().optional(),
});

export const classSubjectFormSchema = z.object({
  academic_class_id: z.string().min(1, "Choose a class."),
  subject_id: z.string().min(1, "Choose a subject."),
  effective_from_year_id: z.string().min(1, "Choose a year."),
  effective_to_year_id: z.string().optional(),
});