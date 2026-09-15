import { SchoolUsersTab } from "@/features/platform-schools/school-users-tab";

export default async function SchoolUsersPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  return <SchoolUsersTab schoolId={schoolId} />;
}
