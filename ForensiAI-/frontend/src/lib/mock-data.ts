import type { CaseRecord, CaseReport, TimelineEvent } from "@/lib/types";

export const mockCases: CaseRecord[] = [
  {
    id: 1,
    case_id: "CASE-COMMAND-01",
    victim_name: "Arun V.",
    incident_location: "Chennai Industrial Corridor",
    incident_date: "2026-05-08",
    notes: "Victim last seen near transport hub. Multiple data sources indicate suspicious movement.",
    status: "completed",
    risk_level: "HIGH",
    risk_score: 94,
    created_at: "2026-05-09T10:30:00"
  },
  {
    id: 2,
    case_id: "CASE-INTEL-22",
    victim_name: "Meera S.",
    incident_location: "Coimbatore",
    incident_date: "2026-05-06",
    status: "processing",
    risk_level: "MEDIUM",
    risk_score: 62,
    created_at: "2026-05-09T09:10:00"
  }
];

export const mockTimeline: TimelineEvent[] = [
  { timestamp: "2026-05-08T20:15:00", source: "mobile", event: "Mobile ping near transit junction", severity: "medium" },
  { timestamp: "2026-05-08T20:22:00", source: "cctv", event: "Victim detected near Main Gate", severity: "medium" },
  { timestamp: "2026-05-08T20:31:00", source: "gps", event: "Vehicle movement towards service road", severity: "high" },
  { timestamp: "2026-05-08T20:46:00", source: "metadata", event: "Image metadata places device near isolated parking lane", severity: "high" },
  { timestamp: "2026-05-08T21:03:00", source: "cctv", event: "Unidentified vehicle leaves corridor", severity: "high" }
];

export const mockReport: CaseReport = {
  case_id: "CASE-COMMAND-01",
  victim_name: "Arun V.",
  incident_location: "Chennai Industrial Corridor",
  incident_date: "2026-05-08",
  status: "completed",
  summary: "Evidence suggests a targeted assault with timeline inconsistencies requiring urgent suspect-route reconstruction.",
  cause_of_death: "Fatal sharp-force trauma",
  manner_of_death: "Homicidal",
  injuries: ["Multiple stab wounds", "Defensive injuries on forearms", "Vital organ trauma", "Heavy blood loss"],
  toxicology: [],
  timeline: mockTimeline,
  anomalies: ["Vehicle appears in two locations faster than normal travel time", "Device location gap during probable assault window"],
  suspicious_patterns: ["Repeated route overlap between victim movement and unknown vehicle"],
  risk_level: "HIGH",
  risk_score: 94,
  flags: [
    { name: "overkill_pattern", description: "Excessive sharp-force injuries suggest personal motive", score: 30 },
    { name: "timeline_gap", description: "Missing movement window at critical time", score: 20 },
    { name: "route_overlap", description: "Suspect vehicle overlaps victim route", score: 24 }
  ],
  recommendations: ["Secure CCTV before overwrite", "Map suspect route", "Check hospitals for hand injuries"],
  investigative_intelligence: {
    crime_story: "The victim's movement trail, CCTV detections, and injury pattern suggest a close-contact targeted assault rather than a random incident. The strongest reconstruction places the victim near the transit junction before a suspicious vehicle converged with the route and left the corridor shortly after the likely assault window.",
    case_breakthrough: "The likely breakthrough is route reconstruction: match CCTV frames, vehicle movement, and phone tower pings to isolate who shadowed the victim between 8:15 PM and 9:03 PM.",
    investigative_hypotheses: [
      { title: "Known-person targeted attack", reasoning: "Defensive injuries and repeated route overlap indicate the victim may have recognized or confronted the attacker.", confidence: "medium" },
      { title: "Vehicle-assisted escape", reasoning: "The vehicle exits the corridor shortly after the critical movement gap.", confidence: "high" }
    ],
    timeline_interpretation: [
      "The first and last detections create a strong offence boundary but do not prove the full assault location.",
      "The gap between CCTV detection and vehicle exit is the highest-value investigative window."
    ],
    contradictions_and_gaps: ["No complete GPS trail for the victim", "No confirmed weapon recovery", "Identity of vehicle owner unverified"],
    priority_leads: ["Pull traffic cameras within 2 km", "Check suspect hand injuries", "Recover deleted chats from final 24 hours"],
    action_plan: [
      { priority: "Immediate", task: "Lock offence window", why: "A smaller time window reduces suspects and camera scope." },
      { priority: "High", task: "Trace vehicle", why: "Vehicle movement is the clearest non-medical lead." },
      { priority: "High", task: "Compare injury pattern to weapon class", why: "Weapon characteristics can connect suspects to possession or disposal." }
    ],
    likely_scene_assessment: "Primary assault scene is probably near the service road or isolated parking lane, but scene confirmation needs blood pattern and CCTV verification.",
    limitations: ["Missing complete GPS trail", "No weapon evidence uploaded"]
  }
};

export const activityData = [
  { day: "Mon", cases: 12, ai: 18 },
  { day: "Tue", cases: 16, ai: 26 },
  { day: "Wed", cases: 11, ai: 22 },
  { day: "Thu", cases: 22, ai: 34 },
  { day: "Fri", cases: 19, ai: 31 },
  { day: "Sat", cases: 28, ai: 42 }
];

export const riskData = [
  { name: "High", value: 38, fill: "#FB3B64" },
  { name: "Medium", value: 44, fill: "#FACC15" },
  { name: "Low", value: 18, fill: "#dc2626" }
];

export const confidenceData = [
  { name: "Autopsy", score: 91 },
  { name: "Timeline", score: 84 },
  { name: "Correlation", score: 78 },
  { name: "Risk", score: 95 }
];

