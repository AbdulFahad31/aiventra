"use client";

import * as React from "react";
import { Download, ExternalLink, Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaseSelector } from "@/components/case-selector";
import { PageSection } from "@/components/page-section";
import { RiskBadge } from "@/components/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getApiError, getReport, getReportDocumentUrl, getReportMarkdownUrl } from "@/lib/api";
import { mockReport } from "@/lib/mock-data";
import type { CaseReport } from "@/lib/types";
import { formatDate, getCurrentCaseId, setCurrentCaseId } from "@/lib/utils";

export default function ReportsPage() {
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
        setMessage(`${getApiError(error)}. Showing mock report.`);
      });
  }, [caseId]);

  function openDocumentedReport() {
    window.open(getReportDocumentUrl(report.case_id), "_blank", "noopener,noreferrer");
  }

  function printDocumentedReport() {
    window.open(getReportDocumentUrl(report.case_id), "_blank", "noopener,noreferrer");
  }

  function downloadMarkdownReport() {
    window.location.href = getReportMarkdownUrl(report.case_id);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageSection title="Final Report" description="Review generated investigation output and export it for demo use.">
          <Card>
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label>Case</Label>
                <CaseSelector value={caseId} onChange={setCaseId} />
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" onClick={openDocumentedReport}>
                  <ExternalLink className="h-4 w-4" />
                  Open Report
                </Button>
                <Button variant="outline" onClick={printDocumentedReport}>
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
                <Button onClick={downloadMarkdownReport}>
                  <Download className="h-4 w-4" />
                  Download Markdown
                </Button>
              </div>
              {message ? <Badge variant="yellow">{message}</Badge> : null}
            </CardContent>
          </Card>
        </PageSection>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>{structured?.metadata.report_title || report.case_id}</CardTitle>
            <RiskBadge level={structured?.risk_assessment.risk_level || report.risk_level} />
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="Case ID" value={structured?.case_details.case_id || report.case_id} />
            <Info label="Victim" value={structured?.case_details.victim_name || report.victim_name} />
            <Info label="Location" value={structured?.case_details.incident_location || report.incident_location} />
            <Info label="Incident Date" value={structured?.case_details.incident_date || report.incident_date} />
            <Info label="Generated" value={formatDate(structured?.metadata.generated_at || report.generated_at)} />
            <Info label="Status" value={structured?.metadata.case_status || report.status} />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <ReportCard
            title="Investigation Summary"
            items={[structured?.investigation_summary.summary || report.summary || "No summary returned"]}
          />
          <ReportCard
            title="Autopsy Findings"
            items={[
              `Cause of death: ${structured?.autopsy_findings.cause_of_death || report.cause_of_death || "Unknown"}`,
              `Manner of death: ${structured?.autopsy_findings.manner_of_death || "Not determined"}`,
              ...((structured?.autopsy_findings.injuries || report.injuries || []).slice(0, 8))
            ]}
          />
          <ReportCard
            title="Evidence Summary"
            items={
              structured
                ? [
                    `Total files: ${structured.evidence_summary.total_files}`,
                    `Processed files: ${structured.evidence_summary.processed_files}`,
                    ...structured.evidence_summary.files.map((file) => `${file.file_type}: ${file.file_name}`)
                  ]
                : ["Evidence summary unavailable"]
            }
          />
          <ReportCard
            title="Risk Assessment"
            items={[
              `Risk level: ${structured?.risk_assessment.risk_level || report.risk_level}`,
              `Risk score: ${Math.round(structured?.risk_assessment.risk_score || report.risk_score || 0)}`,
              ...((structured?.risk_assessment.flags || report.flags || []).map((flag) => `${flag.name}: ${flag.description}`))
            ]}
          />
          <ReportCard
            title="Timeline Analysis"
            items={withFallback(
              (structured?.timeline_analysis.events || report.timeline || [])
                .slice(0, 5)
                .map((event) => `${formatDate(event.timestamp)} - ${event.event}`),
              "No timeline events returned"
            )}
          />
          <ReportCard
            title="Correlation & Limitations"
            items={uniqueItems([
              ...((structured?.correlation_analysis.anomalies || report.anomalies || [])),
              ...((structured?.limitations || []).slice(0, 6))
            ], "No anomalies or limitations returned")}
          />
          <ReportCard
            title="Recommendations"
            items={structured?.investigation_summary.recommendations?.length ? structured.investigation_summary.recommendations : report.recommendations?.length ? report.recommendations : ["No recommendations returned"]}
          />
        </div>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "Not available"}</p>
    </div>
  );
}

function ReportCard({ title, items }: { title: string; items: string[] }) {
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

function withFallback(items: string[], fallback: string) {
  return items.length ? items : [fallback];
}

function uniqueItems(items: string[], fallback: string) {
  const unique = Array.from(new Set(items.filter(Boolean)));
  return unique.length ? unique : [fallback];
}
