import { SchoolDetailLayout } from "@/features/platform-schools/school-detail-layout";

export default async function SchoolDetailRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ schoolId: string }>;
}) {
  const { schoolId } = await params;
  return <SchoolDetailLayout schoolId={schoolId}>{children}</SchoolDetailLayout>;
}
