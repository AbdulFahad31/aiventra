import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Database,
  FileText,
  Fingerprint,
  LayoutDashboard,
  Lock,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  Upload,
  UserCircle2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { analyzeCase, createCase, getCases, getReport, getReportDocumentUrl, uploadEvidence, getEvidence } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { mockCases, mockReport, mockTimeline } from "@/lib/mock-data";
import type { CaseRecord, CaseReport, RiskLevel } from "@/lib/types";
import { cn, delay, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

type AppView = "dashboard" | "cases" | "settings";
type CaseTab = "Overview" | "Evidence" | "Timeline" | "AI Analysis" | "Risk Engine" | "Reports";
type WorkflowStep = "case" | "evidence" | "analysis" | "results";
type EvidenceFile = { file_name: string; file_type: string; processed: boolean; uploaded_at: string };

type CaseForm = {
  title: string;
  victim_name: string;
  incident_location: string;
  incident_date: string;
  notes: string;
  priority: RiskLevel;
};

const caseTabs: CaseTab[] = ["Overview", "Evidence", "Timeline", "AI Analysis", "Risk Engine", "Reports"];

const evidenceTypes = [
  { key: "autopsy", label: "Autopsy report", accept: ".pdf" },
  { key: "cctv", label: "CCTV logs", accept: ".csv,.txt,.log" },
  { key: "metadata", label: "Metadata", accept: ".json,.csv,.txt" },
  { key: "image", label: "Images", accept: ".jpg,.jpeg,.png" },
  { key: "gps", label: "GPS records", accept: ".csv,.txt,.log" }
];

const workflowLogs = [
  "Parsing autopsy report",
  "Extracting injury signatures",
  "Correlating CCTV and GPS metadata",
  "Building timeline reconstruction",
  "Detecting anomalies and route conflicts",
  "Generating forensic intelligence brief",
  "Preparing investigation report"
];

const riskTrend = [
  { day: "Mon", score: 42 },
  { day: "Tue", score: 51 },
  { day: "Wed", score: 58 },
  { day: "Thu", score: 64 },
  { day: "Fri", score: 71 },
  { day: "Sat", score: 68 }
];

const activityItems = [
  "Evidence uploaded to active investigation",
  "Risk report generated",
  "Case timeline updated",
  "Investigator note added"
];

export default function App() {
  const { user, loading, signInWithEmail, signUpWithEmail, logout } = useAuth();
  const [view, setView] = useState<AppView>("dashboard");
  const [cases, setCases] = useState<CaseRecord[]>(mockCases);
  const [evidenceList, setEvidenceList] = useState<Array<{ file_name: string; file_type: string; processed: boolean; uploaded_at: string; case_id?: string }>>([]);
  const [selectedCase, setSelectedCase] = useState<CaseReport>(mockReport);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeCaseTab, setActiveCaseTab] = useState<CaseTab>("Overview");
  const [caseDialogOpen, setCaseDialogOpen] = useState(false);
  const [caseSearch, setCaseSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    getCases()
      .then((items) => {
        if (items.length) {
          setCases(items);
        }
      })
      .catch(() => undefined);
  }, [user]);

  useEffect(() => {
    // fetch evidence for each case (user-specific) and aggregate
    if (!user) return;
    if (!cases || cases.length === 0) {
      setEvidenceList([]);
      return;
    }
    (async () => {
      try {
        const arrays = await Promise.all(
          cases.map((c) => getEvidence(c.case_id).catch(() => []))
        );
        const all = arrays.flat().map((e: any) => ({ ...(e || {}), case_id: e?.case_id }));
        // sort by uploaded_at desc when possible
        all.sort((a: any, b: any) => {
          const ta = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
          const tb = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
          return tb - ta;
        });
        setEvidenceList(all as any[]);
      } catch {
        setEvidenceList([]);
      }
    })();
  }, [user, cases]);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Investigator";
  const activeCases = cases.filter((item) => item.status !== "closed").length;
  const highRiskCases = cases.filter((item) => String(item.risk_level).toUpperCase() === "HIGH").length;
  const evidenceCount = evidenceList.length || (selectedCase.structured_report?.evidence_summary?.total_files ?? Math.max(3, cases.length * 4));
  const riskDistribution = useMemo(() => buildRiskDistribution(cases), [cases]);
  const filteredCases = cases.filter((item) => {
    const query = caseSearch.trim().toLowerCase();
    if (!query) return true;
    return [item.case_id, item.victim_name, item.incident_location, item.status, item.risk_level]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  async function selectCase(caseId: string) {
    setSelectedCaseId(caseId);
    setView("cases");
    setActiveCaseTab("Overview");
    try {
      setSelectedCase(await getReport(caseId));
    } catch {
      const record = cases.find((item) => item.case_id === caseId);
      setSelectedCase({
        ...mockReport,
        case_id: caseId,
        victim_name: record?.victim_name || mockReport.victim_name,
        incident_location: record?.incident_location || mockReport.incident_location,
        incident_date: record?.incident_date || mockReport.incident_date,
        status: record?.status || mockReport.status,
        risk_level: record?.risk_level || mockReport.risk_level,
        risk_score: record?.risk_score || mockReport.risk_score,
        case_notes: record?.notes || mockReport.case_notes
      });
    }
  }

  function backToCases() {
    setSelectedCaseId(null);
    setActiveCaseTab("Overview");
  }

  async function openReport(caseId: string) {
    window.open(await getReportDocumentUrl(caseId), "_blank");
  }

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <LoginGate onEmailSignIn={signInWithEmail} onEmailSignUp={signUpWithEmail} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5]">
      <div className="flex min-h-screen">
        <Sidebar activeView={view} onNavigate={(next) => { setView(next); setSelectedCaseId(null); }} onLogout={logout} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
            {view === "dashboard" ? (
              <DashboardPage
                cases={cases}
                activeCases={activeCases}
                evidenceCount={evidenceCount}
                highRiskCases={highRiskCases}
                riskDistribution={riskDistribution}
                userName={displayName}
                onNewCase={() => setCaseDialogOpen(true)}
                onOpenCase={selectCase}
                onViewCases={() => setView("cases")}
              />
            ) : null}

            {view === "cases" && selectedCaseId ? (
              <CaseDetailPage
                report={selectedCase}
                activeTab={activeCaseTab}
                setActiveTab={setActiveCaseTab}
                onBack={backToCases}
                onOpenReport={() => openReport(selectedCase.case_id)}
                onCaseUpdated={(report) => {
                  setSelectedCase(report);
                  setCases((prev) => [toCaseRecord(report), ...prev.filter((item) => item.case_id !== report.case_id)]);
                }}
              />
            ) : null}

            {view === "cases" && !selectedCaseId ? (
              <CasesPage
                cases={filteredCases}
                totalCases={cases.length}
                search={caseSearch}
                setSearch={setCaseSearch}
                onNewCase={() => setCaseDialogOpen(true)}
                onOpenCase={selectCase}
              />
            ) : null}

            {view === "settings" ? <SettingsPage userName={displayName} email={user.email || ""} /> : null}
          </div>
        </main>
      </div>

      <NewCaseDialog
        open={caseDialogOpen}
        onClose={() => setCaseDialogOpen(false)}
        onCreated={(created) => {
          setCases((prev) => [created, ...prev.filter((item) => item.case_id !== created.case_id)]);
          setCaseDialogOpen(false);
          selectCase(created.case_id);
        }}
      />
    </div>
  );
}

