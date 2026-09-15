import { PasswordChangeForm } from "@/features/auth/password-change-form";

export default async function PasswordResetConfirmRoute({
  searchParams,
}: { params: Promise<Record<string,string>>; searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const params = await searchParams;
  const rawToken = params.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : (rawToken ?? "");

  if (!token) {
    return (
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-semibold tracking-tight">
          Reset link is missing
        </h1>
        <p className="text-sm text-muted-foreground">
          This link is incomplete. Use the link from your reset email, or request
          a new one.
        </p>
      </div>
    );
  }

  return <PasswordChangeForm mode="confirm-reset" token={token} />;
}
