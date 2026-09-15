import { UserProfileTab } from "@/features/platform-users/user-profile-tab";

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <UserProfileTab userId={userId} />;
}
