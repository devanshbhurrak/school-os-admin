import type { AddressType, ContactType } from "@/types";

/** User-facing labels for every entity status value. */
export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DECEASED: "Deceased",
  MERGED: "Merged",
  DRAFT: "Draft",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
  SETUP: "Setting up",
  SUSPENDED: "Suspended",
  INVITED: "Invited",
  DISABLED: "Disabled",
  ENDED: "Ended",
  TRIAL: "Trial",
  CURRENT: "Current",
};

export const SUBJECT_TYPE_LABELS: Record<string, string> = {
  CORE: "Core",
  OPTIONAL: "Optional",
  ELECTIVE: "Elective",
  PRACTICAL: "Practical",
  CO_CURRICULAR: "Co-curricular",
  ACTIVITY: "Activity",
};

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  PHONE: "Phone",
  EMAIL: "Email",
  WHATSAPP: "WhatsApp",
};

export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  RESIDENTIAL: "Residential",
  PERMANENT: "Permanent",
  CORRESPONDENCE: "Correspondence",
  CAMPUS: "Campus",
  OTHER: "Other",
};

export const ROLE_SCOPE_LABELS: Record<string, string> = {
  PLATFORM: "Platform",
  ORGANIZATION: "Organization",
  SCHOOL: "School",
};

export const DATA_SCOPE_LABELS: Record<string, string> = {
  OWN: "Own records",
  ASSIGNED: "Assigned records",
  SCHOOL: "Whole school",
  ORGANIZATION: "Whole organization",
  PLATFORM: "All data",
};

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

export const COUNTRY_CODES = ["IN", "US", "UK", "AE", "SG", "AU", "CA", "NZ"];

export const SCHOOL_BOARDS = ["CBSE", "ICSE", "State Board", "IB", "IGCSE", "Other"];

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  ORGANIZATION_CREATED: "Organization created",
  ORGANIZATION_UPDATED: "Organization updated",
  ORGANIZATION_DELETED: "Organization deleted",
  SCHOOL_CREATED: "School created",
  SCHOOL_UPDATED: "School updated",
  SCHOOL_DELETED: "School deleted",
  USER_CREATED: "User created",
  USER_UPDATED: "User updated",
  USER_DELETED: "User deleted",
  MEMBERSHIP_CREATED: "Membership granted",
  MEMBERSHIP_UPDATED: "Membership updated",
  MEMBERSHIP_ENDED: "Membership ended",
  ROLE_CREATED: "Role created",
  ROLE_UPDATED: "Role updated",
  ROLE_DELETED: "Role deleted",
  ROLE_GRANTED: "Role granted",
  ROLE_REVOKED: "Role revoked",
  PERSON_CREATED: "Person created",
  PERSON_UPDATED: "Person updated",
  PERSON_DELETED: "Person deleted",
  PERSON_MERGED: "Person merged",
  ADDRESS_CREATED: "Address added",
  ADDRESS_UPDATED: "Address updated",
  ADDRESS_DELETED: "Address removed",
  CONTACT_CREATED: "Contact added",
  CONTACT_UPDATED: "Contact updated",
  CONTACT_DELETED: "Contact removed",
  ACADEMIC_YEAR_CREATED: "Academic year created",
  ACADEMIC_YEAR_UPDATED: "Academic year updated",
  ACADEMIC_YEAR_DELETED: "Academic year deleted",
  ACADEMIC_TERM_CREATED: "Term created",
  ACADEMIC_TERM_UPDATED: "Term updated",
  ACADEMIC_TERM_DELETED: "Term deleted",
  ACADEMIC_CLASS_CREATED: "Class created",
  ACADEMIC_CLASS_UPDATED: "Class updated",
  ACADEMIC_CLASS_DELETED: "Class deleted",
  SUBJECT_CREATED: "Subject created",
  SUBJECT_UPDATED: "Subject updated",
  SUBJECT_DELETED: "Subject deleted",
  CLASS_SUBJECT_CREATED: "Subject assigned",
  CLASS_SUBJECT_DELETED: "Subject unassigned",
  COHORT_CREATED: "Section created",
  COHORT_UPDATED: "Section updated",
  COHORT_DELETED: "Section deleted",
  LOGIN_SUCCESS: "Signed in",
  LOGIN_FAILURE: "Failed sign-in",
  LOGOUT: "Signed out",
  PASSWORD_CHANGED: "Password changed",
  PASSWORD_RESET_REQUESTED: "Password reset requested",
  PASSWORD_RESET_CONFIRMED: "Password reset completed",
};
