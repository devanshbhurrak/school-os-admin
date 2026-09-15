import { apiClient } from "./api-client";
import type { CursorPage, CursorParams, ISODateTime } from "@/types";

export const AuditAction = {
  OrganizationCreated: "ORGANIZATION_CREATED",
  OrganizationUpdated: "ORGANIZATION_UPDATED",
  OrganizationDeleted: "ORGANIZATION_DELETED",
  SchoolCreated: "SCHOOL_CREATED",
  SchoolUpdated: "SCHOOL_UPDATED",
  SchoolDeleted: "SCHOOL_DELETED",
  UserCreated: "USER_CREATED",
  UserUpdated: "USER_UPDATED",
  UserDeleted: "USER_DELETED",
  MembershipCreated: "MEMBERSHIP_CREATED",
  MembershipUpdated: "MEMBERSHIP_UPDATED",
  MembershipEnded: "MEMBERSHIP_ENDED",
  RoleCreated: "ROLE_CREATED",
  RoleUpdated: "ROLE_UPDATED",
  RoleDeleted: "ROLE_DELETED",
  RoleGranted: "ROLE_GRANTED",
  RoleRevoked: "ROLE_REVOKED",
  PersonCreated: "PERSON_CREATED",
  PersonUpdated: "PERSON_UPDATED",
  PersonDeleted: "PERSON_DELETED",
  PersonMerged: "PERSON_MERGED",
  AddressCreated: "ADDRESS_CREATED",
  AddressUpdated: "ADDRESS_UPDATED",
  AddressDeleted: "ADDRESS_DELETED",
  ContactCreated: "CONTACT_CREATED",
  ContactUpdated: "CONTACT_UPDATED",
  ContactDeleted: "CONTACT_DELETED",
  AcademicYearCreated: "ACADEMIC_YEAR_CREATED",
  AcademicYearUpdated: "ACADEMIC_YEAR_UPDATED",
  AcademicYearDeleted: "ACADEMIC_YEAR_DELETED",
  AcademicTermCreated: "ACADEMIC_TERM_CREATED",
  AcademicTermUpdated: "ACADEMIC_TERM_UPDATED",
  AcademicTermDeleted: "ACADEMIC_TERM_DELETED",
  AcademicClassCreated: "ACADEMIC_CLASS_CREATED",
  AcademicClassUpdated: "ACADEMIC_CLASS_UPDATED",
  AcademicClassDeleted: "ACADEMIC_CLASS_DELETED",
  SubjectCreated: "SUBJECT_CREATED",
  SubjectUpdated: "SUBJECT_UPDATED",
  SubjectDeleted: "SUBJECT_DELETED",
  ClassSubjectCreated: "CLASS_SUBJECT_CREATED",
  ClassSubjectDeleted: "CLASS_SUBJECT_DELETED",
  CohortCreated: "COHORT_CREATED",
  CohortUpdated: "COHORT_UPDATED",
  CohortDeleted: "COHORT_DELETED",
  LoginSuccess: "LOGIN_SUCCESS",
  LoginFailure: "LOGIN_FAILURE",
  Logout: "LOGOUT",
  PasswordChanged: "PASSWORD_CHANGED",
  PasswordResetRequested: "PASSWORD_RESET_REQUESTED",
  PasswordResetConfirmed: "PASSWORD_RESET_CONFIRMED",
} as const;

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export interface AuditLog {
  id: string;
  organization_id: string | null;
  school_id: string | null;
  actor_user_id: string | null;
  actor_label: string | null;
  action: AuditAction;
  entity_type: string | null;
  entity_id: string | null;
  summary: string | null;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  context: Record<string, unknown>;
  request_id: string | null;
  ip_address: string | null;
  created_at: ISODateTime;
}

export interface AuditLogListParams extends CursorParams {
  entity_type?: string;
  entity_id?: string;
  actor_user_id?: string;
  school_id?: string;
  created_from?: string;
  created_to?: string;
}

export async function listAuditLogs(
  params: AuditLogListParams = {},
): Promise<CursorPage<AuditLog>> {
  const { data } = await apiClient.get<CursorPage<AuditLog>>("/audit-logs", {
    params,
  });
  return data;
}
