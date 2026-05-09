export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | string;

export type CaseRecord = {
  id?: number;
  case_id: string;
  victim_name: string;
  incident_location: string;
  incident_date: string;
  notes?: string | null;
  status: string;
  risk_level: RiskLevel;
  risk_score: number;
  created_at?: string;
};

export type TimelineEvent = {
  timestamp: string;
  source: string;
  event: string;
  severity: string;
  metadata?: Record<string, unknown> | null;
};

export type RiskFlag = {
  name: string;
  description: string;
  score: number;
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
  story_beats?: { 
    title: string; 
    description: string;
    phase?: "normal" | "suspicious" | "critical";
    timestamp_guess?: string;
    connected_evidence?: string;
  }[];
  case_breakthrough: string;
  investigative_hypotheses: InvestigativeHypothesis[];
  timeline_interpretation: string[];
  contradictions_and_gaps: string[];
  priority_leads: string[];
  action_plan: ActionPlanItem[];
  likely_scene_assessment: string;
  limitations: string[];
};

export type NodeCategory = "evidence" | "people" | "location" | "ai_flag" | "note" | "hypothesis" | "contradiction";

export type NodeSource = "ai" | "user";

export type InvestigationNodeData = {
  label: string;
  description?: string;
  category: NodeCategory;
  source: NodeSource;
  storyBeatIds?: string[];
  icon?: string;
  color?: string;
  event?: TimelineEvent;
  flag?: RiskFlag;
  hypothesis?: InvestigativeHypothesis;
  beat?: { title: string; description: string; phase?: "normal" | "suspicious" | "critical"; timestamp_guess?: string; connected_evidence?: string };
  story?: string;
  personName?: string;
  personRole?: string;
  locationName?: string;
  locationType?: string;
  evidenceType?: string;
  evidenceFile?: string;
  noteContent?: string;
  contradictionText?: string;
  [key: string]: unknown;
};

export type NodePaletteItem = {
  type: NodeCategory;
  label: string;
  icon: string;
  color: string;
  category: string;
};

export const NODE_PALETTE_ITEMS: NodePaletteItem[] = [
  { type: "evidence", label: "Physical Evidence", icon: "FileSearch", color: "cyan", category: "Evidence" },
  { type: "evidence", label: "Digital Evidence", icon: "Monitor", color: "cyan", category: "Evidence" },
  { type: "evidence", label: "Document", icon: "FileText", color: "cyan", category: "Evidence" },
  { type: "evidence", label: "Photograph", icon: "Camera", color: "cyan", category: "Evidence" },
  { type: "evidence", label: "Forensic Report", icon: "Microscope", color: "cyan", category: "Evidence" },
  { type: "people", label: "Suspect", icon: "UserX", color: "rose", category: "People" },
  { type: "people", label: "Witness", icon: "Eye", color: "emerald", category: "People" },
  { type: "people", label: "Victim", icon: "User", color: "orange", category: "People" },
  { type: "location", label: "Crime Scene", icon: "Crosshair", color: "red", category: "Locations" },
  { type: "location", label: "Secondary Scene", icon: "MapPin", color: "amber", category: "Locations" },
  { type: "location", label: "Route", icon: "Navigation", color: "blue", category: "Locations" },
  { type: "ai_flag", label: "Risk Flag", icon: "AlertTriangle", color: "red", category: "AI Flags" },
  { type: "ai_flag", label: "Pattern Alert", icon: "Zap", color: "yellow", category: "AI Flags" },
  { type: "ai_flag", label: "Anomaly", icon: "Activity", color: "orange", category: "AI Flags" },
  { type: "note", label: "Investigator Note", icon: "StickyNote", color: "slate", category: "Notes" },
  { type: "note", label: "Theory Note", icon: "Lightbulb", color: "purple", category: "Notes" },
];

export type EdgeRelationship = "implicates" | "contradicts" | "corroborates" | "located_at" | "witnessed" | "timeline" | "derived_from" | "related";

export type CaseReport = {
  case_id: string;
  victim_name: string;
  incident_location: string;
  incident_date: string;
  status: string;
  summary?: string;
  cause_of_death?: string;
  manner_of_death?: string;
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
  structured_report?: {
    evidence_summary?: {
      total_files: number;
      processed_files: number;
      files: Array<{ file_name: string; file_type: string; processed: boolean; uploaded_at: string }>;
    };
    autopsy_findings?: {
      cause_of_death: string;
      manner_of_death: string;
      injuries: string[];
      toxicology: string[];
      confidence: number;
    };
    timeline_analysis?: {
      total_events: number;
      events: TimelineEvent[];
    };
    correlation_analysis?: {
      anomalies: string[];
      suspicious_patterns: string[];
      confidence: number;
    };
    risk_assessment?: {
      risk_level: RiskLevel;
      risk_score: number;
      flags: RiskFlag[];
    };
    investigation_summary?: {
      summary: string;
      recommendations: string[];
      confidence: number;
    };
    investigative_intelligence?: InvestigativeIntelligence;
    limitations?: string[];
  };
};

