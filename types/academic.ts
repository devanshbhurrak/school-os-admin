import type { ID, ISODate, ISODateTime } from "./api";

export const AcademicYearStatus = {
  Draft: "DRAFT",
  Active: "ACTIVE",
  Closed: "CLOSED",
} as const;
export type AcademicYearStatus =
  (typeof AcademicYearStatus)[keyof typeof AcademicYearStatus];

export const AcademicTermStatus = {
  Active: "ACTIVE",
  Closed: "CLOSED",
} as const;
export type AcademicTermStatus =
  (typeof AcademicTermStatus)[keyof typeof AcademicTermStatus];

export const AcademicClassStatus = {
  Active: "ACTIVE",
  Archived: "ARCHIVED",
} as const;
export type AcademicClassStatus =
  (typeof AcademicClassStatus)[keyof typeof AcademicClassStatus];

export const SubjectType = {
  Core: "CORE",
  Optional: "OPTIONAL",
  Elective: "ELECTIVE",
  Practical: "PRACTICAL",
  CoCurricular: "CO_CURRICULAR",
  Activity: "ACTIVITY",
} as const;
export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType];

export const SubjectStatus = {
  Active: "ACTIVE",
  Archived: "ARCHIVED",
} as const;
export type SubjectStatus = (typeof SubjectStatus)[keyof typeof SubjectStatus];

export const CohortStatus = {
  Active: "ACTIVE",
  Archived: "ARCHIVED",
} as const;
export type CohortStatus = (typeof CohortStatus)[keyof typeof CohortStatus];

export interface AcademicYear {
  id: ID;
  school_id: ID;
  organization_id: ID;
  code: string;
  name: string;
  start_date: ISODate;
  end_date: ISODate;
  is_current: boolean;
  status: AcademicYearStatus;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface AcademicYearCreate {
  code: string;
  name: string;
  start_date: ISODate;
  end_date: ISODate;
  is_current?: boolean;
  status?: AcademicYearStatus;
}

export interface AcademicYearUpdate {
  name?: string;
  start_date?: ISODate;
  end_date?: ISODate;
  is_current?: boolean;
  status?: AcademicYearStatus;
  version: number;
}

export interface AcademicTerm {
  id: ID;
  school_id: ID;
  organization_id: ID;
  academic_year_id: ID;
  code: string;
  name: string;
  start_date: ISODate;
  end_date: ISODate;
  status: AcademicTermStatus;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface AcademicTermCreate {
  academic_year_id: ID;
  code: string;
  name: string;
  start_date: ISODate;
  end_date: ISODate;
  status?: AcademicTermStatus;
}

export interface AcademicTermUpdate {
  name?: string;
  start_date?: ISODate;
  end_date?: ISODate;
  status?: AcademicTermStatus;
  version: number;
}

export interface AcademicClass {
  id: ID;
  school_id: ID;
  organization_id: ID;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  status: AcademicClassStatus;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface AcademicClassCreate {
  code: string;
  name: string;
  description?: string | null;
  sort_order?: number;
  status?: AcademicClassStatus;
}

export interface AcademicClassUpdate {
  name?: string;
  description?: string | null;
  sort_order?: number;
  status?: AcademicClassStatus;
  version: number;
}

export interface Subject {
  id: ID;
  school_id: ID;
  organization_id: ID;
  code: string;
  name: string;
  description: string | null;
  subject_type: SubjectType;
  status: SubjectStatus;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface SubjectCreate {
  code: string;
  name: string;
  description?: string | null;
  subject_type?: SubjectType;
  status?: SubjectStatus;
}

export interface SubjectUpdate {
  name?: string;
  description?: string | null;
  subject_type?: SubjectType;
  status?: SubjectStatus;
  version: number;
}

/** Class subjects are NOT versioned and have no PATCH — create + delete only. */
export interface ClassSubject {
  id: ID;
  school_id: ID;
  organization_id: ID;
  academic_class_id: ID;
  subject_id: ID;
  effective_from_year_id: ID;
  effective_to_year_id: ID | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface ClassSubjectCreate {
  academic_class_id: ID;
  subject_id: ID;
  effective_from_year_id: ID;
  effective_to_year_id?: ID | null;
}

export interface Cohort {
  id: ID;
  school_id: ID;
  organization_id: ID;
  academic_year_id: ID;
  academic_class_id: ID;
  code: string;
  name: string;
  capacity: number | null;
  status: CohortStatus;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface CohortCreate {
  academic_year_id: ID;
  academic_class_id: ID;
  code: string;
  name: string;
  capacity?: number | null;
  status?: CohortStatus;
}

export interface CohortUpdate {
  name?: string;
  capacity?: number | null;
  status?: CohortStatus;
  version: number;
}