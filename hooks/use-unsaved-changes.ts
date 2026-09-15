"use client";

import { useEffect, useRef } from "react";

/**
 * Warns before leaving a page with unsaved form changes:
 * - `beforeunload` for tab close / reload
 * - capture-phase anchor interception for in-app Link navigation
 *
 * Returns `confirmLeave()` for use in explicit "close" handlers (dialogs).
 */
export function useUnsavedChanges(dirty: boolean) {
  const dirtyRef = useRef(dirty);

  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;

    const onClickCapture = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      const target = (event.target as HTMLElement | null)?.closest?.("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http")) return;
      if (target.target && target.target !== "_self") return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [dirty]);

  return {
    /** Returns true when it is safe to leave (no dirty state or user confirmed). */
    confirmLeave: () =>
      !dirtyRef.current ||
      window.confirm("You have unsaved changes. Leave without saving?"),
  };
}
