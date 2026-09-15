"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Non-disruptive status bar shown while the browser is offline.
 * Mutations are additionally blocked while offline (see useOffline).
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
    >
      <WifiOff className="size-3.5" aria-hidden />
      You are offline. Changes will not be saved.
    </div>
  );
}

export function useOffline(): boolean {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" && !navigator.onLine,
  );
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);
  return isOffline;
}
