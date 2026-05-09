import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value?: string | Date | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function getCurrentCaseId() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem("forensiai_case_id") || "";
}

export function setCurrentCaseId(caseId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("forensiai_case_id", caseId);
}
