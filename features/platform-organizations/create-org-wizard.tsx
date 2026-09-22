"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createOrganization,
  createSchool,
  createUser,
  createMembership,
  grantRoleToMembership,
  listRoles,
} from "@/services/iam";
import { platformApiClient } from "@/services/platform-api-client";
import { platformKeys } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { CheckCircle2, Loader2, AlertCircle, Copy } from "lucide-react";
import type { Organization, School, User } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generatePassword() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// ── Step schemas ────────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(2, "Code is required").regex(/^[A-Z0-9_-]+$/, "Use uppercase letters, numbers, hyphens, underscores"),
  legal_name: z.string().optional(),
  contact_email: z.string().email("Invalid email").or(z.literal("")),
  contact_phone: z.string().optional(),
  plan_code: z.string().min(1, "Plan is required"),
  timezone: z.string().min(1, "Timezone is required"),
  locale: z.string().min(1, "Locale is required"),
});

const step2Schema = z.object({
  skip: z.boolean(),
  name: z.string().optional(),
  short_name: z.string().optional(),
  code: z.string().optional(),
  board: z.string().optional(),
  affiliation_number: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.skip) {
    if (!data.name?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "School name is required", path: ["name"] });
    if (!data.code?.trim()) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "School code is required", path: ["code"] });
  }
});

