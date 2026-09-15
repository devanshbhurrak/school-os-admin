import { RoleDetailPlatform } from "@/features/platform-roles/role-detail-platform";

export default async function RoleDetailPage({ params }: { params: Promise<{ roleId: string }> }) {
  const { roleId } = await params;
  return <RoleDetailPlatform roleId={roleId} />;
}
