import axios from "axios";
import type { CaseRecord, CaseReport } from "@/lib/types";
import { auth } from "@/lib/firebase";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000
});

api.interceptors.request.use(async (config) => {
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export type CreateCasePayload = {
  victim_name: string;
  incident_location: string;
  incident_date: string;
  notes?: string;
};

export async function getCases() {
  const { data } = await api.get<CaseRecord[] | { cases: CaseRecord[] }>("/cases");
  return Array.isArray(data) ? data : data.cases || [];
}

export async function createCase(payload: CreateCasePayload) {
  const { data } = await api.post<CaseRecord>("/cases", payload);
  return data;
}

export async function deleteCase(caseId: string) {
  const { data } = await api.delete(`/cases/${caseId}`);
  return data;
}

export async function uploadEvidence(caseId: string, fileType: string, file: File, onProgress?: (progress: number) => void) {
  const formData = new FormData();
  formData.append("file_type", fileType);
  formData.append("file", file);
  const { data } = await api.post(`/cases/${caseId}/upload`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!event.total) return;
      onProgress?.(Math.round((event.loaded * 100) / event.total));
    }
  });
  return data;
}

export async function analyzeCase(caseId: string) {
  const { data } = await api.post(`/cases/${caseId}/analyze`, {
    body_temperature: 37.0,
    ambient_temperature: 20.0,
    rigor_stage: "none"
  });
  return data;
}

export async function getReport(caseId: string) {
  const { data } = await api.get<CaseReport>(`/cases/${caseId}/report`);
  return data;
}

export async function getReportDocumentUrl(caseId: string) {
  const token = await auth.currentUser?.getIdToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return `${API_URL}/cases/${encodeURIComponent(caseId)}/report/document${query}`;
}

export async function getEvidence(caseId: string) {
  const { data } = await api.get(`/cases/${caseId}/evidence`);
  return Array.isArray(data) ? data : [];
}

