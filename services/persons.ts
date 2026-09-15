import { apiClient } from "./api-client";
import type {
  CursorPage,
  CursorParams,
  Person,
  PersonCreate,
  PersonMerge,
  PersonUpdate,
} from "@/types";

export interface PersonListParams extends CursorParams {
  search?: string;
}

export async function listPersons(
  params: PersonListParams = {},
): Promise<CursorPage<Person>> {
  const { data } = await apiClient.get<CursorPage<Person>>("/persons", {
    params,
  });
  return data;
}

export async function getPerson(personId: string): Promise<Person> {
  const { data } = await apiClient.get<Person>(`/persons/${personId}`);
  return data;
}

export async function createPerson(input: PersonCreate): Promise<Person> {
  const { data } = await apiClient.post<Person>("/persons", input);
  return data;
}

export async function updatePerson(
  personId: string,
  input: PersonUpdate,
): Promise<Person> {
  const { data } = await apiClient.patch<Person>(`/persons/${personId}`, input);
  return data;
}

export async function deletePerson(personId: string, version: number): Promise<void> {
  await apiClient.delete(`/persons/${personId}`, { data: { version } });
}

export async function mergePerson(
  personId: string,
  input: PersonMerge,
): Promise<Person> {
  const { data } = await apiClient.post<Person>(`/persons/${personId}/merge`, input);
  return data;
}
