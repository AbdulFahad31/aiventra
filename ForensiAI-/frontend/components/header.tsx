"use client";

import { usePathname } from "next/navigation";
import { Bell, Server } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/cases": "Cases",
  "/upload": "Upload Evidence",
  "/analysis": "Analysis Results",
  "/timeline": "Timeline View",
  "/risk": "Risk Detection",
  "/reports": "Final Report"
};

export function Header() {
  const pathname = usePathname();

  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 md:px-6">
      <div>
        <h1 className="text-lg font-semibold">{titles[pathname] || "ForensiAI"}</h1>
        <p className="text-xs text-muted-foreground">Backend testing dashboard</p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="hidden gap-2 sm:inline-flex">
          <Server className="h-3 w-3" />
          {API_BASE_URL}
        </Badge>
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
