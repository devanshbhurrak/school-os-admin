import { GraduationCap } from "lucide-react";

/** Minimal centered layout for public screens (login). */
export default function PublicLayout({ children }: { children: React.ReactNode; params: Promise<Record<string,string>> }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-12">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-6" aria-hidden />
          </div>
          <span className="text-lg font-semibold tracking-tight">School OS</span>
        </div>
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
