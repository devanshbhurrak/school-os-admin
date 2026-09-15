import { SchoolAuditTab } from "@/features/platform-schools/school-audit-tab";

export default async function SchoolAuditPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  return <SchoolAuditTab schoolId={schoolId} />;
}
