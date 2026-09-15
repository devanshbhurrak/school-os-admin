import { LoginPage } from "@/features/auth/login-page";

export default async function LoginRoute({
  searchParams,
}: { params: Promise<Record<string,string>>; searchParams: Promise<Record<string,string | string[] | undefined>> }) {
  const params = await searchParams;
  return <LoginPage notice={params.changed === "1" ? "changed" : null} />;
}
