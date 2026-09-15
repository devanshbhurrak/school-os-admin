import type { ID, ISODate, ISODateTime } from "./api";

export const PersonStatus = {
  Active: "ACTIVE",
  Inactive: "INACTIVE",
  Deceased: "DECEASED",
  Merged: "MERGED",
} as const;
export type PersonStatus = (typeof PersonStatus)[keyof typeof PersonStatus];

export interface Person {
  id: ID;
  organization_id: ID;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  date_of_birth: ISODate | null;
  gender: string | null;
  blood_group: string | null;
  nationality: string | null;
  primary_phone: string | null;
  primary_email: string | null;
  address_id: ID | null;
  status: PersonStatus;
  custom_fields: Record<string, unknown>;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface PersonCreate {
  first_name: string;
  middle_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  date_of_birth?: ISODate | null;
  gender?: string | null;
  blood_group?: string | null;
  nationality?: string | null;
  primary_phone?: string | null;
  primary_email?: string | null;
  address_id?: ID | null;
  custom_fields?: Record<string, unknown>;
}

export interface PersonUpdate {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string | null;
  preferred_name?: string | null;
  date_of_birth?: ISODate | null;
  gender?: string | null;
  blood_group?: string | null;
  nationality?: string | null;
  primary_phone?: string | null;
  primary_email?: string | null;
  address_id?: ID | null;
  custom_fields?: Record<string, unknown>;
  version: number;
}

export interface PersonMerge {
  target_person_id: ID;
  version: number;
}