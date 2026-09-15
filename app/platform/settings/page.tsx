import { redirect } from "next/navigation";

export default function SettingsRoot() {
  redirect("/platform/settings/profile");
}
