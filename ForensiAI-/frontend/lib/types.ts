export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | string;

export type CaseRecord = {
  id: number;
  case_id: string;
  victim_name: string;
  incident_location: string;
  incident_date: string;
  notes?: string | null;
  status: string;
  risk_level: RiskLevel;
  risk_score: number;
  created_at: string;
};

export type EvidenceRecord = {
  id: number;
  case_id: string;
  file_type: string;
  file_name: string;
  processed: boolean;
  uploaded_at: string;
};

export type TimelineEvent = {
  timestamp: string;
  source: string;
  event: string;
  severity: string;
  metadata?: Record<string, unknown> | null;
};

export type TimelineResponse = {
  case_id: string;
  events: TimelineEvent[];
  total_events: number;
};

export type AnalysisStatus = {
  status: "processing" | "complete" | "failed" | string;
  case_id: string;
  message?: string;
  results_ready?: boolean;
};

export type RiskFlag = {
  name: string;
  description: string;
  score: number;
};

export type CaseReport = {
  case_id: string;
  victim_name: string;
  incident_location: string;
  incident_date: string;
  status: string;
  summary?: string;
  cause_of_death?: string;
  injuries?: string[];
  toxicology?: string[];
  timeline?: TimelineEvent[];
  anomalies?: string[];
  suspicious_patterns?: string[];
  risk_level: RiskLevel;
  risk_score: number;
  flags?: RiskFlag[];
  recommendations?: string[];
  investigative_intelligence?: InvestigativeIntelligence;
  case_notes?: string | null;
  generated_at?: string;
  structured_report?: StructuredReport;
};

export type InvestigativeHypothesis = {
  title: string;
  reasoning: string;
  confidence: string;
};

export type ActionPlanItem = {
  priority: string;
  task: string;
  why: string;
};

export type InvestigativeIntelligence = {
  crime_story: string;
  case_breakthrough: string;
  investigative_hypotheses: InvestigativeHypothesis[];
  timeline_interpretation: string[];
  contradictions_and_gaps: string[];
  priority_leads: string[];
  action_plan: ActionPlanItem[];
  likely_scene_assessment: string;
  limitations: string[];
};

export type StructuredReport = {
  metadata: {
    report_title: string;
    report_version: string;
    generated_at: string;
    generated_by: string;
    case_status: string;
  };
  case_details: {
    case_id: string;
    victim_name: string;
    incident_location: string;
    incident_date: string;
    case_notes?: string | null;
  };
  evidence_summary: {
    total_files: number;
    processed_files: number;
    files: Array<{
      file_name: string;
      file_type: string;
      processed: boolean;
      uploaded_at: string;
    }>;
  };
  autopsy_findings: {
    cause_of_death: string;
    manner_of_death: string;
    injuries: string[];
    toxicology: string[];
    confidence: number;
  };
  timeline_analysis: {
    total_events: number;
    events: TimelineEvent[];
  };
  correlation_analysis: {
    anomalies: string[];
    suspicious_patterns: string[];
    confidence: number;
  };
  risk_assessment: {
    risk_level: RiskLevel;
    risk_score: number;
    flags: RiskFlag[];
  };
  investigation_summary: {
    summary: string;
    recommendations: string[];
    confidence: number;
  };
  investigative_intelligence?: InvestigativeIntelligence;
  limitations: string[];
};

export type CreateCasePayload = {
  victim_name: string;
  incident_location: string;
  incident_date: string;
  notes?: string;
};

export type TodInput = {
  body_temperature?: number | null;
  ambient_temperature?: number | null;
  rigor_stage?: string | null;
};
