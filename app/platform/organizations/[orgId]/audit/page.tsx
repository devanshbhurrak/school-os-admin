import { OrgAuditTab } from "@/features/platform-organizations/org-audit-tab";

export default async function OrgAuditPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgAuditTab orgId={orgId} />;
}
