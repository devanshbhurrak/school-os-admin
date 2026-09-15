"use client";

import { AuditLogTable } from "@/components/ui/audit-log-table";
import { platformKeys } from "@/lib/query-keys";

export function UserAuditTab({ userId }: { userId: string }) {
  return <AuditLogTable queryKey={platformKeys.userAudit(userId)} params={{ actor_user_id: userId }} />;
}
