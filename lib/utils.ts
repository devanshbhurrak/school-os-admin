import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function codeToSlug(code: string): string {
  return code.toLowerCase().replace(/_/g, "-");
}
