"use client";

import { AuditLogTable } from "@/components/ui/audit-log-table";
import { platformKeys } from "@/lib/query-keys";

interface OrgAuditTabProps {
  orgId: string;
}

export function OrgAuditTab({ orgId }: OrgAuditTabProps) {
  return (
    <AuditLogTable
      queryKey={platformKeys.orgAudit(orgId)}
      params={{ organization_id: orgId }}
    />
  );
}
