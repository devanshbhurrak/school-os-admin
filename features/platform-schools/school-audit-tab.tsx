"use client";

import { AuditLogTable } from "@/components/ui/audit-log-table";
import { platformKeys } from "@/lib/query-keys";

interface SchoolAuditTabProps {
  schoolId: string;
}

export function SchoolAuditTab({ schoolId }: SchoolAuditTabProps) {
  return (
    <AuditLogTable
      queryKey={platformKeys.schoolAudit(schoolId)}
      params={{ school_id: schoolId }}
    />
  );
}
