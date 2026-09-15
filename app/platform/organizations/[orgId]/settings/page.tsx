import { OrgSettingsTab } from "@/features/platform-organizations/org-settings-tab";

export default async function OrgSettingsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgSettingsTab orgId={orgId} />;
}
