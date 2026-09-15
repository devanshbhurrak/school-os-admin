import { redirect } from "next/navigation";

export default async function SchoolRoot({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  redirect(`/platform/schools/${schoolId}/overview`);
}
