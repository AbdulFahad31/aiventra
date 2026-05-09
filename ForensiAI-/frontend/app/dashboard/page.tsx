"use client";

import * as React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Database, FileUp, FolderOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiError, listCases, listEvidence } from "@/lib/api";
import { mockCases, mockEvidence } from "@/lib/mock-data";
import type { CaseRecord, EvidenceRecord } from "@/lib/types";
import { formatDate, setCurrentCaseId } from "@/lib/utils";

export default function DashboardPage() {
  const [cases, setCases] = React.useState<CaseRecord[]>([]);
  const [uploads, setUploads] = React.useState<EvidenceRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const caseData = await listCases();
        setCases(caseData.length ? caseData : mockCases);
        const activeCase = caseData[0]?.case_id || mockCases[0].case_id;
        setCurrentCaseId(activeCase);
        try {
          const evidence = await listEvidence(activeCase);
          setUploads(evidence.length ? evidence : mockEvidence);
        } catch {
          setUploads(mockEvidence);
        }
      } catch (error) {
        console.warn(getApiError(error));
        setOffline(true);
        setCases(mockCases);
        setUploads(mockEvidence);
        setCurrentCaseId(mockCases[0].case_id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const highRisk = cases.filter((item) => String(item.risk_level).toUpperCase() === "HIGH").length;
  const completed = cases.filter((item) => item.status === "completed").length;

  return (
    <AppShell>
      <div className="space-y-6">
        {offline ? <Badge variant="yellow">Backend unavailable. Showing mock data.</Badge> : null}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Cases" value={cases.length} description="All investigations" icon={FolderOpen} />
          <StatCard title="High Risk Cases" value={highRisk} description="Requires review" icon={AlertTriangle} tone="red" />
          <StatCard title="AI Analyses Completed" value={completed} description="Pipeline finished" icon={CheckCircle2} tone="green" />
          <StatCard title="Recent Uploads" value={uploads.length} description="Latest case evidence" icon={FileUp} tone="yellow" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <>
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </>
              ) : (
                cases.slice(0, 5).map((item) => (
                  <Link key={item.case_id} href={`/cases/${item.case_id}`} className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-accent">
                    <div>
                      <p className="font-medium">{item.case_id}</p>
                      <p className="text-sm text-muted-foreground">{item.victim_name}</p>
                    </div>
                    <div className="text-right">
                      <RiskBadge level={item.risk_level} />
                      <p className="mt-1 text-xs text-muted-foreground">{item.status}</p>
                    </div>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Uploads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {uploads.map((item) => (
                <div key={`${item.id}-${item.file_name}`} className="flex items-center gap-3 rounded-md border p-3">
                  <Database className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.uploaded_at)}</p>
                  </div>
                  <Badge variant="secondary">{item.file_type}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
