"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Download, ExternalLink, FileText, Lightbulb, MapPinned, Printer, ShieldAlert, Skull, Timer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiError, getReport, getReportDocumentUrl, getReportMarkdownUrl } from "@/lib/api";
import { mockReport } from "@/lib/mock-data";
import type { CaseReport } from "@/lib/types";
import { formatDate, setCurrentCaseId } from "@/lib/utils";

const tabs = ["Overview", "Evidence", "Analysis", "Timeline", "Risk", "Report"] as const;

export default function CaseDetailsPage() {
  const params = useParams<{ caseId: string }>();
  const caseId = params.caseId;
  const [activeTab, setActiveTab] = React.useState<(typeof tabs)[number]>("Overview");
  const [report, setReport] = React.useState<CaseReport | null>(null);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!caseId) return;
    setCurrentCaseId(caseId);
    setLoading(true);
    getReport(caseId)
      .then((data) => {
        setReport(data);
        setMessage("");
      })
      .catch((error) => {
        setReport({ ...mockReport, case_id: caseId });
        setMessage(`${getApiError(error)}. Showing mock report layout.`);
      })
      .finally(() => setLoading(false));
  }, [caseId]);

  if (loading || !report) {
    return (
      <AppShell>
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </AppShell>
    );
  }

  const structured = report.structured_report;
  const caseDetails = structured?.case_details;
  const autopsy = structured?.autopsy_findings;
  const evidence = structured?.evidence_summary;
  const timeline = structured?.timeline_analysis.events || report.timeline || [];
  const risk = structured?.risk_assessment;
  const correlation = structured?.correlation_analysis;
  const summary = structured?.investigation_summary;
  const intelligence = structured?.investigative_intelligence || report.investigative_intelligence;
  const limitations = structured?.limitations || [];
  const injuries = autopsy?.injuries || report.injuries || [];
  const flags = risk?.flags || report.flags || [];

  const documentedUrl = getReportDocumentUrl(report.case_id);
  const markdownUrl = getReportMarkdownUrl(report.case_id);

  return (
    <AppShell>
      <div className="space-y-6">
        <Card className="overflow-hidden">
          <div className="border-b bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Investigation Case</p>
                <h2 className="mt-1 text-2xl font-semibold">{report.case_id}</h2>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  {intelligence?.case_breakthrough || summary?.summary || report.summary || "Analysis summary will appear after the backend completes processing."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <RiskBadge level={risk?.risk_level || report.risk_level} />
                <Badge variant="secondary">{report.status}</Badge>
              </div>
            </div>
          </div>
          <CardContent className="grid gap-4 p-5 md:grid-cols-4">
            <Info label="Victim" value={caseDetails?.victim_name || report.victim_name} />
            <Info label="Location" value={caseDetails?.incident_location || report.incident_location} />
            <Info label="Incident Date" value={caseDetails?.incident_date || report.incident_date} />
            <Info label="Generated" value={formatDate(structured?.metadata.generated_at || report.generated_at)} />
          </CardContent>
        </Card>

        {message ? <Badge variant="yellow">{message}</Badge> : null}

        <div className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2">
          {tabs.map((tab) => (
            <Button key={tab} variant={activeTab === tab ? "default" : "ghost"} size="sm" onClick={() => setActiveTab(tab)}>
              {tab}
            </Button>
          ))}
        </div>

        {activeTab === "Overview" ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard title="Cause of Death" value={autopsy?.cause_of_death || report.cause_of_death || "Unknown"} icon={Skull} />
              <StatCard title="Risk Score" value={Math.round(risk?.risk_score || report.risk_score || 0)} icon={ShieldAlert} tone="red" />
              <StatCard title="Evidence Files" value={evidence?.total_files || 0} icon={FileText} />
              <StatCard title="Timeline Events" value={timeline.length} icon={Timer} tone="yellow" />
            </div>
            {intelligence ? (
              <div className="grid gap-4 xl:grid-cols-[1.4fr_.9fr]">
                <NarrativeCard title="AI Crime Story" body={intelligence.crime_story} />
                <NarrativeCard title="Case Breakthrough" body={intelligence.case_breakthrough} tone="blue" />
              </div>
            ) : null}
            {intelligence ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <InsightSection
                  title="Investigative Hypotheses"
                  items={intelligence.investigative_hypotheses.map((item) => ({
                    heading: `${item.title} · ${item.confidence} confidence`,
                    body: item.reasoning
                  }))}
                />
                <TextSection title="Priority Leads" items={intelligence.priority_leads} />
              </div>
            ) : null}
            <div className="grid gap-4 lg:grid-cols-2">
              <TextSection title="Key Findings" items={[
                `Manner of death: ${autopsy?.manner_of_death || "Not determined"}`,
                ...injuries.slice(0, 6)
              ]} />
              <TextSection title="Recommended Actions" items={summary?.recommendations || report.recommendations || []} />
            </div>
          </div>
        ) : null}

        {activeTab === "Evidence" ? (
          <TextSection
            title="Uploaded Evidence"
            items={(evidence?.files || []).map((file) => `${file.file_type.toUpperCase()} · ${file.file_name} · ${file.processed ? "processed" : "uploaded"}`)}
            empty="No evidence files found."
          />
        ) : null}

        {activeTab === "Analysis" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <TextSection title="Autopsy Findings" items={[
              `Cause of death: ${autopsy?.cause_of_death || report.cause_of_death || "Unknown"}`,
              `Manner of death: ${autopsy?.manner_of_death || "Not determined"}`,
              `Confidence: ${Math.round((autopsy?.confidence || 0) * 100)}%`,
              ...injuries
            ]} />
            <TextSection title="Correlation Findings" items={[
              ...(correlation?.anomalies || report.anomalies || []),
              ...(correlation?.suspicious_patterns || report.suspicious_patterns || [])
            ]} />
          </div>
        ) : null}

        {activeTab === "Timeline" ? (
          <div className="grid gap-4 xl:grid-cols-[.9fr_1.3fr]">
            <TextSection
              title="Timeline Intelligence"
              items={[
                ...(intelligence?.timeline_interpretation || []),
                intelligence?.likely_scene_assessment || ""
              ]}
            />
            <Card>
              <CardHeader>
                <CardTitle>Timeline Reconstruction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={`${event.timestamp}-${index}`} className="rounded-lg border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{event.source}</Badge>
                      <Badge variant={event.severity === "high" ? "red" : event.severity === "medium" ? "yellow" : "green"}>{event.severity}</Badge>
                      <span className="text-sm text-muted-foreground">{formatDate(event.timestamp)}</span>
                    </div>
                    <p className="mt-3 text-sm">{event.event}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === "Risk" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-4xl font-semibold">{Math.round(risk?.risk_score || report.risk_score || 0)}/100</p>
                <RiskBadge level={risk?.risk_level || report.risk_level} />
              </CardContent>
            </Card>
            <TextSection title="Triggered Flags" items={flags.map((flag) => `${flag.name}: ${flag.description}`)} />
            <TextSection title="Contradictions & Gaps" items={intelligence?.contradictions_and_gaps || limitations} />
          </div>
        ) : null}

        {activeTab === "Report" ? (
          <div className="space-y-4">
            {intelligence ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <InsightSection
                  title="Priority Action Plan"
                  items={intelligence.action_plan.map((item) => ({
                    heading: `${item.priority}: ${item.task}`,
                    body: item.why
                  }))}
                />
                <TextSection title="Report Limitations" items={intelligence.limitations || limitations} />
              </div>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>Documented Report</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button asChild>
                  <a href={documentedUrl} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open Full Report
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={documentedUrl} target="_blank" rel="noreferrer">
                    <Printer className="h-4 w-4" />
                    Print / Save PDF
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={markdownUrl}>
                    <Download className="h-4 w-4" />
                    Download Markdown
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}

function NarrativeCard({ title, body, tone = "default" }: { title: string; body?: string; tone?: "default" | "blue" }) {
  return (
    <Card className={tone === "blue" ? "border-blue-500/40 bg-blue-500/5" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {tone === "blue" ? <Lightbulb className="h-5 w-5 text-blue-400" /> : <MapPinned className="h-5 w-5 text-blue-400" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-7 text-muted-foreground">{body || "No investigative narrative returned."}</p>
      </CardContent>
    </Card>
  );
}

function InsightSection({ title, items }: { title: string; items: Array<{ heading: string; body: string }> }) {
  const values = items.filter((item) => item.heading || item.body);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {values.length ? values.map((item) => (
          <div key={`${item.heading}-${item.body}`} className="rounded-md border p-3">
            <p className="text-sm font-semibold">{item.heading}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
          </div>
        )) : <p className="text-sm text-muted-foreground">No intelligence returned.</p>}
      </CardContent>
    </Card>
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

function TextSection({ title, items, empty = "No findings returned." }: { title: string; items: string[]; empty?: string }) {
  const values = Array.from(new Set(items.filter(Boolean)));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {values.length ? values.map((item) => (
          <div key={item} className="rounded-md border p-3 text-sm text-muted-foreground">
            {item}
          </div>
        )) : <p className="text-sm text-muted-foreground">{empty}</p>}
      </CardContent>
    </Card>
  );
}
