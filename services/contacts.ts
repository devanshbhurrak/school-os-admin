import { apiClient } from "./api-client";
import type {
  Contact,
  ContactCreate,
  ContactUpdate,
  CursorPage,
  CursorParams,
  EntityType,
} from "@/types";

export async function listContacts(
  entityType: EntityType,
  entityId: string,
  params: CursorParams = {},
): Promise<CursorPage<Contact>> {
  const { data } = await apiClient.get<CursorPage<Contact>>("/contacts", {
    params: { entity_type: entityType, entity_id: entityId, ...params },
  });
  return data;
}

export async function createContact(input: ContactCreate): Promise<Contact> {
  const { data } = await apiClient.post<Contact>("/contacts", input);
  return data;
}

/** Contacts are not versioned. */
export async function updateContact(
  contactId: string,
  input: ContactUpdate,
): Promise<Contact> {
  const { data } = await apiClient.patch<Contact>(`/contacts/${contactId}`, input);
  return data;
}

/** Contacts are not versioned. */
export async function deleteContact(contactId: string): Promise<void> {
  await apiClient.delete(`/contacts/${contactId}`);
}
