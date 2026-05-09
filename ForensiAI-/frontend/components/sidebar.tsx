"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  FolderPlus,
  Home,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Cases", href: "/cases", icon: FolderPlus },
  { label: "Settings", href: "/dashboard", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card/40 md:block">
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="rounded-md bg-primary/15 p-2 text-primary">
          <Activity className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">ForensiAI</p>
          <p className="text-xs text-muted-foreground">Investigation MVP</p>
        </div>
      </div>
      <nav className="space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href || (item.href === "/cases" && pathname.startsWith("/cases/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                active && "bg-accent text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
