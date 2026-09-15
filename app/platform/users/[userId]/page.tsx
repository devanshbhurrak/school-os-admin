import { redirect } from "next/navigation";

export default async function UserRoot({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  redirect(`/platform/users/${userId}/profile`);
}
