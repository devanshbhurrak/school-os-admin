import { apiClient } from "./api-client";
import type {
  Address,
  AddressCreate,
  AddressUpdate,
  CursorPage,
  CursorParams,
  EntityType,
} from "@/types";

export async function listAddresses(
  entityType: EntityType,
  entityId: string,
  params: CursorParams = {},
): Promise<CursorPage<Address>> {
  const { data } = await apiClient.get<CursorPage<Address>>("/addresses", {
    params: { entity_type: entityType, entity_id: entityId, ...params },
  });
  return data;
}

export async function createAddress(input: AddressCreate): Promise<Address> {
  const { data } = await apiClient.post<Address>("/addresses", input);
  return data;
}

export async function updateAddress(
  addressId: string,
  input: AddressUpdate,
): Promise<Address> {
  const { data } = await apiClient.patch<Address>(`/addresses/${addressId}`, input);
  return data;
}

export async function deleteAddress(
  addressId: string,
  version: number,
): Promise<void> {
  await apiClient.delete(`/addresses/${addressId}`, { data: { version } });
}