function Sidebar({ activeView, onNavigate, onLogout }: { activeView: AppView; onNavigate: (view: AppView) => void; onLogout: () => Promise<void> }) {
  const items: Array<{ id: AppView; label: string; icon: typeof LayoutDashboard }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "cases", label: "Cases", icon: Briefcase },
    { id: "settings", label: "Settings", icon: Settings }
  ];

  return (
    <aside className="sticky top-0 hidden h-screen w-[220px] shrink-0 border-r border-[#2d1515] bg-[#0a0a0a] md:flex md:flex-col">
      <div className="flex h-14 items-center gap-3 border-b border-[#2d1515] px-4">
        <div className="grid h-8 w-8 place-items-center rounded-md border border-[#2d1515] bg-[#0f0a0a]">
          <Fingerprint className="h-4 w-4 text-[#fca5a5]" />
        </div>
        <span className="text-sm font-semibold">ForensiAI</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-[#b0b0b0] transition-colors hover:bg-[#1a1a1a] hover:text-[#f5f5f5]",
              activeView === item.id && "bg-[rgba(220,38,38,0.12)] text-[#dc2626]"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="border-t border-[#2d1515] p-3">
        <Button variant="ghost" className="w-full justify-start px-3" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[#2d1515] pb-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-[-0.02em] text-[#f5f5f5]">{title}</h1>
        <p className="mt-1 text-sm leading-6 text-[#b0b0b0]">{subtitle}</p>
      </div>
      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </header>
  );
}

function DashboardPage({
  cases,
  activeCases,
  evidenceCount,
  highRiskCases,
  riskDistribution,
  userName,
  onNewCase,
  onOpenCase,
  onViewCases
}: {
  cases: CaseRecord[];
  activeCases: number;
  evidenceCount: number;
  highRiskCases: number;
  riskDistribution: Array<{ name: string; count: number }>;
  userName: string;
  onNewCase: () => void;
  onOpenCase: (caseId: string) => void;
  onViewCases: () => void;
}) {
  const evidenceList = [
    { file_name: "autopsy_report.pdf", uploaded_at: new Date().toISOString() },
    { file_name: "cctv_gate_2.csv", uploaded_at: new Date().toISOString() },
    { file_name: "gps_export.json", uploaded_at: new Date().toISOString() },
    { file_name: "scene_photo_014.jpg", uploaded_at: new Date().toISOString() }
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Welcome back, ${userName}`}
        action={<Button onClick={onNewCase}><Plus className="h-4 w-4" /> New Case</Button>}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Total Cases" value={cases.length} detail="+8% this month" />
        <StatCard icon={Activity} label="Active Investigations" value={activeCases} detail="Open workload" />
        <StatCard icon={Database} label="Evidence Items" value={evidenceCount} detail="Across active cases" />
        <StatCard icon={ShieldAlert} label="High Risk Cases" value={highRiskCases} detail="Needs review" danger />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Cases</CardTitle>
            <Button variant="ghost" onClick={onViewCases}>View All Cases <ChevronRight className="h-4 w-4" /></Button>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={["Case ID", "Title", "Status", "Risk", "Last Updated", "Action"]}
              rows={cases.slice(0, 6).map((item) => [
                <Mono key="id">{item.case_id}</Mono>,
                item.victim_name,
                <StatusBadge key="status" status={item.status} />,
                <RiskBadge key="risk" level={item.risk_level} />,
                formatDate(item.created_at || item.incident_date),
                <Button key="action" variant="ghost" onClick={() => onOpenCase(item.case_id)}>Open</Button>
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Activity Feed</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activityItems.map((item, index) => (
              <div key={item} className="flex gap-3">
                <div className="mt-0.5 grid h-8 w-8 place-items-center rounded-full bg-[#1a1a1a] text-xs font-medium text-[#fca5a5]">F</div>
                <div>
                  <p className="text-sm text-[#f5f5f5]">{item}</p>
                  <p className="mt-1 text-xs text-[#b0b0b0]">{index + 1}h ago</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Risk Distribution</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskDistribution}>
                <CartesianGrid stroke="#2d1515" vertical={false} />
                <XAxis dataKey="name" stroke="#b0b0b0" fontSize={12} />
                <YAxis stroke="#b0b0b0" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #2d1515", borderRadius: 8 }} />
                <Bar dataKey="count" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Evidence Uploads</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {(evidenceList.length ? evidenceList : []).slice(0, 6).map((item: any, index: number) => (
                <div key={`${item.file_name}-${index}`} className="flex items-center justify-between rounded-md border border-[#2d1515] bg-[#1a1a1a] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-[#b0b0b0]" />
                    <span className="text-sm text-[#f5f5f5]">{item.file_name}</span>
                  </div>
                  <span className="text-xs text-[#b0b0b0]">{item.uploaded_at ? new Date(item.uploaded_at).toLocaleString() : `${index + 2}h ago`}</span>
                </div>
              ))}
            </CardContent>
        </Card>
      </section>
    </>
  );
}

function CasesPage({
  cases,
  totalCases,
  search,
  setSearch,
  onNewCase,
  onOpenCase
}: {
  cases: CaseRecord[];
  totalCases: number;
  search: string;
  setSearch: (value: string) => void;
  onNewCase: () => void;
  onOpenCase: (caseId: string) => void;
}) {
  return (
    <>
      <PageHeader
        title="Cases"
        subtitle={`${totalCases} total investigations`}
        action={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b0b0b0]" />
              <Input className="w-64 pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cases" />
            </div>
            <select className="h-10 rounded-md border border-[#2d1515] bg-[#1a1a1a] px-3 text-sm text-[#f5f5f5] outline-none">
              <option>All statuses</option>
              <option>Open</option>
              <option>Completed</option>
              <option>High risk</option>
            </select>
            <Button onClick={onNewCase}><Plus className="h-4 w-4" /> New Case</Button>
          </>
        }
      />

      <Card>
        <CardContent className="pt-5">
          <DataTable
            columns={["Case ID", "Title", "Assigned To", "Status", "Risk", "Created", ""]}
            rows={cases.map((item) => [
              <Mono key="id">{item.case_id}</Mono>,
              item.victim_name,
              "Current investigator",
              <StatusBadge key="status" status={item.status} />,
              <RiskBadge key="risk" level={item.risk_level} />,
              formatDate(item.created_at || item.incident_date),
              <Button key="open" variant="ghost" onClick={() => onOpenCase(item.case_id)}>Open</Button>
            ])}
            onRowClick={(index) => onOpenCase(cases[index].case_id)}
          />
          <div className="mt-4 flex items-center justify-between text-sm text-[#b0b0b0]">
            <span>Showing {cases.length} investigations</span>
            <div className="flex gap-2">
              <Button variant="secondary" disabled>Previous</Button>
              <Button variant="secondary" disabled>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function CaseDetailPage({
  report,
  activeTab,
  setActiveTab,
  onBack,
  onOpenReport,
  onCaseUpdated
}: {
  report: CaseReport;
  activeTab: CaseTab;
  setActiveTab: (tab: CaseTab) => void;
  onBack: () => void;
  onOpenReport: () => void;
  onCaseUpdated: (report: CaseReport) => void;
}) {
  const timeline = report.structured_report?.timeline_analysis?.events || report.timeline || mockTimeline;
  const evidenceFiles = report.structured_report?.evidence_summary?.files || [];
  const flags = report.structured_report?.risk_assessment?.flags || report.flags || [];
  const intelligence = report.structured_report?.investigative_intelligence || report.investigative_intelligence;

  return (
    <>
      <header className="mb-6 border-b border-[#2d1515] pb-5">
        <Button variant="ghost" className="mb-4 px-0" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Back to Cases</Button>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold tracking-[-0.02em]">{report.case_id} - {report.victim_name}</h1>
              <StatusBadge status={report.status} />
              <RiskBadge level={report.risk_level} />
            </div>
            <p className="mt-2 text-sm text-[#b0b0b0]">
              Created: {formatDate(report.incident_date)} · Assigned to: Current investigator · Last update: {formatDate(report.generated_at || report.incident_date)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">Edit Case</Button>
            <Button onClick={onOpenReport}>Generate Report</Button>
            <Button variant="ghost" className="px-3"><MoreHorizontal className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <nav className="mb-6 flex overflow-x-auto border-b border-[#2d1515]">
        {caseTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "whitespace-nowrap border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-[#b0b0b0] hover:text-[#f5f5f5]",
              activeTab === tab && "border-[#dc2626] text-[#f5f5f5]"
            )}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "Overview" ? (
        <OverviewTab report={report} timelineCount={timeline.length} evidenceCount={evidenceFiles.length || 4} />
      ) : null}
      {activeTab === "Evidence" ? <EvidenceTab report={report} evidenceFiles={evidenceFiles} onCaseUpdated={onCaseUpdated} /> : null}
      {activeTab === "Timeline" ? <TimelineTab timeline={timeline} /> : null}
      {activeTab === "AI Analysis" ? <AnalysisTab report={report} intelligence={intelligence} /> : null}
      {activeTab === "Risk Engine" ? <RiskTab report={report} flags={flags} /> : null}
      {activeTab === "Reports" ? <ReportsTab report={report} onOpenReport={onOpenReport} /> : null}
    </>
  );
}

function OverviewTab({ report, evidenceCount, timelineCount }: { report: CaseReport; evidenceCount: number; timelineCount: number }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Card>
        <CardHeader><CardTitle>Case Description</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-[#b0b0b0]">
          <p>{report.summary || report.case_notes || "No case summary available yet."}</p>
          <div className="grid gap-4 md:grid-cols-2">
            <Meta label="Incident Location" value={report.incident_location} />
            <Meta label="Incident Date" value={formatDate(report.incident_date)} />
            <Meta label="Cause of Death" value={report.cause_of_death || "Pending"} />
            <Meta label="Manner" value={report.manner_of_death || "Pending"} />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4">
        <StatCard icon={Database} label="Evidence Count" value={evidenceCount} detail="Uploaded files" />
        <StatCard icon={Clock} label="Timeline Events" value={timelineCount} detail="Reconstructed events" />
        <StatCard icon={ShieldAlert} label="Risk Score" value={report.risk_score || 0} detail="0-100 scale" danger={report.risk_score >= 75} />
      </div>
      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
        <CardContent>
          <Textarea defaultValue={report.case_notes || report.summary || ""} placeholder="Add case notes" />
        </CardContent>
      </Card>
    </div>
  );
}

function EvidenceTab({ report, evidenceFiles, onCaseUpdated }: { report: CaseReport; evidenceFiles: EvidenceFile[]; onCaseUpdated: (report: CaseReport) => void }) {
  const [fileType, setFileType] = useState(evidenceTypes[0].key);
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [busy, setBusy] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    try {
      await uploadEvidence(report.case_id, fileType, file, setUploadProgress);
      try {
        await analyzeCase(report.case_id);
        await delay(300);
        onCaseUpdated(await getReport(report.case_id));
      } catch {
        onCaseUpdated(report);
      }
    } finally {
      setBusy(false);
      setFile(null);
      setUploadProgress(0);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <Card>
        <CardHeader><CardTitle>Upload Evidence</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <label className="block rounded-lg border border-dashed border-[#2d1515] bg-[#1a1a1a] p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-[#b0b0b0]" />
            <p className="mt-3 text-sm font-medium text-[#f5f5f5]">{file?.name || "Choose an evidence file"}</p>
            <p className="mt-1 text-xs text-[#b0b0b0]">Supported files depend on selected evidence type.</p>
            <input className="hidden" type="file" accept={evidenceTypes.find((item) => item.key === fileType)?.accept} onChange={(event) => setFile(event.target.files?.[0] || null)} />
          </label>
          <select className="h-10 w-full rounded-md border border-[#2d1515] bg-[#1a1a1a] px-3 text-sm text-[#f5f5f5]" value={fileType} onChange={(event) => setFileType(event.target.value)}>
            {evidenceTypes.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
          {uploadProgress > 0 ? <Progress value={uploadProgress} /> : null}
          <Button className="w-full" disabled={!file || busy} onClick={handleUpload}>{busy ? "Uploading..." : "Upload Evidence"}</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Uploaded Evidence</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(evidenceFiles.length ? evidenceFiles : [
            { file_name: "autopsy_report.pdf", file_type: "autopsy", processed: true, uploaded_at: report.incident_date },
            { file_name: "cctv_gate_2.csv", file_type: "cctv", processed: true, uploaded_at: report.incident_date },
            { file_name: "gps_export.json", file_type: "gps", processed: false, uploaded_at: report.incident_date }
          ] as EvidenceFile[]).map((item) => (
            <div key={item.file_name} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#2d1515] bg-[#1a1a1a] px-4 py-3">
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-[#b0b0b0]" />
                <div>
                  <p className="text-sm font-medium text-[#f5f5f5]">{item.file_name}</p>
                  <p className="text-xs text-[#b0b0b0]">{item.file_type} · Uploaded by current investigator · {formatDate(item.uploaded_at)}</p>
                </div>
              </div>
              <Badge tone={item.processed ? "green" : "yellow"}>{item.processed ? "Processed" : "Pending"}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineTab({ timeline }: { timeline: CaseReport["timeline"] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Case Timeline</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-4 border-l border-[#2d1515] pl-5">
          {(timeline || []).map((event, index) => (
            <div key={`${event.timestamp}-${index}`} className="relative">
              <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-[#0a0a0a] bg-[#dc2626]" />
              <div className="rounded-lg border border-[#2d1515] bg-[#1a1a1a] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={event.severity === "high" ? "red" : "blue"}>{event.source}</Badge>
                  <span className="text-xs text-[#b0b0b0]">{formatDate(event.timestamp)}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#f5f5f5]">{event.event}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AnalysisTab({ report, intelligence }: { report: CaseReport; intelligence?: CaseReport["investigative_intelligence"] }) {
  const sections = [
    { title: "Findings", body: intelligence?.crime_story || report.summary || "No AI findings generated yet." },
    { title: "Anomalies", body: (report.anomalies || report.structured_report?.correlation_analysis?.anomalies || ["No anomalies recorded."]).join(" ") },
    { title: "Entities Extracted", body: [report.victim_name, report.incident_location, report.cause_of_death].filter(Boolean).join(" · ") || "No entities extracted." },
    { title: "Confidence", body: `${report.structured_report?.investigation_summary?.confidence ?? 82}% confidence based on uploaded evidence quality.` }
  ];

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.title} className="border-l-4 border-l-[#dc2626]">
          <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
          <CardContent><p className="text-sm leading-6 text-[#b0b0b0]">{section.body}</p></CardContent>
        </Card>
      ))}
    </div>
  );
}

function RiskTab({ report, flags }: { report: CaseReport; flags: NonNullable<CaseReport["flags"]> }) {
  return (
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <Card>
        <CardHeader><CardTitle>Risk Score</CardTitle></CardHeader>
        <CardContent>
          <div className="text-5xl font-semibold tracking-[-0.02em] text-[#f5f5f5]">{report.risk_score || 0}</div>
          <p className="mt-2 text-sm text-[#b0b0b0]">Risk score on a 0-100 scale</p>
          <div className="mt-5"><Progress value={report.risk_score || 0} tone={(report.risk_score || 0) >= 75 ? "red" : "blue"} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Risk Trend</CardTitle></CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={riskTrend}>
              <CartesianGrid stroke="#2d1515" vertical={false} />
              <XAxis dataKey="day" stroke="#b0b0b0" fontSize={12} />
              <YAxis stroke="#b0b0b0" fontSize={12} />
              <Tooltip contentStyle={{ background: "#1a1a1a", border: "1px solid #2d1515", borderRadius: 8 }} />
              <Line type="monotone" dataKey="score" stroke="#dc2626" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader><CardTitle>Risk Factors</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {(flags.length ? flags : [{ name: "Evidence gap", description: "Additional evidence is needed before final scoring.", score: 40 }]).map((flag) => (
            <div key={flag.name} className="flex flex-wrap items-start justify-between gap-3 rounded-md border border-[#2d1515] bg-[#1a1a1a] px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#f5f5f5]">{flag.name}</p>
                <p className="mt-1 text-sm text-[#b0b0b0]">{flag.description}</p>
              </div>
              <RiskBadge level={flag.score >= 24 ? "HIGH" : flag.score >= 15 ? "MEDIUM" : "LOW"} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsTab({ report, onOpenReport }: { report: CaseReport; onOpenReport: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Generated Reports</CardTitle>
        <Button onClick={onOpenReport}>Generate New Report</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {["Investigation Brief", "Risk Assessment", "Evidence Summary"].map((name) => (
          <div key={name} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#2d1515] bg-[#1a1a1a] px-4 py-3">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-[#b0b0b0]" />
              <div>
                <p className="text-sm font-medium text-[#f5f5f5]">{name}</p>
                <p className="text-xs text-[#b0b0b0]">{report.case_id} · {formatDate(report.generated_at || report.incident_date)}</p>
              </div>
            </div>
            <Button variant="secondary" onClick={onOpenReport}>Open</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SettingsPage({ userName, email }: { userName: string; email: string }) {
  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your workspace preferences and account security" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Display Name"><Input defaultValue={userName} /></Field>
            <Field label="Email"><Input defaultValue={email} type="email" /></Field>
            <Button>Save Profile</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-[#b0b0b0]">
            <CheckItem label="Case status updates" />
            <CheckItem label="Evidence processing completion" />
            <CheckItem label="High risk alerts" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Security</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="New Password"><Input type="password" placeholder="Enter new password" /></Field>
            <Button variant="secondary"><Lock className="h-4 w-4" /> Update Password</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Team Management</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {["Lead investigator", "Evidence analyst", "Report reviewer"].map((role) => (
              <div key={role} className="flex items-center justify-between rounded-md border border-[#2d1515] bg-[#1a1a1a] px-4 py-3 text-sm">
                <span>{role}</span>
                <Badge tone="slate">Active</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function NewCaseDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (record: CaseRecord) => void }) {
  const [form, setForm] = useState<CaseForm>({
    title: "",
    victim_name: "",
    incident_location: "",
    incident_date: new Date().toISOString().slice(0, 10),
    notes: "",
    priority: "HIGH"
  });
  const [step, setStep] = useState<WorkflowStep>("case");
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [createdCase, setCreatedCase] = useState<CaseRecord | null>(null);
  const [createdReport, setCreatedReport] = useState<CaseReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  function resetAndClose() {
    if (busy) return;
    setStep("case");
    setFiles({});
    setUploadProgress({});
    setAnalysisProgress(0);
    setLogs([]);
    setCreatedCase(null);
    setCreatedReport(null);
    setError("");
    onClose();
  }

  function createFallbackCase(): CaseRecord {
    return {
      case_id: `CASE-${Date.now().toString().slice(-6)}`,
      victim_name: form.victim_name || form.title || "Unknown victim",
      incident_location: form.incident_location || "Unknown location",
      incident_date: form.incident_date,
      notes: form.notes,
      status: "open",
      risk_level: form.priority,
      risk_score: form.priority === "HIGH" ? 82 : form.priority === "MEDIUM" ? 58 : 28,
      created_at: new Date().toISOString()
    };
  }

  async function createCaseRecord() {
    try {
      return await createCase({
        victim_name: form.victim_name || form.title || "Unknown victim",
        incident_location: form.incident_location || "Unknown location",
        incident_date: form.incident_date,
        notes: `${form.title ? `Case Title: ${form.title}\n` : ""}${form.notes}`
      });
    } catch {
      return createFallbackCase();
    }
  }

  async function runAnalysisLogs() {
    setLogs([]);
    setAnalysisProgress(0);
    for (let index = 0; index < workflowLogs.length; index += 1) {
      await delay(420);
      setLogs((current) => [...current, workflowLogs[index]]);
      setAnalysisProgress(Math.round(((index + 1) / workflowLogs.length) * 100));
    }
  }

  async function handleWorkflowRun() {
    setBusy(true);
    setError("");
    try {
      const created = await createCaseRecord();
      setCreatedCase(created);

      for (const type of evidenceTypes) {
        const file = files[type.key];
        if (!file) continue;
        try {
          await uploadEvidence(created.case_id, type.key, file, (value) => {
            setUploadProgress((current) => ({ ...current, [type.key]: value }));
          });
        } catch {
          setUploadProgress((current) => ({ ...current, [type.key]: 100 }));
        }
      }

      setStep("analysis");
      try {
        await analyzeCase(created.case_id);
      } catch {
        // The frontend still completes the workflow if the live analyzer is unavailable.
      }
      await runAnalysisLogs();

      try {
        setCreatedReport(await getReport(created.case_id));
      } catch {
        setCreatedReport(null);
      }
      setStep("results");
    } catch (workflowError) {
      setError(workflowError instanceof Error ? workflowError.message : "Unable to complete the investigation workflow.");
    } finally {
      setBusy(false);
    }
  }

  function finishWorkflow() {
    const record = createdReport ? toCaseRecord(createdReport) : createdCase || createFallbackCase();
    onCreated(record);
    setStep("case");
    setFiles({});
    setUploadProgress({});
    setAnalysisProgress(0);
    setLogs([]);
    setCreatedCase(null);
    setCreatedReport(null);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4">
      <div className="w-full max-w-5xl rounded-xl border border-[#2d1515] bg-[#0f0a0a] p-6 shadow-elevated md:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <Badge tone="slate">Investigation Workflow</Badge>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.02em]">Create case and launch AI analysis</h2>
            <p className="mt-1 text-sm text-[#b0b0b0]">Create the record, attach evidence, run analysis, and open the generated case.</p>
          </div>
          <Button type="button" variant="ghost" onClick={resetAndClose}>Close</Button>
        </div>

        <WorkflowStepHeader step={step} />

        {step === "case" ? (
          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault();
              setStep("evidence");
            }}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Case Title"><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Operation Midnight Route" /></Field>
              <Field label="Victim Name"><Input value={form.victim_name} onChange={(event) => setForm({ ...form, victim_name: event.target.value })} placeholder="Victim name" /></Field>
              <Field label="Incident Location"><Input value={form.incident_location} onChange={(event) => setForm({ ...form, incident_location: event.target.value })} placeholder="City, scene, landmark" /></Field>
              <Field label="Incident Date"><Input type="date" value={form.incident_date} onChange={(event) => setForm({ ...form, incident_date: event.target.value })} /></Field>
              <label>
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.04em] text-[#b0b0b0]">Priority Level</span>
                <select className="h-10 w-full rounded-md border border-[#2d1515] bg-[#1a1a1a] px-3 text-sm text-[#f5f5f5]" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}>
                  <option>HIGH</option>
                  <option>MEDIUM</option>
                  <option>LOW</option>
                </select>
              </label>
              <Field label="Investigation Notes" className="md:col-span-2"><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Initial narrative, last-seen details, scene notes, witness hints..." /></Field>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={resetAndClose}>Cancel</Button>
              <Button type="submit">Next Step <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </form>
        ) : null}

        {step === "evidence" ? (
          <div className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {evidenceTypes.map((type) => (
                <label key={type.key} className="cursor-pointer rounded-lg border border-dashed border-[#2d1515] bg-[#1a1a1a] p-5 transition-colors hover:border-[#dc2626]">
                  <input
                    type="file"
                    accept={type.accept}
                    className="hidden"
                    onChange={(event) => setFiles((current) => ({ ...current, [type.key]: event.target.files?.[0] || null }))}
                  />
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-[#0f0a0a]">
                      <Upload className="h-4 w-4 text-[#b0b0b0]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#f5f5f5]">{type.label}</p>
                      <p className="mt-1 truncate text-xs text-[#b0b0b0]">{files[type.key]?.name || "Choose file"}</p>
                    </div>
                  </div>
                  <div className="mt-4"><Progress value={uploadProgress[type.key] || (files[type.key] ? 20 : 0)} /></div>
                </label>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setStep("case")}>Back</Button>
              <Button type="button" disabled={busy} onClick={handleWorkflowRun}>{busy ? "Launching AI..." : "Upload & Analyze"}</Button>
            </div>
          </div>
        ) : null}

        {step === "analysis" ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
            <div className="grid min-h-80 place-items-center rounded-lg border border-[#2d1515] bg-[#172011]">
              <div className="text-center">
                <Activity className="mx-auto h-10 w-10 text-[#fca5a5]" />
                <p className="mt-4 text-4xl font-semibold">{analysisProgress}%</p>
                <p className="mt-1 text-sm text-[#b0b0b0]">AI forensic scan</p>
              </div>
            </div>
            <Card>
              <CardHeader><CardTitle>Streaming AI Logs</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Progress value={analysisProgress} />
                {logs.map((log) => (
                  <div key={log} className="rounded-md border border-[#2d1515] bg-[#1a1a1a] px-4 py-3 text-sm text-[#f5f5f5]">
                    <span className="mr-2 text-[#dc2626]">OK</span>{log}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {step === "results" ? (
          <div className="mt-6 rounded-lg border border-[rgba(220,38,38,0.2)] bg-[rgba(220,38,38,0.08)] p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">Analysis complete</h3>
                <p className="mt-1 text-sm text-[#b0b0b0]">The case, evidence workflow, and analysis run are ready to review.</p>
              </div>
              <Button onClick={finishWorkflow}>Open Case</Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-4 rounded-md border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.12)] px-3 py-2 text-sm text-[#f87171]">{error}</p> : null}
      </div>
    </div>
  );
}

function WorkflowStepHeader({ step }: { step: WorkflowStep }) {
  const steps: Array<{ key: WorkflowStep; label: string }> = [
    { key: "case", label: "Case" },
    { key: "evidence", label: "Evidence" },
    { key: "analysis", label: "AI Analysis" },
    { key: "results", label: "Results" }
  ];
  const activeIndex = steps.findIndex((item) => item.key === step);

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-4">
      {steps.map((item, index) => (
        <div
          key={item.key}
          className={cn(
            "rounded-lg border border-[#2d1515] bg-[#1a1a1a] px-4 py-3 text-sm font-medium text-[#b0b0b0]",
            index <= activeIndex && "border-[rgba(220,38,38,0.45)] bg-[rgba(220,38,38,0.12)] text-[#f5f5f5]"
          )}
        >
          {index + 1}. {item.label}
        </div>
      ))}
    </div>
  );
}

function LoginGate({ onEmailSignIn, onEmailSignUp }: { onEmailSignIn: (email: string, password: string) => Promise<void>; onEmailSignUp: (email: string, password: string, displayName?: string) => Promise<void> }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function runAuth(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAuth(() => mode === "signup" ? onEmailSignUp(email.trim(), password, displayName) : onEmailSignIn(email.trim(), password));
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-md border border-[#2d1515] bg-[#1a1a1a]">
              <Fingerprint className="h-5 w-5 text-[#fca5a5]" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">ForensiAI</CardTitle>
              <p className="mt-1 text-sm text-[#b0b0b0]">Investigator dashboard</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-5 grid grid-cols-2 rounded-md border border-[#2d1515] bg-[#0a0a0a] p-1">
            {(["signin", "signup"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={cn("rounded px-3 py-2 text-sm font-medium text-[#b0b0b0]", mode === item && "bg-[#dc2626] text-white")}
              >
                {item === "signin" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Investigator name" /> : null}
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" autoComplete="email" required />
            <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "signup" ? "Password (min 6 characters)" : "Password"} minLength={6} autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
            {error ? <p className="rounded-md border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.12)] px-3 py-2 text-sm text-[#f87171]">{error}</p> : null}
            <Button className="w-full" disabled={busy} type="submit">
              <UserCircle2 className="h-4 w-4" />
              {busy ? "Connecting..." : mode === "signup" ? "Create Account" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function AuthLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0a0a0a] text-[#f5f5f5]">
      <div className="text-center">
        <Fingerprint className="mx-auto h-8 w-8 text-[#fca5a5]" />
        <p className="mt-4 text-sm font-medium text-[#b0b0b0]">Restoring secure session...</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, detail, danger }: { icon: typeof Briefcase; label: string; value: number; detail: string; danger?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.04em] text-[#b0b0b0]">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-[-0.02em]">{value}</p>
            <p className="mt-1 text-sm text-[#b0b0b0]">{detail}</p>
          </div>
          <div className={cn("grid h-9 w-9 place-items-center rounded-md bg-[#1a1a1a]", danger && "text-[#f87171]")}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataTable({ columns, rows, onRowClick }: { columns: string[]; rows: React.ReactNode[][]; onRowClick?: (index: number) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#2d1515]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[#1a1a1a] text-xs font-medium uppercase tracking-[0.04em] text-[#b0b0b0]">
          <tr>{columns.map((column) => <th key={column} className="px-4 py-3">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} onClick={() => onRowClick?.(rowIndex)} className={cn("border-t border-[#2a3425] bg-[#0f0a0a]", onRowClick && "cursor-pointer hover:bg-[#1a1a1a]")}>
              {row.map((cell, cellIndex) => <td key={cellIndex} className="px-4 py-3 align-middle text-[#f5f5f5]">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized.includes("complete") || normalized.includes("closed")) return <Badge tone="green">{status}</Badge>;
  if (normalized.includes("process")) return <Badge tone="yellow">{status}</Badge>;
  return <Badge tone="blue">{status || "Open"}</Badge>;
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const normalized = String(level || "LOW").toUpperCase();
  if (normalized === "HIGH") return <Badge tone="red">High Risk</Badge>;
  if (normalized === "MEDIUM") return <Badge tone="yellow">Medium</Badge>;
  return <Badge tone="green">Low</Badge>;
}

function Mono({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-xs text-[#f5f5f5]">{children}</span>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.04em] text-[#b0b0b0]">{label}</p>
      <p className="mt-1 text-sm text-[#f5f5f5]">{value}</p>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-medium uppercase tracking-[0.04em] text-[#b0b0b0]">{label}</span>
      {children}
    </label>
  );
}

function CheckItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#2d1515] bg-[#1a1a1a] px-4 py-3">
      <CheckCircle2 className="h-4 w-4 text-[#dc2626]" />
      <span>{label}</span>
    </div>
  );
}

function buildRiskDistribution(cases: CaseRecord[]) {
  const counts = { High: 0, Medium: 0, Low: 0 };
  cases.forEach((item) => {
    const risk = String(item.risk_level).toUpperCase();
    if (risk === "HIGH") counts.High += 1;
    else if (risk === "MEDIUM") counts.Medium += 1;
    else counts.Low += 1;
  });
  return Object.entries(counts).map(([name, count]) => ({ name, count }));
}

function toCaseRecord(report: CaseReport): CaseRecord {
  return {
    case_id: report.case_id,
    victim_name: report.victim_name,
    incident_location: report.incident_location,
    incident_date: report.incident_date,
    notes: report.case_notes || report.summary,
    status: report.status,
    risk_level: report.risk_level,
    risk_score: report.risk_score,
    created_at: report.generated_at || report.incident_date
  };
}

function getAuthMessage(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
  if (code.includes("auth/email-already-in-use")) return "That email already has an account. Use Sign In instead.";
  if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) return "Email or password is incorrect.";
  if (code.includes("auth/user-not-found")) return "No account exists for that email. Use Sign Up first.";
  if (code.includes("auth/argument-error") || code.includes("auth/invalid-email")) return "Enter a valid email address.";
  if (code.includes("auth/weak-password")) return "Password must be at least 6 characters.";
  if (code.includes("auth/operation-not-allowed")) return "Enable email/password sign-in in Firebase Authentication.";
  return error instanceof Error ? error.message : "Authentication failed. Please try again.";
}


