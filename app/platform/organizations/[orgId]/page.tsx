import { redirect } from "next/navigation";

export default async function OrgRoot({
  params,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { orgId } = await params;
  redirect(`/platform/organizations/${orgId}/overview`);
}