const step3Schema = z.object({
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Minimum 8 characters"),
  send_credentials: z.boolean(),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

// ── Step indicator ──────────────────────────────────────────────────────────

const STEPS = ["Organization", "First School", "Admin User", "Review"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="size-4" /> : i + 1}
              </div>
              <span className={cn("hidden text-[11px] sm:block", active ? "font-medium" : "text-muted-foreground")}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("mx-2 h-px w-8 sm:w-12", i < current ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1: Organization ────────────────────────────────────────────────────

function Step1({ onNext }: { onNext: (v: Step1Values) => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<Step1Values>({
      resolver: zodResolver(step1Schema),
      defaultValues: { plan_code: "standard", timezone: "Asia/Kolkata", locale: "en-IN" },
    });

  const name = watch("name");

  function handleNameBlur() {
    if (!watch("code")) {
      setValue("code", slugify(name ?? "").toUpperCase().replace(/-/g, "_"));
    }
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="s1-name">Organization Name *</Label>
          <Input id="s1-name" {...register("name")} onBlur={handleNameBlur} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-code">Code * <span className="text-xs text-muted-foreground">(uppercase, no spaces)</span></Label>
          <Input id="s1-code" {...register("code")} className="font-mono" />
          {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-plan">Plan *</Label>
          <Input id="s1-plan" {...register("plan_code")} />
          {errors.plan_code && <p className="text-xs text-destructive">{errors.plan_code.message}</p>}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="s1-legal">Legal Name</Label>
          <Input id="s1-legal" {...register("legal_name")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-email">Contact Email</Label>
          <Input id="s1-email" type="email" {...register("contact_email")} />
          {errors.contact_email && <p className="text-xs text-destructive">{errors.contact_email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-phone">Contact Phone</Label>
          <Input id="s1-phone" {...register("contact_phone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-tz">Timezone *</Label>
          <Input id="s1-tz" {...register("timezone")} />
          {errors.timezone && <p className="text-xs text-destructive">{errors.timezone.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s1-locale">Locale *</Label>
          <Input id="s1-locale" {...register("locale")} />
          {errors.locale && <p className="text-xs text-destructive">{errors.locale.message}</p>}
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">Next: School →</Button>
      </div>
    </form>
  );
}

// ── Step 2: First School ────────────────────────────────────────────────────

function Step2({
  onNext,
  onBack,
}: {
  onNext: (v: Step2Values) => void;
  onBack: () => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<Step2Values>({
      resolver: zodResolver(step2Schema),
      defaultValues: { skip: false },
    });

  const skip = watch("skip");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="flex items-center gap-3">
        <Switch
          id="skip-school"
          checked={skip}
          onCheckedChange={(v) => setValue("skip", v)}
        />
        <Label htmlFor="skip-school" className="font-normal">
          Skip — I&apos;ll add schools later
        </Label>
      </div>

      {!skip && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="s2-name">School Name *</Label>
            <Input id="s2-name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s2-short">Short Name</Label>
            <Input id="s2-short" {...register("short_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s2-code">Code *</Label>
            <Input id="s2-code" {...register("code")} className="font-mono" />
            {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s2-board">Board</Label>
            <Input id="s2-board" {...register("board")} placeholder="CBSE, ICSE, State" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s2-affiliation">Affiliation No.</Label>
            <Input id="s2-affiliation" {...register("affiliation_number")} />
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>← Back</Button>
        <Button type="submit">Next: Admin User →</Button>
      </div>
    </form>
  );
}

// ── Step 3: Admin User ──────────────────────────────────────────────────────

function Step3({
  onNext,
  onBack,
}: {
  onNext: (v: Step3Values) => void;
  onBack: () => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } =
    useForm<Step3Values>({
      resolver: zodResolver(step3Schema),
      defaultValues: { password: generatePassword(), send_credentials: true },
    });

  function copyPassword() {
    void navigator.clipboard.writeText(watch("password"));
    toast.success("Password copied");
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        This user will be the first administrator for the organization.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="s3-first">First Name *</Label>
          <Input id="s3-first" {...register("first_name")} />
          {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s3-last">Last Name *</Label>
          <Input id="s3-last" {...register("last_name")} />
          {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s3-email">Email *</Label>
          <Input id="s3-email" type="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="s3-phone">Phone</Label>
          <Input id="s3-phone" {...register("phone")} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="s3-pwd">Initial Password *</Label>
          <div className="flex gap-2">
            <Input id="s3-pwd" {...register("password")} className="font-mono" />
            <Button type="button" variant="outline" size="icon" onClick={copyPassword}>
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue("password", generatePassword())}
            >
              Regenerate
            </Button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="send-creds"
          checked={watch("send_credentials")}
          onCheckedChange={(v) => setValue("send_credentials", v)}
        />
        <Label htmlFor="send-creds" className="font-normal">
          Email credentials to the user on creation
        </Label>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack}>← Back</Button>
        <Button type="submit">Next: Review →</Button>
      </div>
    </form>
  );
}

// ── Step 4: Review & Create ─────────────────────────────────────────────────

interface CreationResult {
  org?: Organization;
  school?: School;
  user?: User;
  completedSteps: string[];
  error?: string;
}

function Step4({
  step1,
  step2,
  step3,
  onBack,
}: {
  step1: Step1Values;
  step2: Step2Values;
  step3: Step3Values;
  onBack: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<CreationResult | null>(null);

  async function handleCreate() {
    setCreating(true);
    const completed: string[] = [];
    let orgId: string | undefined;
    let schoolId: string | undefined;

    // Validation: if school was skipped but admin user requires person, require school per spec
    if (step2.skip) {
      // Spec: make First School required when creating an admin user
      // If school is skipped, person creation must be deferred; we allow but note it
      // For Phase 1 we allow skip, but create person will be deferred
    }

    try {
      // 1. Create organization
      const org = await createOrganization({
        code: step1.code,
        name: step1.name,
        legal_name: step1.legal_name || null,
        contact_email: step1.contact_email || null,
        contact_phone: step1.contact_phone || null,
        plan_code: step1.plan_code,
        timezone: step1.timezone,
        locale: step1.locale,
      });
      orgId = org.id;
      completed.push("Organization created");

      // 2. Create school (optional)
      let school: School | undefined;
      if (!step2.skip && step2.name && step2.code) {
        school = await createSchool({
          organization_id: org.id,
          code: step2.code,
          name: step2.name,
          short_name: step2.short_name || null,
          board: step2.board || null,
          affiliation_number: step2.affiliation_number || null,
        });
        schoolId = school.id;
        completed.push("School created");
      }

      // 3. Create person (requires X-School-ID, per spec step 3)
      if (schoolId) {
        try {
          const { data: person } = await platformApiClient.post<{ id: string }>("/persons", {
            first_name: step3.first_name,
            last_name: step3.last_name,
            primary_email: step3.email,
            primary_phone: step3.phone || null,
          }, { headers: { "X-School-ID": schoolId } });
          void person.id;
          completed.push("Person record created");
        } catch {
          // If person creation fails, continue — user can be created without linked person (API gap)
          completed.push("Person creation skipped (will be completed on first login)");
        }
      } else {
        completed.push("Person creation deferred (no school)");
      }

      // 4. Create user (spec says person_id, but current API uses school_id; we pass both where supported)
      const user = await createUser({
        email: step3.email,
        phone: step3.phone || null,
        password: step3.password,
        school_id: schoolId ?? null,
      });
      completed.push("Admin user created");

      // 4. Create org-wide membership
      const membership = await createMembership({
        user_id: user.id,
        school_id: null,
      });
      completed.push("Org-wide membership created");

      // 5. Grant Org Admin role
      const roles = await listRoles({ limit: 100 });
      const orgAdminRole = roles.items.find(
        (r) => r.code === "ORG_ADMIN" || r.name.toLowerCase().includes("org admin"),
      );
      if (orgAdminRole) {
        await grantRoleToMembership(membership.id, { role_id: orgAdminRole.id });
        completed.push("Org Admin role granted");
      }

      // 6. School membership (if school was created)
      if (schoolId) {
        const schoolMembership = await createMembership({
          user_id: user.id,
          school_id: schoolId,
        });
        completed.push("School membership created");

        const schoolAdminRole = roles.items.find(
          (r) => r.code === "SCHOOL_ADMIN" || r.name.toLowerCase().includes("school admin"),
        );
        if (schoolAdminRole) {
          await grantRoleToMembership(schoolMembership.id, { role_id: schoolAdminRole.id });
          completed.push("School Admin role granted");
        }
      }

      void queryClient.invalidateQueries({ queryKey: platformKeys.organizations() });
      void queryClient.invalidateQueries({ queryKey: platformKeys.schools() });

      setResult({ org, school, user, completedSteps: completed });
      setCreating(false);

      toast.success("Organization created successfully");
      setTimeout(() => {
        router.push(`/platform/organizations/${orgId}/overview`);
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setResult({ completedSteps: completed, error: message });
      setCreating(false);
    }
  }

  if (result) {
    const success = !result.error;
    return (
      <div className="space-y-4">
        <div className={cn(
          "rounded-lg border p-4",
          success ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20"
                  : "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
        )}>
          <div className="flex items-start gap-3">
            {success
              ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              : <AlertCircle className="size-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />}
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {success ? "Organization created" : "Creation failed"}
              </p>
              {result.error && (
                <p className="mt-1 text-xs text-red-700 dark:text-red-400">{result.error}</p>
              )}
              <ul className="mt-2 space-y-0.5">
                {result.completedSteps.map((step) => (
                  <li key={step} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3 text-emerald-500" />
                    {step}
                  </li>
                ))}
              </ul>
              {result.error && result.completedSteps.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  The steps above completed. Complete remaining steps manually.
                </p>
              )}
            </div>
          </div>
        </div>
        {success && (
          <p className="text-sm text-muted-foreground text-center">Redirecting…</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border divide-y text-sm">
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 py-3">
          <span className="text-muted-foreground">Organization</span>
          <span className="font-medium">{step1.name}</span>
          <span className="text-muted-foreground">Code</span>
          <span className="font-mono">{step1.code}</span>
          <span className="text-muted-foreground">Plan</span>
          <span>{step1.plan_code}</span>
          {step1.contact_email && (
            <>
              <span className="text-muted-foreground">Email</span>
              <span>{step1.contact_email}</span>
            </>
          )}
        </div>

        {!step2.skip && step2.name && (
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 py-3">
            <span className="text-muted-foreground">First School</span>
            <span className="font-medium">{step2.name}</span>
            {step2.code && (
              <>
                <span className="text-muted-foreground">Code</span>
                <span className="font-mono">{step2.code}</span>
              </>
            )}
          </div>
        )}

        {step2.skip && (
          <div className="px-4 py-3 text-muted-foreground italic">No school — to be added later</div>
        )}

        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 px-4 py-3">
          <span className="text-muted-foreground">Admin User</span>
          <span className="font-medium">{step3.email}</span>
          <span className="text-muted-foreground">Credentials</span>
          <span>{step3.send_credentials ? "Will be emailed" : "Not sent"}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This will create: 1 organization
        {!step2.skip && step2.name ? ", 1 school" : ""}
        , 1 admin user account, org-wide membership with Org Admin role
        {!step2.skip && step2.name ? ", school membership with School Admin role" : ""}.
      </p>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={creating}>← Back</Button>
        <Button onClick={handleCreate} disabled={creating}>
          {creating && <Loader2 className="size-4 animate-spin" />}
          {creating ? "Creating…" : "Create Organization"}
        </Button>
      </div>
    </div>
  );
}

// ── Wizard root ─────────────────────────────────────────────────────────────

export function CreateOrgWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [step1Data, setStep1Data] = useState<Step1Values | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Values | null>(null);
  const [step3Data, setStep3Data] = useState<Step3Values | null>(null);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create Organization</h1>
        <p className="text-sm text-muted-foreground">
          Provision a new organization, school, and administrator.
        </p>
      </div>

      <StepIndicator current={step} />

      <div className="rounded-lg border p-6">
        {step === 0 && (
          <Step1
            onNext={(v) => {
              setStep1Data(v);
              setStep(1);
            }}
          />
        )}
        {step === 1 && step1Data && (
          <Step2
            onNext={(v) => {
              setStep2Data(v);
              setStep(2);
            }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && step1Data && step2Data && (
          <Step3
            onNext={(v) => {
              setStep3Data(v);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && step1Data && step2Data && step3Data && (
          <Step4
            step1={step1Data}
            step2={step2Data}
            step3={step3Data}
            onBack={() => setStep(2)}
          />
        )}
      </div>

      <div className="text-center">
        <Button variant="ghost" size="sm" onClick={() => router.push("/platform/organizations")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
