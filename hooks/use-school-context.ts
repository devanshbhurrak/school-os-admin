"use client";

import { useSchoolContext } from "@/providers/school-context-provider";

/**
 * Primary hook for accessing the active school context.
 * Aliased as both `useSchoolContext` (matches provider) and
 * `useSchoolContextValue` (legacy name used across feature files).
 */
export { useSchoolContext };

/** @deprecated Use `useSchoolContext` instead. */
export const useSchoolContextValue = useSchoolContext;
