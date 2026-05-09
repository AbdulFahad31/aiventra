"use client";

import * as React from "react";
import { AlertTriangle, ShieldAlert, Target } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaseSelector } from "@/components/case-selector";
import { PageSection } from "@/components/page-section";
import { RiskBadge, getRiskVariant } from "@/components/risk-badge";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { getApiError, getReport } from "@/lib/api";
import { mockReport } from "@/lib/mock-data";
import type { CaseReport } from "@/lib/types";
import { getCurrentCaseId, setCurrentCaseId } from "@/lib/utils";

export default function RiskPage() {
  const [caseId, setCaseId] = React.useState("");
  const [report, setReport] = React.useState<CaseReport>(mockReport);
  const [message, setMessage] = React.useState("");
  const structured = report.structured_report;

  React.useEffect(() => {
    const stored = getCurrentCaseId();
    if (stored) setCaseId(stored);
  }, []);

  React.useEffect(() => {
    if (!caseId) return;
    setCurrentCaseId(caseId);
    getReport(caseId)
      .then((data) => {
        setReport(data);
        setMessage("");
      })
      .catch((error) => {
        setReport(mockReport);
        setMessage(`${getApiError(error)}. Showing mock risk data.`);
      });
  }, [caseId]);

  const risk = structured?.risk_assessment;
  const correlation = structured?.correlation_analysis;
  const flags = risk?.flags?.length ? risk.flags : report.flags?.length ? report.flags : [];
  const anomalies = correlation?.anomalies?.length ? correlation.anomalies : report.anomalies?.length ? report.anomalies : ["No anomalies returned"];
  const limitations = structured?.limitations || [];
  const anomalyItems = Array.from(new Set([...anomalies, ...limitations].filter(Boolean)));
  const riskLevel = risk?.risk_level || report.risk_level;
  const riskScore = risk?.risk_score ?? report.risk_score ?? 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageSection title="Risk Detection" description="Risk overview, flags, and anomalies from the analysis pipeline.">
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

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Risk Level" value={String(riskLevel || "LOW")} icon={ShieldAlert} tone={getRiskVariant(riskLevel) === "red" ? "red" : "yellow"} />
          <StatCard title="Risk Score" value={Math.round(riskScore)} icon={Target} />
          <StatCard title="Investigation Flags" value={flags.length} icon={AlertTriangle} tone="red" />
        </div>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Risk Overview</CardTitle>
            <RiskBadge level={riskLevel} />
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={riskScore} />
            <p className="text-sm text-muted-foreground">Score: {Math.round(riskScore)} / 100</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Investigation Flags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {flags.map((flag) => (
                <div key={flag.name} className="rounded-md border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{flag.name}</p>
                    <Badge variant="red">{Math.round(flag.score)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{flag.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Anomalies & Limitations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {anomalyItems.map((item) => (
                <div key={item} className="rounded-md border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
