import { UserMembershipsTab } from "@/features/platform-users/user-memberships-tab";

export default async function UserMembershipsPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserMembershipsTab userId={userId} />;
}
