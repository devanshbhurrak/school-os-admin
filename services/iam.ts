import { apiClient } from "./api-client";
import type {
  CursorPage,
  CursorParams,
  Membership,
  MembershipCreate,
  MembershipUpdate,
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  Role,
  RoleCreate,
  RoleGrantCreate,
  RoleUpdate,
  School,
  SchoolCreate,
  SchoolUpdate,
  User,
  UserCreate,
  UserUpdate,
} from "@/types";

export interface SchoolListParams extends CursorParams {
  organization_id?: string;
  status?: string;
}

export async function listSchools(
  params: SchoolListParams = {},
): Promise<CursorPage<School>> {
  const { data } = await apiClient.get<CursorPage<School>>("/schools", { params });
  return data;
}

export async function getSchool(schoolId: string): Promise<School> {
  const { data } = await apiClient.get<School>(`/schools/${schoolId}`);
  return data;
}

export async function createSchool(input: SchoolCreate): Promise<School> {
  const { data } = await apiClient.post<School>("/schools", input);
  return data;
}

export async function updateSchool(
  schoolId: string,
  input: SchoolUpdate,
): Promise<School> {
  const { data } = await apiClient.patch<School>(`/schools/${schoolId}`, input);
  return data;
}

export async function listUsers(
  params: CursorParams = {},
): Promise<CursorPage<User>> {
  const { data } = await apiClient.get<CursorPage<User>>("/users", { params });
  return data;
}

export async function getUser(userId: string): Promise<User> {
  const { data } = await apiClient.get<User>(`/users/${userId}`);
  return data;
}

export async function createUser(input: UserCreate): Promise<User> {
  const { data } = await apiClient.post<User>("/users", input);
  return data;
}

export async function updateUser(
  userId: string,
  input: UserUpdate,
): Promise<User> {
  const { data } = await apiClient.patch<User>(`/users/${userId}`, input);
  return data;
}

export async function deleteUser(userId: string, version: number): Promise<void> {
  await apiClient.delete(`/users/${userId}`, { data: { version } });
}

export async function listRoles(
  params: CursorParams = {},
): Promise<CursorPage<Role>> {
  const { data } = await apiClient.get<CursorPage<Role>>("/roles", { params });
  return data;
}

export async function getRole(roleId: string): Promise<Role> {
  const { data } = await apiClient.get<Role>(`/roles/${roleId}`);
  return data;
}

export async function createRole(input: RoleCreate): Promise<Role> {
  const { data } = await apiClient.post<Role>("/roles", input);
  return data;
}

export async function updateRole(roleId: string, input: RoleUpdate): Promise<Role> {
  const { data } = await apiClient.patch<Role>(`/roles/${roleId}`, input);
  return data;
}

export async function deleteRole(roleId: string, version: number): Promise<void> {
  await apiClient.delete(`/roles/${roleId}`, { data: { version } });
}

export interface MembershipListParams extends CursorParams {
  organization_id?: string;
  school_id?: string;
  user_id?: string;
}

export async function listMemberships(
  params: MembershipListParams = {},
): Promise<CursorPage<Membership>> {
  const { data } = await apiClient.get<CursorPage<Membership>>("/memberships", {
    params,
  });
  return data;
}

export async function getMembership(membershipId: string): Promise<Membership> {
  const { data } = await apiClient.get<Membership>(`/memberships/${membershipId}`);
  return data;
}

export async function createMembership(input: MembershipCreate): Promise<Membership> {
  const { data } = await apiClient.post<Membership>("/memberships", input);
  return data;
}

export async function updateMembership(
  membershipId: string,
  input: MembershipUpdate,
): Promise<Membership> {
  const { data } = await apiClient.patch<Membership>(
    `/memberships/${membershipId}`,
    input,
  );
  return data;
}

/** Ends the membership (status -> ENDED, end_date -> today). */
export async function deleteMembership(
  membershipId: string,
  version: number,
): Promise<void> {
  await apiClient.delete(`/memberships/${membershipId}`, { data: { version } });
}

export async function grantRoleToMembership(
  membershipId: string,
  input: RoleGrantCreate,
): Promise<Membership> {
  const { data } = await apiClient.post<Membership>(
    `/memberships/${membershipId}/roles`,
    input,
  );
  return data;
}

export async function revokeRoleFromMembership(
  membershipId: string,
  roleId: string,
): Promise<void> {
  await apiClient.delete(`/memberships/${membershipId}/roles/${roleId}`);
}

export async function listOrganizations(
  params: CursorParams = {},
): Promise<CursorPage<Organization>> {
  const { data } = await apiClient.get<CursorPage<Organization>>("/organizations", {
    params,
  });
  return data;
}

export async function getOrganization(id: string): Promise<Organization> {
  const { data } = await apiClient.get<Organization>(`/organizations/${id}`);
  return data;
}

export async function createOrganization(input: OrganizationCreate): Promise<Organization> {
  const { data } = await apiClient.post<Organization>("/organizations", input);
  return data;
}

export async function updateOrganization(
  id: string,
  input: OrganizationUpdate,
): Promise<Organization> {
  const { data } = await apiClient.patch<Organization>(`/organizations/${id}`, input);
  return data;
}
