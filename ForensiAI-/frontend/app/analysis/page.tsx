"use client";

import * as React from "react";
import { Brain, Percent, Skull, Syringe } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaseSelector } from "@/components/case-selector";
import { PageSection } from "@/components/page-section";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiError, getReport, getResults } from "@/lib/api";
import { mockReport } from "@/lib/mock-data";
import type { CaseReport } from "@/lib/types";
import { getCurrentCaseId, setCurrentCaseId } from "@/lib/utils";

export default function AnalysisPage() {
  const [caseId, setCaseId] = React.useState("");
  const [report, setReport] = React.useState<CaseReport | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const structured = report?.structured_report;

  React.useEffect(() => {
    const stored = getCurrentCaseId();
    if (stored) setCaseId(stored);
  }, []);

  React.useEffect(() => {
    if (!caseId) return;
    setCurrentCaseId(caseId);
    async function load() {
      setLoading(true);
      setMessage("");
      try {
        const status = await getResults(caseId);
        if (status.status !== "complete") {
          setMessage(status.message || `Analysis status: ${status.status}`);
          setReport(mockReport);
          return;
        }
        setReport(await getReport(caseId));
      } catch (error) {
        setMessage(`${getApiError(error)}. Showing mock analysis data.`);
        setReport(mockReport);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  const autopsy = structured?.autopsy_findings;
  const correlation = structured?.correlation_analysis;
  const risk = structured?.risk_assessment;
  const injuries = autopsy?.injuries?.length ? autopsy.injuries : report?.injuries?.length ? report.injuries : ["No injuries reported"];
  const toxins = autopsy?.toxicology?.length ? autopsy.toxicology : report?.toxicology?.length ? report.toxicology : ["No toxicology findings reported"];
  const patterns = correlation?.suspicious_patterns?.length
    ? correlation.suspicious_patterns
    : report?.suspicious_patterns?.length
      ? report.suspicious_patterns
      : correlation?.anomalies || report?.anomalies || [];
  const confidence = Math.round((autopsy?.confidence ?? 0) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageSection title="Analysis Results" description="Backend status plus final report-derived AI outputs.">
          <Card>
            <CardContent className="p-5">
              <div className="space-y-2">
                <Label>Case</Label>
                <CaseSelector value={caseId} onChange={setCaseId} />
              </div>
              {message ? <Badge className="mt-4" variant="yellow">{message}</Badge> : null}
            </CardContent>
          </Card>
        </PageSection>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Cause of Death" value={autopsy?.cause_of_death || report?.cause_of_death || "Unknown"} icon={Skull} />
              <StatCard title="AI Confidence" value={`${confidence}%`} icon={Percent} tone="green" />
              <StatCard title="Injury Findings" value={injuries.length} icon={Brain} tone="yellow" />
              <StatCard title="Toxins" value={toxins.length} icon={Syringe} tone="red" />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <FindingCard title="Autopsy Summary" items={[
                `Manner of death: ${autopsy?.manner_of_death || "Not determined"}`,
                `Risk level: ${risk?.risk_level || report?.risk_level || "Unknown"}`,
                `Risk score: ${Math.round(risk?.risk_score || report?.risk_score || 0)}`
              ]} />
              <FindingCard title="Injuries" items={injuries} />
              <FindingCard title="Toxins" items={toxins} />
              <FindingCard title="Suspicious Patterns" items={patterns.length ? patterns : ["No suspicious patterns returned"]} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function FindingCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-md border p-3 text-sm text-muted-foreground">
            {item}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
