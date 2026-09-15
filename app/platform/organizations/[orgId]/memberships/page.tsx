import { OrgMembershipsTab } from "@/features/platform-organizations/org-memberships-tab";

export default async function OrgMembershipsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgMembershipsTab orgId={orgId} />;
}
