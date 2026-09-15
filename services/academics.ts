import { apiClient } from "./api-client";
import type {
  AcademicClass,
  AcademicClassCreate,
  AcademicClassUpdate,
  AcademicTerm,
  AcademicTermCreate,
  AcademicTermUpdate,
  AcademicYear,
  AcademicYearCreate,
  AcademicYearUpdate,
  ClassSubject,
  ClassSubjectCreate,
  Cohort,
  CohortCreate,
  CohortUpdate,
  CursorPage,
  CursorParams,
  Subject,
  SubjectCreate,
  SubjectUpdate,
} from "@/types";

export async function listAcademicYears(
  params: CursorParams = {},
): Promise<CursorPage<AcademicYear>> {
  const { data } = await apiClient.get<CursorPage<AcademicYear>>("/academic-years", {
    params,
  });
  return data;
}

export async function getAcademicYear(yearId: string): Promise<AcademicYear> {
  const { data } = await apiClient.get<AcademicYear>(`/academic-years/${yearId}`);
  return data;
}

export async function createAcademicYear(
  input: AcademicYearCreate,
): Promise<AcademicYear> {
  const { data } = await apiClient.post<AcademicYear>("/academic-years", input);
  return data;
}

export async function updateAcademicYear(
  yearId: string,
  input: AcademicYearUpdate,
): Promise<AcademicYear> {
  const { data } = await apiClient.patch<AcademicYear>(
    `/academic-years/${yearId}`,
    input,
  );
  return data;
}

export async function deleteAcademicYear(
  yearId: string,
  version: number,
): Promise<void> {
  await apiClient.delete(`/academic-years/${yearId}`, { data: { version } });
}

export interface TermListParams extends CursorParams {
  academic_year_id?: string;
}

export async function listAcademicTerms(
  params: TermListParams = {},
): Promise<CursorPage<AcademicTerm>> {
  const { data } = await apiClient.get<CursorPage<AcademicTerm>>("/academic-terms", {
    params,
  });
  return data;
}

export async function getAcademicTerm(termId: string): Promise<AcademicTerm> {
  const { data } = await apiClient.get<AcademicTerm>(`/academic-terms/${termId}`);
  return data;
}

export async function createAcademicTerm(
  input: AcademicTermCreate,
): Promise<AcademicTerm> {
  const { data } = await apiClient.post<AcademicTerm>("/academic-terms", input);
  return data;
}

export async function updateAcademicTerm(
  termId: string,
  input: AcademicTermUpdate,
): Promise<AcademicTerm> {
  const { data } = await apiClient.patch<AcademicTerm>(
    `/academic-terms/${termId}`,
    input,
  );
  return data;
}

export async function deleteAcademicTerm(
  termId: string,
  version: number,
): Promise<void> {
  await apiClient.delete(`/academic-terms/${termId}`, { data: { version } });
}

export async function listAcademicClasses(
  params: CursorParams = {},
): Promise<CursorPage<AcademicClass>> {
  const { data } = await apiClient.get<CursorPage<AcademicClass>>(
    "/academic-classes",
    { params },
  );
  return data;
}

export async function getAcademicClass(classId: string): Promise<AcademicClass> {
  const { data } = await apiClient.get<AcademicClass>(`/academic-classes/${classId}`);
  return data;
}

export async function createAcademicClass(
  input: AcademicClassCreate,
): Promise<AcademicClass> {
  const { data } = await apiClient.post<AcademicClass>("/academic-classes", input);
  return data;
}

export async function updateAcademicClass(
  classId: string,
  input: AcademicClassUpdate,
): Promise<AcademicClass> {
  const { data } = await apiClient.patch<AcademicClass>(
    `/academic-classes/${classId}`,
    input,
  );
  return data;
}

export async function deleteAcademicClass(
  classId: string,
  version: number,
): Promise<void> {
  await apiClient.delete(`/academic-classes/${classId}`, { data: { version } });
}

export async function listSubjects(
  params: CursorParams = {},
): Promise<CursorPage<Subject>> {
  const { data } = await apiClient.get<CursorPage<Subject>>("/subjects", { params });
  return data;
}

export async function getSubject(subjectId: string): Promise<Subject> {
  const { data } = await apiClient.get<Subject>(`/subjects/${subjectId}`);
  return data;
}

export async function createSubject(input: SubjectCreate): Promise<Subject> {
  const { data } = await apiClient.post<Subject>("/subjects", input);
  return data;
}

export async function updateSubject(
  subjectId: string,
  input: SubjectUpdate,
): Promise<Subject> {
  const { data } = await apiClient.patch<Subject>(`/subjects/${subjectId}`, input);
  return data;
}

export async function deleteSubject(
  subjectId: string,
  version: number,
): Promise<void> {
  await apiClient.delete(`/subjects/${subjectId}`, { data: { version } });
}

export interface ClassSubjectListParams extends CursorParams {
  academic_class_id?: string;
  year_id?: string;
}

export async function listClassSubjects(
  params: ClassSubjectListParams = {},
): Promise<CursorPage<ClassSubject>> {
  const { data } = await apiClient.get<CursorPage<ClassSubject>>("/class-subjects", {
    params,
  });
  return data;
}

export async function getClassSubject(
  classSubjectId: string,
): Promise<ClassSubject> {
  const { data } = await apiClient.get<ClassSubject>(
    `/class-subjects/${classSubjectId}`,
  );
  return data;
}

/** Class subjects have no PATCH — create and delete only. */
export async function createClassSubject(
  input: ClassSubjectCreate,
): Promise<ClassSubject> {
  const { data } = await apiClient.post<ClassSubject>("/class-subjects", input);
  return data;
}

/** Class subjects are not versioned. */
export async function deleteClassSubject(classSubjectId: string): Promise<void> {
  await apiClient.delete(`/class-subjects/${classSubjectId}`);
}

export interface CohortListParams extends CursorParams {
  academic_year_id?: string;
  academic_class_id?: string;
}

export async function listCohorts(
  params: CohortListParams = {},
): Promise<CursorPage<Cohort>> {
  const { data } = await apiClient.get<CursorPage<Cohort>>("/cohorts", { params });
  return data;
}

export async function getCohort(cohortId: string): Promise<Cohort> {
  const { data } = await apiClient.get<Cohort>(`/cohorts/${cohortId}`);
  return data;
}

export async function createCohort(input: CohortCreate): Promise<Cohort> {
  const { data } = await apiClient.post<Cohort>("/cohorts", input);
  return data;
}

export async function updateCohort(
  cohortId: string,
  input: CohortUpdate,
): Promise<Cohort> {
  const { data } = await apiClient.patch<Cohort>(`/cohorts/${cohortId}`, input);
  return data;
}

export async function deleteCohort(cohortId: string, version: number): Promise<void> {
  await apiClient.delete(`/cohorts/${cohortId}`, { data: { version } });
}
