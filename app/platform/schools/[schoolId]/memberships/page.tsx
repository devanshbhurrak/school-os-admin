import { SchoolMembershipsTab } from "@/features/platform-schools/school-memberships-tab";

export default async function SchoolMembershipsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  return <SchoolMembershipsTab schoolId={schoolId} />;
}
