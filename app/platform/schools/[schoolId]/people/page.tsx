import { SchoolPeopleTab } from "@/features/platform-schools/school-people-tab";

export default async function PeoplePage({ params }: { params: Promise<{ schoolId: string }> }) {
  const { schoolId } = await params;
  return <SchoolPeopleTab schoolId={schoolId} />;
}
