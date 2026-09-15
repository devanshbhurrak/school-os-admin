import type { ID, ISODateTime } from "./api";

export const EntityType = {
  Person: "PERSON",
  School: "SCHOOL",
} as const;
export type EntityType = (typeof EntityType)[keyof typeof EntityType];

export const ContactType = {
  Phone: "PHONE",
  Email: "EMAIL",
  Whatsapp: "WHATSAPP",
} as const;
export type ContactType = (typeof ContactType)[keyof typeof ContactType];

export const AddressType = {
  Residential: "RESIDENTIAL",
  Permanent: "PERMANENT",
  Correspondence: "CORRESPONDENCE",
  Campus: "CAMPUS",
  Other: "OTHER",
} as const;
export type AddressType = (typeof AddressType)[keyof typeof AddressType];

export interface Contact {
  id: ID;
  organization_id: ID;
  entity_type: string;
  entity_id: ID;
  contact_type: ContactType;
  value: string;
  label: string | null;
  is_primary: boolean;
  is_emergency: boolean;
  verified_at: ISODateTime | null;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface ContactCreate {
  entity_type: EntityType;
  entity_id: ID;
  contact_type: ContactType;
  value: string;
  label?: string | null;
  is_primary?: boolean;
  is_emergency?: boolean;
}

/** Contacts are NOT versioned — no `version` field on update/delete. */
export interface ContactUpdate {
  contact_type?: ContactType | null;
  value?: string | null;
  label?: string | null;
  is_primary?: boolean | null;
  is_emergency?: boolean | null;
}

export interface Address {
  id: ID;
  organization_id: ID;
  entity_type: string;
  entity_id: ID;
  address_type: AddressType;
  line1: string | null;
  line2: string | null;
  landmark: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  postal_code: string | null;
  country_code: string;
  is_primary: boolean;
  latitude: number | null;
  longitude: number | null;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface AddressCreate {
  entity_type: EntityType;
  entity_id: ID;
  address_type?: AddressType;
  line1?: string | null;
  line2?: string | null;
  landmark?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string;
  is_primary?: boolean;
}

export interface AddressUpdate {
  address_type?: AddressType | null;
  line1?: string | null;
  line2?: string | null;
  landmark?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  is_primary?: boolean | null;
  version: number;
}
