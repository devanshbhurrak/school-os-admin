import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";
import type { ISODate, ISODateTime, Person } from "@/types";

export function formatDate(value: ISODate | ISODateTime | null | undefined): string {
  if (!value) return "—";
  const date = parseISO(value);
  if (!isValid(date)) return value;
  return format(date, "d MMM yyyy");
}

export function formatDateTime(value: ISODateTime | null | undefined): string {
  if (!value) return "—";
  const date = parseISO(value);
  if (!isValid(date)) return value;
  return format(date, "d MMM yyyy, h:mm a");
}

export function formatRelativeTime(value: ISODateTime | null | undefined): string {
  if (!value) return "";
  const date = parseISO(value);
  if (!isValid(date)) return value;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function personFullName(person: Pick<Person, "first_name" | "middle_name" | "last_name">): string {
  return [person.first_name, person.middle_name, person.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function personDisplayName(
  person: Pick<Person, "first_name" | "middle_name" | "last_name" | "preferred_name">,
): string {
  return person.preferred_name?.trim() || personFullName(person);
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function formatAge(dateOfBirth: ISODate | null | undefined): string | null {
  if (!dateOfBirth) return null;
  const dob = parseISO(dateOfBirth);
  if (!isValid(dob)) return null;
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years -= 1;
  return years >= 0 ? `${years} yrs` : null;
}
