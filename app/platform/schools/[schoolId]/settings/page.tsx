import { SchoolSettingsTab } from "@/features/platform-schools/school-settings-tab";

export default async function SchoolSettingsPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  return <SchoolSettingsTab schoolId={schoolId} />;
}
