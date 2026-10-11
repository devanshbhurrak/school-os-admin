import { platformApiClient } from "./platform-api-client";
import type { CursorPage, CursorParams } from "@/types";

export type OutboxStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

export interface OutboxEvent {
  id: string;
  event_name: string;
  event_version: number;
  organization_id: string | null;
  school_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  status: OutboxStatus;
  attempts: number;
  next_attempt_at: string | null;
  processed_at: string | null;
  last_error: string | null;
  locked_by: string | null;
  locked_at: string | null;
  created_at: string;
}

export interface OutboxStatusSummary {
  pending: number;
  processing: number;
  sent: number;
  failed: number;
  dead_lettered: number;
}

export interface FeatureFlag {
  id: string;
  key: string;
  organization_id: string | null;
  school_id: string | null;
  enabled: boolean;
  description: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export async function getOutboxSummary(): Promise<OutboxStatusSummary> {
  const { data } = await platformApiClient.get<OutboxStatusSummary>("/platform/outbox/summary");
  return data;
}

export async function listOutboxEvents(
  params: CursorParams & { status?: string; event_name?: string } = {},
): Promise<CursorPage<OutboxEvent>> {
  const { data } = await platformApiClient.get<CursorPage<OutboxEvent>>("/platform/outbox", {
    params,
  });
  return data;
}

export async function listFeatureFlags(
  params: CursorParams = {},
): Promise<CursorPage<FeatureFlag>> {
  const { data } = await platformApiClient.get<CursorPage<FeatureFlag>>("/platform/feature-flags", {
    params,
  });
  return data;
}
