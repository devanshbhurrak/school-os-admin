import { SchoolAcademicsTab } from "@/features/platform-schools/school-academics-tab";

export default async function AcademicsPage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  return <SchoolAcademicsTab schoolId={schoolId} />;
}
