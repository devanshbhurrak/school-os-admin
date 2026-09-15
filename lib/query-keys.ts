import type { CursorParams, EntityType } from "@/types";
import type {
  AuditLogListParams,
  ClassSubjectListParams,
  CohortListParams,
  MembershipListParams,
} from "@/services";

export const STALE_TIME = {
  frequent: 30_000,
  entity: 60_000,
  config: 5 * 60_000,
  auth: 60_000,
} as const;

/** Auth / identity — org-scoped, never school-scoped. */
export const authKeys = {
  me: ["auth", "me"] as const,
};

/** Org-scoped (shared across schools). */
export const orgKeys = {
  schools: (params: CursorParams = {}) => ["org", "schools", params] as const,
  school: (schoolId: string) => ["org", "schools", schoolId] as const,
  users: (params: CursorParams = {}) => ["org", "users", params] as const,
  user: (userId: string) => ["org", "users", userId] as const,
  roles: (params: CursorParams = {}) => ["org", "roles", params] as const,
  role: (roleId: string) => ["org", "roles", roleId] as const,
  memberships: (
    params: CursorParams & { school_id?: string; user_id?: string } = {},
  ) => ["org", "memberships", params] as const,
  membership: (membershipId: string) =>
    ["org", "memberships", membershipId] as const,
  organizations: (params: CursorParams = {}) =>
    ["org", "organizations", params] as const,
};

/** School-scoped — all removed from cache when the active school changes. */
export const schoolKeys = {
  years: (
    schoolId: string,
    params: CursorParams = {},
  ) => ["school", schoolId, "academic-years", params] as const,
  year: (schoolId: string, yearId: string) =>
    ["school", schoolId, "academic-years", yearId] as const,
  terms: (
    schoolId: string,
    params: { academic_year_id?: string; limit?: number } = {},
  ) => ["school", schoolId, "academic-terms", params] as const,
  classes: (
    schoolId: string,
    params: CursorParams = {},
  ) => ["school", schoolId, "academic-classes", params] as const,
  class: (schoolId: string, classId: string) =>
    ["school", schoolId, "academic-classes", classId] as const,
  subjects: (
    schoolId: string,
    params: CursorParams = {},
  ) => ["school", schoolId, "subjects", params] as const,
  subject: (schoolId: string, subjectId: string) =>
    ["school", schoolId, "subjects", subjectId] as const,
  classSubjects: (
    schoolId: string,
    params: ClassSubjectListParams = {},
  ) => ["school", schoolId, "class-subjects", params] as const,
  cohorts: (
    schoolId: string,
    params: CohortListParams = {},
  ) => ["school", schoolId, "cohorts", params] as const,
  cohort: (schoolId: string, cohortId: string) =>
    ["school", schoolId, "cohorts", cohortId] as const,
  persons: (
    schoolId: string,
    params: { search?: string; limit?: number } = {},
  ) => ["school", schoolId, "persons", params] as const,
  person: (schoolId: string, personId: string) =>
    ["school", schoolId, "persons", personId] as const,
  contacts: (schoolId: string, entityType: EntityType, entityId: string) =>
    ["school", schoolId, "contacts", entityType, entityId] as const,
  addresses: (schoolId: string, entityType: EntityType, entityId: string) =>
    ["school", schoolId, "addresses", entityType, entityId] as const,
  audit: (schoolId: string, params: AuditLogListParams = {}) =>
    ["school", schoolId, "audit", params] as const,
};

/** Platform-admin scoped — cross-org, no school context. */
export const platformKeys = {
  // Organizations
  organizations: (params: CursorParams = {}) =>
    ["platform", "organizations", params] as const,
  organization: (orgId: string) =>
    ["platform", "organizations", orgId] as const,
  orgSchools: (orgId: string, params: CursorParams = {}) =>
    ["platform", "organizations", orgId, "schools", params] as const,
  /** Full membership list for the memberships tab. */
  orgMemberships: (orgId: string, params: MembershipListParams = {}) =>
    ["platform", "organizations", orgId, "memberships", params] as const,
  /** Membership IDs fetched internally by the users tab to resolve user list — separate key to avoid collision. */
  orgMembershipsForUsers: (orgId: string) =>
    ["platform", "organizations", orgId, "memberships-for-users"] as const,
  orgAudit: (orgId: string, params: AuditLogListParams = {}) =>
    ["platform", "organizations", orgId, "audit", params] as const,

  // Schools
  schools: (params: CursorParams = {}) =>
    ["platform", "schools", params] as const,
  school: (schoolId: string) =>
    ["platform", "schools", schoolId] as const,
  schoolMemberships: (schoolId: string, params: MembershipListParams = {}) =>
    ["platform", "schools", schoolId, "memberships", params] as const,
  schoolAudit: (schoolId: string, params: AuditLogListParams = {}) =>
    ["platform", "schools", schoolId, "audit", params] as const,

  // Users
  users: (params: CursorParams = {}) =>
    ["platform", "users", params] as const,
  user: (userId: string) =>
    ["platform", "users", userId] as const,
  userMemberships: (userId: string, params: MembershipListParams = {}) =>
    ["platform", "users", userId, "memberships", params] as const,
  userAudit: (userId: string, params: AuditLogListParams = {}) =>
    ["platform", "users", userId, "audit", params] as const,

  // Roles
  roles: (params: CursorParams = {}) =>
    ["platform", "roles", params] as const,
  role: (roleId: string) =>
    ["platform", "roles", roleId] as const,

  // Platform-wide audit
  audit: (params: AuditLogListParams = {}) =>
    ["platform", "audit", params] as const,
};
