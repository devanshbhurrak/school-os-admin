import { SchoolOverviewTab } from "@/features/platform-schools/school-overview-tab";

export default async function SchoolOverviewPage({
  params,
}: {
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  return <SchoolOverviewTab schoolId={schoolId} />;
}
