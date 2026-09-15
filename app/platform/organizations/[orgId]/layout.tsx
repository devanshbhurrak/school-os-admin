import { OrgDetailLayout } from "@/features/platform-organizations/org-detail-layout";

export default async function OrgDetailRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  return <OrgDetailLayout orgId={orgId}>{children}</OrgDetailLayout>;
}
