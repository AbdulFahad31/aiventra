import axios, { AxiosError } from "axios";
import type {
  AnalysisStatus,
  CaseRecord,
  CaseReport,
  CreateCasePayload,
  EvidenceRecord,
  TimelineResponse,
  TodInput
} from "@/lib/types";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

export function getApiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ detail?: string; message?: string }>;
    return axiosError.response?.data?.detail || axiosError.response?.data?.message || axiosError.message;
  }
  return error instanceof Error ? error.message : "Unexpected API error";
}

export async function listCases() {
  const { data } = await client.get<CaseRecord[]>("/cases");
  return data;
}

export async function getCase(caseId: string) {
  const { data } = await client.get<CaseRecord>(`/cases/${caseId}`);
  return data;
}

export async function createCase(payload: CreateCasePayload) {
  const { data } = await client.post<CaseRecord>("/cases", payload);
  return data;
}

export async function listEvidence(caseId: string) {
  const { data } = await client.get<EvidenceRecord[]>(`/cases/${caseId}/evidence`);
  return data;
}

export async function uploadEvidence(
  caseId: string,
  file: File,
  fileType: string,
  onUploadProgress?: (progress: number) => void
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("file_type", fileType);

  const { data } = await client.post(`/cases/${caseId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!event.total || !onUploadProgress) return;
      onUploadProgress(Math.round((event.loaded * 100) / event.total));
    }
  });

  return data;
}

export async function analyzeCase(caseId: string, todInput: TodInput = {}) {
  const payload: TodInput = {
    body_temperature: todInput.body_temperature ?? null,
    ambient_temperature: todInput.ambient_temperature ?? null,
    rigor_stage: todInput.rigor_stage ?? null
  };
  const { data } = await client.post<AnalysisStatus>(`/cases/${caseId}/analyze`, payload);
  return data;
}

export async function getResults(caseId: string) {
  const { data } = await client.get<AnalysisStatus>(`/cases/${caseId}/results`);
  return data;
}

export async function getTimeline(caseId: string) {
  const { data } = await client.get<TimelineResponse>(`/cases/${caseId}/timeline`);
  return data;
}

export async function getReport(caseId: string) {
  const { data } = await client.get<CaseReport>(`/cases/${caseId}/report`);
  return data;
}

export function getReportDocumentUrl(caseId: string) {
  return `${API_BASE_URL}/cases/${encodeURIComponent(caseId)}/report/document`;
}

export function getReportMarkdownUrl(caseId: string) {
  return `${API_BASE_URL}/cases/${encodeURIComponent(caseId)}/report/markdown`;
}
