"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { SchoolContextProvider } from "./school-context-provider";
import { SonnerProvider } from "@/components/ui/sonner-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <SchoolContextProvider>
          <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
          <SonnerProvider />
        </SchoolContextProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
