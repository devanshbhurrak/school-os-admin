import { OrgSchoolsTab } from "@/features/platform-organizations/org-schools-tab";

export default async function OrgSchoolsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgSchoolsTab orgId={orgId} />;
}
