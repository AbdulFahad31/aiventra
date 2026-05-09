"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageSection } from "@/components/page-section";
import { RiskBadge } from "@/components/risk-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { analyzeCase, createCase, getApiError, listCases, uploadEvidence } from "@/lib/api";
import { mockCases } from "@/lib/mock-data";
import type { CaseRecord } from "@/lib/types";
import { formatDate, setCurrentCaseId } from "@/lib/utils";

const evidenceTypes = [
  { key: "autopsy", label: "Autopsy Report", required: true, accept: ".pdf", hint: "PDF only" },
  { key: "cctv", label: "CCTV Logs", required: false, accept: ".csv,.txt,.log", hint: "CSV/log" },
  { key: "gps", label: "GPS Logs", required: false, accept: ".csv,.txt,.log", hint: "CSV/log" },
  { key: "metadata", label: "Metadata Files", required: false, accept: ".csv,.json,.txt", hint: "CSV/JSON" }
];

export default function CasesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cases, setCases] = React.useState<CaseRecord[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [files, setFiles] = React.useState<Record<string, File | null>>({
    autopsy: null,
    cctv: null,
    gps: null,
    metadata: null
  });
  const [form, setForm] = React.useState({
    case_id: "",
    victim_name: "",
    incident_location: "",
    incident_date: "",
    notes: ""
  });

  React.useEffect(() => {
    listCases()
      .then((data) => setCases(data.length ? data : mockCases))
      .catch(() => setCases(mockCases));
  }, []);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateFile(type: string, file?: File) {
    setFiles((current) => ({ ...current, [type]: file || null }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const autopsyFile = files.autopsy;
    if (autopsyFile && !autopsyFile.name.toLowerCase().endsWith(".pdf")) {
      toast({
        title: "Unsupported autopsy file",
        description: "Please upload the autopsy report as a PDF. DOCX parsing is not enabled in the backend.",
        variant: "error"
      });
      return;
    }

    setSubmitting(true);
    setProgress(5);
    try {
      const created = await createCase({
        victim_name: form.victim_name,
        incident_location: form.incident_location,
        incident_date: form.incident_date,
        notes: form.notes || `Requested Case ID: ${form.case_id || "not provided"}`
      });
      setCurrentCaseId(created.case_id);
      setProgress(20);

      const selectedFiles = Object.entries(files).filter(([, file]) => file) as Array<[string, File]>;
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const [type, file] = selectedFiles[index];
        await uploadEvidence(created.case_id, file, type);
        setProgress(20 + Math.round(((index + 1) / selectedFiles.length) * 50));
      }

      if (selectedFiles.length) {
        await analyzeCase(created.case_id);
        setProgress(90);
        toast({ title: "Case submitted", description: `${created.case_id} is analyzing now.` });
      } else {
        toast({ title: "Case created", description: `${created.case_id} created without evidence.` });
      }

      setProgress(100);
      router.push(`/cases/${created.case_id}`);
    } catch (error) {
      toast({ title: "Case setup failed", description: getApiError(error), variant: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageSection title="Create Investigation Case" description="Enter case details, attach evidence, and start analysis in one flow.">
          <Card>
            <CardContent className="p-5">
              <form className="grid gap-5" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Case ID" helper="Optional. Backend creates official ID.">
                    <Input value={form.case_id} onChange={(event) => updateField("case_id", event.target.value)} />
                  </Field>
                  <Field label="Victim Name">
                    <Input value={form.victim_name} onChange={(event) => updateField("victim_name", event.target.value)} required />
                  </Field>
                  <Field label="Incident Location">
                    <Input value={form.incident_location} onChange={(event) => updateField("incident_location", event.target.value)} required />
                  </Field>
                  <Field label="Incident Date">
                    <Input type="date" value={form.incident_date} onChange={(event) => updateField("incident_date", event.target.value)} required />
                  </Field>
                </div>

                <Field label="Initial Case Notes">
                  <Textarea value={form.notes} onChange={(event) => updateField("notes", event.target.value)} />
                </Field>

                <div>
                  <h3 className="font-semibold">Evidence Files</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Attach whatever is available now. Missing CCTV/GPS/metadata will be listed as report limitations.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {evidenceTypes.map((item) => (
                      <label key={item.key} className="rounded-lg border bg-background p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{item.label}</p>
                            <p className="text-xs text-muted-foreground">{files[item.key]?.name || "No file selected"}</p>
                          </div>
                          {item.required ? <Badge variant="yellow">Recommended</Badge> : <Badge variant="outline">Optional</Badge>}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">{item.hint}</p>
                        <Input
                          className="mt-3"
                          type="file"
                          accept={item.accept}
                          onChange={(event) => updateFile(item.key, event.target.files?.[0])}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {submitting ? <Progress value={progress} /> : null}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" disabled={submitting}>
                    <Save className="h-4 w-4" />
                    {submitting ? "Creating Case..." : "Create, Upload & Analyze"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </PageSection>

        <Card>
          <CardHeader>
            <CardTitle>Existing Cases</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {cases.map((item) => (
              <Link key={item.case_id} href={`/cases/${item.case_id}`} className="rounded-lg border p-4 transition-colors hover:bg-accent">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">{item.case_id} · {item.victim_name}</p>
                      <p className="text-sm text-muted-foreground">{item.incident_location} · {formatDate(item.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <RiskBadge level={item.risk_level} />
                    <Badge variant="secondary">{item.status}</Badge>
                  </div>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}
