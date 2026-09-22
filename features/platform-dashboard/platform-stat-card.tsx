"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: number | string | null;
  isLoading?: boolean;
}

export function PlatformStatCard({ label, value, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-3xl font-bold tracking-tight">
          {isLoading ? (
            <Skeleton className="h-9 w-16" />
          ) : value === null || value === undefined ? (
            "—"
          ) : typeof value === "number" ? (
            value.toLocaleString()
          ) : (
            value
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
