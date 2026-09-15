import { OrgUsersTab } from "@/features/platform-organizations/org-users-tab";

export default async function OrgUsersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgUsersTab orgId={orgId} />;
}
