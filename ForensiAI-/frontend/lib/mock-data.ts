import type { CaseRecord, CaseReport, EvidenceRecord, TimelineResponse } from "@/lib/types";

export const mockCases: CaseRecord[] = [
  {
    id: 1,
    case_id: "CASE-DEMO-001",
    victim_name: "Demo Victim",
    incident_location: "North District Warehouse",
    incident_date: "2026-05-08",
    notes: "Mock case used when backend is unavailable.",
    status: "completed",
    risk_level: "HIGH",
    risk_score: 82,
    created_at: "2026-05-09T09:00:00Z"
  },
  {
    id: 2,
    case_id: "CASE-DEMO-002",
    victim_name: "Pending Case",
    incident_location: "Transit Hub",
    incident_date: "2026-05-07",
    notes: "Evidence upload pending.",
    status: "pending",
    risk_level: "LOW",
    risk_score: 18,
    created_at: "2026-05-09T08:30:00Z"
  }
];

export const mockEvidence: EvidenceRecord[] = [
  {
    id: 1,
    case_id: "CASE-DEMO-001",
    file_type: "autopsy",
    file_name: "autopsy_report_demo.pdf",
    processed: true,
    uploaded_at: "2026-05-09T09:10:00Z"
  },
  {
    id: 2,
    case_id: "CASE-DEMO-001",
    file_type: "gps",
    file_name: "gps_trace_demo.csv",
    processed: true,
    uploaded_at: "2026-05-09T09:12:00Z"
  }
];

export const mockTimeline: TimelineResponse = {
  case_id: "CASE-DEMO-001",
  total_events: 4,
  events: [
    {
      timestamp: "2026-05-08T18:20:00Z",
      source: "gps",
      event: "Device entered incident perimeter.",
      severity: "medium"
    },
    {
      timestamp: "2026-05-08T18:42:00Z",
      source: "cctv",
      event: "Subject seen near east gate.",
      severity: "high"
    },
    {
      timestamp: "2026-05-08T19:05:00Z",
      source: "metadata",
      event: "Camera file timestamp mismatch detected.",
      severity: "high"
    },
    {
      timestamp: "2026-05-08T19:30:00Z",
      source: "tod_calculation",
      event: "Estimated death window begins.",
      severity: "high"
    }
  ]
};

export const mockReport: CaseReport = {
  case_id: "CASE-DEMO-001",
  victim_name: "Demo Victim",
  incident_location: "North District Warehouse",
  incident_date: "2026-05-08",
  status: "completed",
  summary: "Evidence indicates a high-risk investigation with timeline inconsistencies and multiple source correlations.",
  cause_of_death: "Blunt force trauma",
  injuries: ["Cranial trauma", "Defensive wounds"],
  toxicology: ["No major toxins detected"],
  timeline: mockTimeline.events,
  anomalies: ["Metadata timestamp mismatch", "GPS gap near incident time"],
  suspicious_patterns: ["CCTV and GPS sources disagree within a critical 20 minute window"],
  risk_level: "HIGH",
  risk_score: 82,
  flags: [
    {
      name: "Timeline inconsistency",
      description: "Events from CCTV and GPS conflict around the incident window.",
      score: 34
    },
    {
      name: "Metadata anomaly",
      description: "Uploaded media shows edited timestamp metadata.",
      score: 27
    }
  ],
  recommendations: [
    "Verify original CCTV storage media.",
    "Interview personnel assigned to the east gate.",
    "Cross-check GPS records with carrier logs."
  ],
  case_notes: "Mock report for offline frontend testing.",
  generated_at: "2026-05-09T10:00:00Z"
};
