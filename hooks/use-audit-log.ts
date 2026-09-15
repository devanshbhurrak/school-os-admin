"use client";

import { useCursorPagination } from "@/hooks/use-cursor-pagination";
import { platformApiClient } from "@/services/platform-api-client";
import { platformKeys } from "@/lib/query-keys";
import type { CursorPage } from "@/types";
import type { AuditLog, AuditLogListParams } from "@/services/audit";

async function listAuditLogsPlatform(params: AuditLogListParams): Promise<CursorPage<AuditLog>> {
  const { data } = await platformApiClient.get<CursorPage<AuditLog>>("/audit-logs", { params });
  return data;
}

/**
 * Cursor-paginated audit log with filter params, using platformApiClient (no X-School-ID).
 * Spec: queryKeys ["platform", "audit", params]
 */
export function useAuditLog(params: AuditLogListParams = {}) {
  const pagination = useCursorPagination<AuditLog>({
    queryKey: platformKeys.audit(params),
    queryFn: (cursorParams) => listAuditLogsPlatform({ ...params, ...cursorParams }),
    limit: 25,
  });
  return pagination;
}
