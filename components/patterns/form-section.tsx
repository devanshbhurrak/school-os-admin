import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Render without the surrounding card styling. */
  bare?: boolean;
}

/** Titled section wrapper for form groups (e.g. "Personal Information"). */
export function FormSection({
  title,
  description,
  children,
  className,
  bare = false,
}: FormSectionProps) {
  return (
    <section className={cn(bare ? "" : "space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description ? (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className={cn("grid gap-4", bare ? "" : "grid-cols-1 gap-x-4 sm:grid-cols-2")}>
        {children}
      </div>
    </section>
  );
}
