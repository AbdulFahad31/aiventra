import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "yellow" | "red";
};

export function StatCard({ title, value, description, icon: Icon, tone = "blue" }: StatCardProps) {
  const tones = {
    blue: "bg-blue-500/12 text-blue-300",
    green: "bg-emerald-500/12 text-emerald-300",
    yellow: "bg-amber-500/12 text-amber-300",
    red: "bg-red-500/12 text-red-300"
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
            {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <div className={cn("rounded-md p-2", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
