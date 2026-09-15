import { OrgOverviewTab } from "@/features/platform-organizations/org-overview-tab";

export default async function OrgOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgId } = await params;
  return <OrgOverviewTab orgId={orgId} />;
}
