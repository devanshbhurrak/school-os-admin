import { SchoolDataQualityTab } from "@/features/platform-schools/school-data-quality-tab";

export default async function DataQualityPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  return <SchoolDataQualityTab schoolId={schoolId} />;
}
