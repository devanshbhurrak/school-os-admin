import type { ID, ISODate, ISODateTime } from "./api";

export const OrganizationStatus = {
  Trial: "TRIAL",
  Active: "ACTIVE",
  Suspended: "SUSPENDED",
  Closed: "CLOSED",
} as const;
export type OrganizationStatus =
  (typeof OrganizationStatus)[keyof typeof OrganizationStatus];

export const SchoolStatus = {
  Setup: "SETUP",
  Active: "ACTIVE",
  Suspended: "SUSPENDED",
  Closed: "CLOSED",
} as const;
export type SchoolStatus = (typeof SchoolStatus)[keyof typeof SchoolStatus];

export const UserStatus = {
  Invited: "INVITED",
  Active: "ACTIVE",
  Suspended: "SUSPENDED",
  Disabled: "DISABLED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const MembershipStatus = {
  Active: "ACTIVE",
  Inactive: "INACTIVE",
  Ended: "ENDED",
} as const;
export type MembershipStatus =
  (typeof MembershipStatus)[keyof typeof MembershipStatus];

export const RoleScopeLevel = {
  Platform: "PLATFORM",
  Organization: "ORGANIZATION",
  School: "SCHOOL",
} as const;
export type RoleScopeLevel =
  (typeof RoleScopeLevel)[keyof typeof RoleScopeLevel];

export const DataScope = {
  Own: "OWN",
  Assigned: "ASSIGNED",
  School: "SCHOOL",
  Organization: "ORGANIZATION",
  Platform: "PLATFORM",
} as const;
export type DataScope = (typeof DataScope)[keyof typeof DataScope];

export interface Organization {
  id: ID;
  code: string;
  name: string;
  legal_name: string | null;
  status: OrganizationStatus;
  timezone: string;
  locale: string;
  contact_email: string | null;
  contact_phone: string | null;
  plan_code: string;
  settings: Record<string, unknown>;
  entitlements: Record<string, unknown>;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface School {
  id: ID;
  organization_id: ID;
  code: string;
  name: string;
  short_name: string | null;
  board: string | null;
  affiliation_number: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: SchoolStatus;
  timezone: string;
  locale: string;
  settings: Record<string, unknown>;
  address_id: ID | null;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface SchoolCreate {
  organization_id: ID;
  code: string;
  name: string;
  short_name?: string | null;
  board?: string | null;
  affiliation_number?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
}

export interface SchoolUpdate {
  name?: string;
  short_name?: string | null;
  status?: SchoolStatus;
  board?: string | null;
  affiliation_number?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  timezone?: string | null;
  locale?: string | null;
  settings?: Record<string, unknown> | null;
  version: number;
}

export interface User {
  id: ID;
  person_id: ID | null;
  email: string | null;
  email_verified_at: ISODateTime | null;
  phone: string | null;
  phone_verified_at: ISODateTime | null;
  status: UserStatus;
  must_change_password: boolean;
  is_platform_admin: boolean;
  last_login_at: ISODateTime | null;
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  memberships: MembershipBrief[];
}

export interface MembershipBrief {
  id: ID;
  organization_id: ID;
  school_id: ID | null;
  status: MembershipStatus;
  is_default: boolean;
  start_date: ISODate | null;
  end_date: ISODate | null;
}

export interface UserCreate {
  email?: string | null;
  phone?: string | null;
  password?: string | null;
  school_id?: ID | null;
}

export interface UserUpdate {
  email?: string | null;
  phone?: string | null;
  status?: UserStatus | null;
  must_change_password?: boolean | null;
  version: number;
}

export interface Role {
  id: ID;
  organization_id: ID | null;
  code: string;
  name: string;
  description: string | null;
  scope_level: RoleScopeLevel;
  data_scope: DataScope;
  is_system: boolean;
  is_default: boolean;
  permission_codes: string[];
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface RoleCreate {
  code: string;
  name: string;
  description?: string | null;
  scope_level?: RoleScopeLevel;
  data_scope?: DataScope;
  permission_codes?: string[];
}

export interface RoleUpdate {
  name?: string;
  description?: string | null;
  data_scope?: DataScope;
  permission_codes?: string[];
  version: number;
}

export interface Membership {
  id: ID;
  user_id: ID;
  organization_id: ID;
  school_id: ID | null;
  status: MembershipStatus;
  start_date: ISODate | null;
  end_date: ISODate | null;
  is_default: boolean;
  notes: string | null;
  role_codes: string[];
  version: number;
  created_at: ISODateTime;
  updated_at: ISODateTime;
}

export interface MembershipCreate {
  user_id: ID;
  school_id?: ID | null;
  start_date?: ISODate | null;
  end_date?: ISODate | null;
  is_default?: boolean;
  role_ids?: ID[];
}

export interface MembershipUpdate {
  status?: MembershipStatus | null;
  start_date?: ISODate | null;
  end_date?: ISODate | null;
  is_default?: boolean | null;
  notes?: string | null;
  version: number;
}

export interface RoleGrantCreate {
  role_id: ID;
  expires_at?: ISODateTime | null;
  data_scope?: DataScope | null;
}

export interface OrganizationCreate {
  code: string;
  name: string;
  legal_name?: string | null;
  timezone?: string;
  locale?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
  plan_code?: string;
}

export interface OrganizationUpdate {
  name?: string;
  legal_name?: string | null;
  status?: OrganizationStatus;
  timezone?: string | null;
  locale?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  plan_code?: string | null;
  settings?: Record<string, unknown> | null;
  entitlements?: Record<string, unknown> | null;
  version: number;
}