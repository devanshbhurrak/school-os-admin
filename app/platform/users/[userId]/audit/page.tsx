import { UserAuditTab } from "@/features/platform-users/user-audit-tab";

export default async function UserAuditPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserAuditTab userId={userId} />;
}
