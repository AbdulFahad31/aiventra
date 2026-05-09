"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Play, UploadCloud } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CaseSelector } from "@/components/case-selector";
import { PageSection } from "@/components/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { analyzeCase, getApiError, getResults, listEvidence, uploadEvidence } from "@/lib/api";
import { mockEvidence } from "@/lib/mock-data";
import type { EvidenceRecord } from "@/lib/types";
import { formatDate, getCurrentCaseId, setCurrentCaseId } from "@/lib/utils";

const uploadTypes = [
  { label: "Autopsy Report", value: "autopsy" },
  { label: "CCTV Logs", value: "cctv" },
  { label: "GPS Logs", value: "gps" },
  { label: "Metadata Files", value: "metadata" }
];

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [caseId, setCaseId] = React.useState("");
  const [selectedType, setSelectedType] = React.useState("autopsy");
  const [evidence, setEvidence] = React.useState<EvidenceRecord[]>([]);
  const [progress, setProgress] = React.useState<Record<string, number>>({});
  const [uploading, setUploading] = React.useState(false);
  const [analyzing, setAnalyzing] = React.useState(false);

  React.useEffect(() => {
    const stored = getCurrentCaseId();
    if (stored) setCaseId(stored);
  }, []);

  React.useEffect(() => {
    if (!caseId) return;
    setCurrentCaseId(caseId);
    listEvidence(caseId)
      .then((data) => setEvidence(data.length ? data : []))
      .catch(() => setEvidence(caseId.startsWith("CASE-DEMO") ? mockEvidence : []));
  }, [caseId]);

  async function uploadFiles(files: FileList | File[]) {
    if (!caseId) {
      toast({ title: "Select a case first", variant: "error" });
      return;
    }
    setUploading(true);
    const fileArray = Array.from(files);
    try {
      for (const file of fileArray) {
        setProgress((current) => ({ ...current, [file.name]: 1 }));
        await uploadEvidence(caseId, file, selectedType, (value) => {
          setProgress((current) => ({ ...current, [file.name]: value }));
        });
      }
      const latest = await listEvidence(caseId);
      setEvidence(latest);
      toast({ title: "Upload complete", description: `${fileArray.length} file(s) uploaded.` });
    } catch (error) {
      toast({ title: "Upload failed", description: getApiError(error), variant: "error" });
    } finally {
      setUploading(false);
    }
  }

  async function startAnalysis() {
    if (!caseId) return;
    setAnalyzing(true);
    try {
      await analyzeCase(caseId);
      toast({ title: "Analyzing evidence...", description: "Polling results every 3 seconds." });
      const timer = window.setInterval(async () => {
        try {
          const result = await getResults(caseId);
          if (result.status === "complete" || result.status === "failed") {
            window.clearInterval(timer);
            setAnalyzing(false);
            if (result.status === "complete") router.push("/analysis");
            else toast({ title: "Analysis failed", description: result.message, variant: "error" });
          }
        } catch (error) {
          window.clearInterval(timer);
          setAnalyzing(false);
          toast({ title: "Polling failed", description: getApiError(error), variant: "error" });
        }
      }, 3000);
    } catch (error) {
      setAnalyzing(false);
      toast({ title: "Analysis could not start", description: getApiError(error), variant: "error" });
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageSection title="Upload Evidence" description="Upload files to a selected case, then start the backend analysis pipeline.">
          <Card>
            <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_220px]">
              <div className="space-y-2">
                <Label>Case</Label>
                <CaseSelector value={caseId} onChange={setCaseId} />
              </div>
              <div className="space-y-2">
                <Label>Evidence Type</Label>
                <Select value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
                  {uploadTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <div
            className="rounded-lg border border-dashed bg-card p-8 text-center"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              uploadFiles(event.dataTransfer.files);
            }}
          >
            <UploadCloud className="mx-auto h-10 w-10 text-primary" />
            <h3 className="mt-4 font-semibold">Drop evidence files here</h3>
            <p className="mt-1 text-sm text-muted-foreground">PDF, CSV, logs, and metadata files are supported by the backend parser.</p>
            <div className="mt-5">
              <Input className="mx-auto max-w-sm" type="file" multiple onChange={(event) => event.target.files && uploadFiles(event.target.files)} />
            </div>
          </div>

          {Object.keys(progress).length ? (
            <Card>
              <CardHeader>
                <CardTitle>Upload Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(progress).map(([name, value]) => (
                  <div key={name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{name}</span>
                      <span className="text-muted-foreground">{value}%</span>
                    </div>
                    <Progress value={value} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </PageSection>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Uploaded Files</CardTitle>
            <Button onClick={startAnalysis} disabled={!caseId || uploading || analyzing || !evidence.length}>
              <Play className="h-4 w-4" />
              {analyzing ? "Analyzing evidence..." : "Analyze Case"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidence.length ? (
              evidence.map((item) => (
                <div key={`${item.id}-${item.file_name}`} className="flex items-center gap-3 rounded-md border p-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.file_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.uploaded_at)}</p>
                  </div>
                  <Badge variant="secondary">{item.file_type}</Badge>
                  <Badge variant={item.processed ? "green" : "outline"}>{item.processed ? "Processed" : "Uploaded"}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No files uploaded for this case yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
