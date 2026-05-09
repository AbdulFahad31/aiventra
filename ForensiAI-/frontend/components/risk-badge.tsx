import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/lib/types";

export function getRiskVariant(level?: RiskLevel) {
  const normalized = String(level || "LOW").toUpperCase();
  if (normalized === "HIGH") return "red";
  if (normalized === "MEDIUM") return "yellow";
  return "green";
}

export function RiskBadge({ level }: { level?: RiskLevel }) {
  const label = String(level || "LOW").toUpperCase();
  return <Badge variant={getRiskVariant(label)}>{label}</Badge>;
}
