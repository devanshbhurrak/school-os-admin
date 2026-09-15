export const PERMISSIONS = {
  organization: {
    list: "iam.organization.list",
    read: "iam.organization.read",
    create: "iam.organization.create",
    update: "iam.organization.update",
    delete: "iam.organization.delete",
  },
  school: {
    list: "iam.school.list",
    read: "iam.school.read",
    create: "iam.school.create",
    update: "iam.school.update",
    delete: "iam.school.delete",
  },
  user: {
    list: "iam.user.list",
    read: "iam.user.read",
    create: "iam.user.create",
    update: "iam.user.update",
    delete: "iam.user.delete",
    invite: "iam.user.invite",
  },
  membership: {
    list: "iam.membership.list",
    read: "iam.membership.read",
    create: "iam.membership.create",
    update: "iam.membership.update",
    delete: "iam.membership.delete",
    grantRole: "iam.membership.grant_role",
    revokeRole: "iam.membership.revoke_role",
  },
  role: {
    list: "iam.role.list",
    read: "iam.role.read",
    create: "iam.role.create",
    update: "iam.role.update",
    delete: "iam.role.delete",
  },
  person: {
    list: "people.person.list",
    read: "people.person.read",
    create: "people.person.create",
    update: "people.person.update",
    delete: "people.person.delete",
    merge: "people.person.merge",
  },
  contact: {
    list: "people.contact.list",
    read: "people.contact.read",
    create: "people.contact.create",
    update: "people.contact.update",
    delete: "people.contact.delete",
  },
  address: {
    list: "people.address.list",
    read: "people.address.read",
    create: "people.address.create",
    update: "people.address.update",
    delete: "people.address.delete",
  },
  academicYear: {
    list: "academic.academic_year.list",
    read: "academic.academic_year.read",
    create: "academic.academic_year.create",
    update: "academic.academic_year.update",
    delete: "academic.academic_year.delete",
  },
  academicTerm: {
    list: "academic.academic_term.list",
    read: "academic.academic_term.read",
    create: "academic.academic_term.create",
    update: "academic.academic_term.update",
    delete: "academic.academic_term.delete",
  },
  academicClass: {
    list: "academic.academic_class.list",
    read: "academic.academic_class.read",
    create: "academic.academic_class.create",
    update: "academic.academic_class.update",
    delete: "academic.academic_class.delete",
  },
  subject: {
    list: "academic.subject.list",
    read: "academic.subject.read",
    create: "academic.subject.create",
    update: "academic.subject.update",
    delete: "academic.subject.delete",
  },
  classSubject: {
    list: "academic.class_subject.list",
    read: "academic.class_subject.read",
    create: "academic.class_subject.create",
    delete: "academic.class_subject.delete",
  },
  cohort: {
    list: "academic.cohort.list",
    read: "academic.cohort.read",
    create: "academic.cohort.create",
    update: "academic.cohort.update",
    delete: "academic.cohort.delete",
  },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS;

/** Human-readable permission catalogue grouped for the role editor and permission matrix. */
export const PERMISSION_CATALOGUE: {
  module: string;
  moduleLabel: string;
  resources: {
    resource: string;
    resourceLabel: string;
    actions: { code: string; label: string }[];
  }[];
}[] = [
  {
    module: "people",
    moduleLabel: "People",
    resources: [
      {
        resource: "person",
        resourceLabel: "People",
        actions: [
          { code: PERMISSIONS.person.list, label: "View list" },
          { code: PERMISSIONS.person.read, label: "View details" },
          { code: PERMISSIONS.person.create, label: "Add" },
          { code: PERMISSIONS.person.update, label: "Edit" },
          { code: PERMISSIONS.person.delete, label: "Delete" },
          { code: PERMISSIONS.person.merge, label: "Merge records" },
        ],
      },
      {
        resource: "contact",
        resourceLabel: "Contact information",
        actions: [
          { code: PERMISSIONS.contact.list, label: "View list" },
          { code: PERMISSIONS.contact.read, label: "View details" },
          { code: PERMISSIONS.contact.create, label: "Add" },
          { code: PERMISSIONS.contact.update, label: "Edit" },
          { code: PERMISSIONS.contact.delete, label: "Delete" },
        ],
      },
      {
        resource: "address",
        resourceLabel: "Addresses",
        actions: [
          { code: PERMISSIONS.address.list, label: "View list" },
          { code: PERMISSIONS.address.read, label: "View details" },
          { code: PERMISSIONS.address.create, label: "Add" },
          { code: PERMISSIONS.address.update, label: "Edit" },
          { code: PERMISSIONS.address.delete, label: "Delete" },
        ],
      },
    ],
  },
  {
    module: "academic",
    moduleLabel: "Academics",
    resources: [
      {
        resource: "academic_year",
        resourceLabel: "Academic years",
        actions: [
          { code: PERMISSIONS.academicYear.list, label: "View list" },
          { code: PERMISSIONS.academicYear.read, label: "View details" },
          { code: PERMISSIONS.academicYear.create, label: "Add" },
          { code: PERMISSIONS.academicYear.update, label: "Edit" },
          { code: PERMISSIONS.academicYear.delete, label: "Delete" },
        ],
      },
      {
        resource: "academic_term",
        resourceLabel: "Terms",
        actions: [
          { code: PERMISSIONS.academicTerm.list, label: "View list" },
          { code: PERMISSIONS.academicTerm.read, label: "View details" },
          { code: PERMISSIONS.academicTerm.create, label: "Add" },
          { code: PERMISSIONS.academicTerm.update, label: "Edit" },
          { code: PERMISSIONS.academicTerm.delete, label: "Delete" },
        ],
      },
      {
        resource: "academic_class",
        resourceLabel: "Classes",
        actions: [
          { code: PERMISSIONS.academicClass.list, label: "View list" },
          { code: PERMISSIONS.academicClass.read, label: "View details" },
          { code: PERMISSIONS.academicClass.create, label: "Add" },
          { code: PERMISSIONS.academicClass.update, label: "Edit" },
          { code: PERMISSIONS.academicClass.delete, label: "Delete" },
        ],
      },
      {
        resource: "subject",
        resourceLabel: "Subjects",
        actions: [
          { code: PERMISSIONS.subject.list, label: "View list" },
          { code: PERMISSIONS.subject.read, label: "View details" },
          { code: PERMISSIONS.subject.create, label: "Add" },
          { code: PERMISSIONS.subject.update, label: "Edit" },
          { code: PERMISSIONS.subject.delete, label: "Delete" },
        ],
      },
      {
        resource: "class_subject",
        resourceLabel: "Subject assignments",
        actions: [
          { code: PERMISSIONS.classSubject.list, label: "View list" },
          { code: PERMISSIONS.classSubject.read, label: "View details" },
          { code: PERMISSIONS.classSubject.create, label: "Assign" },
          { code: PERMISSIONS.classSubject.delete, label: "Remove" },
        ],
      },
      {
        resource: "cohort",
        resourceLabel: "Sections",
        actions: [
          { code: PERMISSIONS.cohort.list, label: "View list" },
          { code: PERMISSIONS.cohort.read, label: "View details" },
          { code: PERMISSIONS.cohort.create, label: "Add" },
          { code: PERMISSIONS.cohort.update, label: "Edit" },
          { code: PERMISSIONS.cohort.delete, label: "Delete" },
        ],
      },
    ],
  },
  {
    module: "iam",
    moduleLabel: "Settings & Access",
    resources: [
      {
        resource: "organization",
        resourceLabel: "Organizations",
        actions: [
          { code: PERMISSIONS.organization.list, label: "View list" },
          { code: PERMISSIONS.organization.read, label: "View details" },
          { code: PERMISSIONS.organization.create, label: "Add" },
          { code: PERMISSIONS.organization.update, label: "Edit" },
          { code: PERMISSIONS.organization.delete, label: "Delete" },
        ],
      },
      {
        resource: "school",
        resourceLabel: "Schools",
        actions: [
          { code: PERMISSIONS.school.list, label: "View list" },
          { code: PERMISSIONS.school.read, label: "View details" },
          { code: PERMISSIONS.school.create, label: "Add" },
          { code: PERMISSIONS.school.update, label: "Edit" },
          { code: PERMISSIONS.school.delete, label: "Delete" },
        ],
      },
      {
        resource: "user",
        resourceLabel: "User accounts",
        actions: [
          { code: PERMISSIONS.user.list, label: "View list" },
          { code: PERMISSIONS.user.read, label: "View details" },
          { code: PERMISSIONS.user.create, label: "Add" },
          { code: PERMISSIONS.user.update, label: "Edit" },
          { code: PERMISSIONS.user.delete, label: "Delete" },
          { code: PERMISSIONS.user.invite, label: "Invite" },
        ],
      },
      {
        resource: "membership",
        resourceLabel: "School access",
        actions: [
          { code: PERMISSIONS.membership.list, label: "View list" },
          { code: PERMISSIONS.membership.read, label: "View details" },
          { code: PERMISSIONS.membership.create, label: "Grant" },
          { code: PERMISSIONS.membership.update, label: "Edit" },
          { code: PERMISSIONS.membership.delete, label: "End" },
          { code: PERMISSIONS.membership.grantRole, label: "Grant roles" },
          { code: PERMISSIONS.membership.revokeRole, label: "Revoke roles" },
        ],
      },
      {
        resource: "role",
        resourceLabel: "Roles",
        actions: [
          { code: PERMISSIONS.role.list, label: "View list" },
          { code: PERMISSIONS.role.read, label: "View details" },
          { code: PERMISSIONS.role.create, label: "Add" },
          { code: PERMISSIONS.role.update, label: "Edit" },
          { code: PERMISSIONS.role.delete, label: "Delete" },
        ],
      },
    ],
  },
];
