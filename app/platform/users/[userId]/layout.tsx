import { UserDetailLayout } from "@/features/platform-users/user-detail-layout";

export default async function UsersDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <UserDetailLayout userId={userId}>{children}</UserDetailLayout>;
}
