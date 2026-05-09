from html import escape
from typing import Any, Dict, Iterable


def render_report_html(report: Dict[str, Any]) -> str:
    """Render a readable printable HTML investigation report."""
    structured = report.get("structured_report", {})
    metadata = structured.get("metadata", {})
    case_details = structured.get("case_details", {})
    evidence = structured.get("evidence_summary", {})
    autopsy = structured.get("autopsy_findings", {})
    timeline = structured.get("timeline_analysis", {})
    correlation = structured.get("correlation_analysis", {})
    risk = structured.get("risk_assessment", {})
    summary = structured.get("investigation_summary", {})
    intelligence = structured.get("investigative_intelligence", report.get("investigative_intelligence", {}))
    limitations = structured.get("limitations", [])

    title = metadata.get("report_title", "ForensiAI Forensic Investigation Report")
    risk_level = risk.get("risk_level", report.get("risk_level", "UNKNOWN"))

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(title)} - {escape(case_details.get("case_id", report.get("case_id", "")))}</title>
  <style>
    :root {{
      color: #172033;
      background: #f5f7fb;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; padding: 32px; }}
    .report {{
      max-width: 980px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #d9e2ef;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }}
    header {{
      padding: 32px;
      border-bottom: 1px solid #d9e2ef;
      background: #eef5ff;
    }}
    h1, h2, h3, p {{ margin: 0; }}
    h1 {{ font-size: 28px; letter-spacing: 0; }}
    h2 {{
      margin-bottom: 14px;
      font-size: 18px;
      color: #0f4c81;
      border-bottom: 1px solid #d9e2ef;
      padding-bottom: 8px;
    }}
    h3 {{ font-size: 15px; margin-bottom: 8px; }}
    .subtitle {{ margin-top: 8px; color: #526173; }}
    .toolbar {{
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      max-width: 980px;
      margin: 0 auto 16px;
    }}
    button {{
      border: 1px solid #b8c7da;
      background: #ffffff;
      color: #172033;
      border-radius: 6px;
      padding: 9px 14px;
      cursor: pointer;
      font-weight: 600;
    }}
    button.primary {{ background: #1677ff; border-color: #1677ff; color: #fff; }}
    section {{ padding: 26px 32px; border-bottom: 1px solid #e6edf5; }}
    section:last-child {{ border-bottom: 0; }}
    .grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }}
    .field {{
      border: 1px solid #e1e8f0;
      border-radius: 8px;
      padding: 12px;
      background: #fbfdff;
    }}
    .label {{ font-size: 12px; color: #66758a; text-transform: uppercase; letter-spacing: .04em; }}
    .value {{ margin-top: 4px; font-weight: 650; }}
    .badge {{
      display: inline-block;
      border-radius: 999px;
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid;
    }}
    .risk-high {{ color: #991b1b; background: #fee2e2; border-color: #fecaca; }}
    .risk-medium {{ color: #92400e; background: #fef3c7; border-color: #fde68a; }}
    .risk-low {{ color: #166534; background: #dcfce7; border-color: #bbf7d0; }}
    ul {{ margin: 0; padding-left: 20px; }}
    li {{ margin: 6px 0; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
    th, td {{ text-align: left; padding: 10px; border-bottom: 1px solid #e6edf5; vertical-align: top; }}
    th {{ color: #526173; background: #f8fafc; }}
    .muted {{ color: #66758a; }}
    .score {{ font-size: 34px; font-weight: 800; }}
    @media print {{
      body {{ padding: 0; background: #fff; }}
      .toolbar {{ display: none; }}
      .report {{ border: 0; border-radius: 0; box-shadow: none; }}
      section {{ break-inside: avoid; }}
    }}
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Print / Save PDF</button>
    <button class="primary" onclick="downloadHtml()">Download HTML</button>
  </div>
  <article class="report" id="report">
    <header>
      <h1>{escape(title)}</h1>
      <p class="subtitle">Case {escape(case_details.get("case_id", report.get("case_id", "N/A")))} · Generated {escape(str(metadata.get("generated_at", report.get("generated_at", "N/A"))))}</p>
    </header>

    <section>
      <h2>Executive Summary</h2>
      <p>{escape(summary.get("summary", report.get("summary", "No summary available.")))}</p>
    </section>

    <section>
      <h2>AI Crime Story</h2>
      <p>{escape(intelligence.get("crime_story", "No crime story generated."))}</p>
    </section>

    <section>
      <h2>Case Breakthrough</h2>
      <p>{escape(intelligence.get("case_breakthrough", "No breakthrough generated."))}</p>
    </section>

    <section>
      <h2>Case Details</h2>
      <div class="grid">
        {_field("Case ID", case_details.get("case_id", report.get("case_id")))}
        {_field("Victim Name", case_details.get("victim_name", report.get("victim_name")))}
        {_field("Incident Location", case_details.get("incident_location", report.get("incident_location")))}
        {_field("Incident Date", case_details.get("incident_date", report.get("incident_date")))}
        {_field("Case Status", metadata.get("case_status", report.get("status")))}
        {_field("Case Notes", case_details.get("case_notes", report.get("case_notes")))}
      </div>
    </section>

    <section>
      <h2>Evidence Summary</h2>
      <div class="grid">
        {_field("Total Files", evidence.get("total_files", 0))}
        {_field("Processed Files", evidence.get("processed_files", 0))}
      </div>
      {_evidence_table(evidence.get("files", []))}
    </section>

    <section>
      <h2>Autopsy Findings</h2>
      <div class="grid">
        {_field("Cause of Death", autopsy.get("cause_of_death", report.get("cause_of_death")))}
        {_field("Manner of Death", autopsy.get("manner_of_death", report.get("manner_of_death", "Not determined")))}
        {_field("AI Confidence", f"{round(float(autopsy.get('confidence', 0)) * 100)}%")}
        {_field("Toxicology", ", ".join(autopsy.get("toxicology", report.get("toxicology", []))) or "No toxicology findings returned")}
      </div>
      <h3 style="margin-top:18px;">Documented Injuries</h3>
      {_list(autopsy.get("injuries", report.get("injuries", [])), "No injuries returned")}
    </section>

    <section>
      <h2>Timeline Analysis</h2>
      <h3>Interpretation</h3>
      {_list(intelligence.get("timeline_interpretation", []), "No timeline interpretation generated")}
      <h3 style="margin-top:18px;">Likely Scene Assessment</h3>
      <p>{escape(intelligence.get("likely_scene_assessment", "No scene assessment generated."))}</p>
      <h3 style="margin-top:18px;">Event Table</h3>
      {_timeline_table(timeline.get("events", report.get("timeline", [])))}
    </section>

    <section>
      <h2>Investigative Hypotheses</h2>
      {_hypothesis_table(intelligence.get("investigative_hypotheses", []))}
    </section>

    <section>
      <h2>Priority Leads</h2>
      {_list(intelligence.get("priority_leads", []), "No priority leads generated")}
    </section>

    <section>
      <h2>Risk Assessment</h2>
      <p><span class="badge {_risk_class(risk_level)}">{escape(str(risk_level))}</span></p>
      <p class="score">{escape(str(round(float(risk.get("risk_score", report.get("risk_score", 0))))))}/100</p>
      <h3>Triggered Flags</h3>
      {_flag_table(risk.get("flags", report.get("flags", [])))}
    </section>

    <section>
      <h2>Correlation Analysis</h2>
      <h3>Anomalies</h3>
      {_list(correlation.get("anomalies", report.get("anomalies", [])), "No anomalies returned")}
      <h3 style="margin-top:18px;">Suspicious Patterns</h3>
      {_list(correlation.get("suspicious_patterns", report.get("suspicious_patterns", [])), "No suspicious patterns returned")}
    </section>

    <section>
      <h2>Recommendations</h2>
      {_list(summary.get("recommendations", report.get("recommendations", [])), "No recommendations returned")}
    </section>

    <section>
      <h2>Priority Action Plan</h2>
      {_action_table(intelligence.get("action_plan", []))}
    </section>

    <section>
      <h2>Contradictions, Gaps, and Limitations</h2>
      {_list(intelligence.get("contradictions_and_gaps", limitations), "No limitations recorded")}
    </section>
  </article>
  <script>
    function downloadHtml() {{
      const blob = new Blob([document.documentElement.outerHTML], {{ type: "text/html" }});
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "{escape(case_details.get("case_id", report.get("case_id", "forensiai")))}-documented-report.html";
      link.click();
      URL.revokeObjectURL(url);
    }}
  </script>
</body>
</html>"""


def render_report_markdown(report: Dict[str, Any]) -> str:
    """Render a plain Markdown version suitable for download."""
    structured = report.get("structured_report", {})
    metadata = structured.get("metadata", {})
    case_details = structured.get("case_details", {})
    evidence = structured.get("evidence_summary", {})
    autopsy = structured.get("autopsy_findings", {})
    timeline = structured.get("timeline_analysis", {})
    correlation = structured.get("correlation_analysis", {})
    risk = structured.get("risk_assessment", {})
    summary = structured.get("investigation_summary", {})
    intelligence = structured.get("investigative_intelligence", report.get("investigative_intelligence", {}))

    lines = [
        f"# {metadata.get('report_title', 'ForensiAI Forensic Investigation Report')}",
        "",
        f"Generated: {metadata.get('generated_at', report.get('generated_at', 'N/A'))}",
        f"Case ID: {case_details.get('case_id', report.get('case_id', 'N/A'))}",
        "",
        "## Executive Summary",
        summary.get("summary", report.get("summary", "No summary available.")),
        "",
        "## AI Crime Story",
        intelligence.get("crime_story", "No crime story generated."),
        "",
        "## Case Breakthrough",
        intelligence.get("case_breakthrough", "No breakthrough generated."),
        "",
        "## Case Details",
        f"- Victim: {case_details.get('victim_name', report.get('victim_name', 'N/A'))}",
        f"- Location: {case_details.get('incident_location', report.get('incident_location', 'N/A'))}",
        f"- Incident Date: {case_details.get('incident_date', report.get('incident_date', 'N/A'))}",
        f"- Status: {metadata.get('case_status', report.get('status', 'N/A'))}",
        f"- Notes: {case_details.get('case_notes', report.get('case_notes', 'N/A'))}",
        "",
        "## Evidence Summary",
        f"- Total Files: {evidence.get('total_files', 0)}",
        f"- Processed Files: {evidence.get('processed_files', 0)}",
    ]
    lines.extend(_markdown_list([f"{item.get('file_type')}: {item.get('file_name')}" for item in evidence.get("files", [])], "No evidence files recorded"))
    lines.extend([
        "",
        "## Autopsy Findings",
        f"- Cause of Death: {autopsy.get('cause_of_death', report.get('cause_of_death', 'N/A'))}",
        f"- Manner of Death: {autopsy.get('manner_of_death', report.get('manner_of_death', 'Not determined'))}",
        f"- Confidence: {round(float(autopsy.get('confidence', 0)) * 100)}%",
        "",
        "### Injuries",
    ])
    lines.extend(_markdown_list(autopsy.get("injuries", report.get("injuries", [])), "No injuries returned"))
    lines.extend(["", "## Timeline"])
    lines.extend(_markdown_list(intelligence.get("timeline_interpretation", []), "No timeline interpretation generated"))
    lines.extend(["", f"Likely scene assessment: {intelligence.get('likely_scene_assessment', 'No scene assessment generated.')}"])
    lines.extend(_markdown_list([f"{event.get('timestamp')} [{event.get('source')}] {event.get('event')}" for event in timeline.get("events", report.get("timeline", []))], "No timeline events returned"))
    lines.extend(["", "## Investigative Hypotheses"])
    lines.extend(_markdown_list([f"{item.get('title')} ({item.get('confidence')}): {item.get('reasoning')}" for item in intelligence.get("investigative_hypotheses", [])], "No hypotheses generated"))
    lines.extend(["", "## Priority Leads"])
    lines.extend(_markdown_list(intelligence.get("priority_leads", []), "No priority leads generated"))
    lines.extend([
        "",
        "## Risk Assessment",
        f"- Risk Level: {risk.get('risk_level', report.get('risk_level', 'UNKNOWN'))}",
        f"- Risk Score: {round(float(risk.get('risk_score', report.get('risk_score', 0))))}/100",
        "",
        "### Flags",
    ])
    lines.extend(_markdown_list([f"{flag.get('name')}: {flag.get('description')} ({flag.get('score')})" for flag in risk.get("flags", report.get("flags", []))], "No risk flags returned"))
    lines.extend(["", "## Recommendations"])
    lines.extend(_markdown_list(summary.get("recommendations", report.get("recommendations", [])), "No recommendations returned"))
    lines.extend(["", "## Priority Action Plan"])
    lines.extend(_markdown_list([f"{item.get('priority')}: {item.get('task')} - {item.get('why')}" for item in intelligence.get("action_plan", [])], "No action plan generated"))
    lines.extend(["", "## Contradictions, Gaps, and Limitations"])
    lines.extend(_markdown_list(intelligence.get("contradictions_and_gaps", structured.get("limitations", [])), "No limitations recorded"))
    return "\n".join(lines) + "\n"


def _field(label: str, value: Any) -> str:
    display = "Not available" if value in (None, "") else str(value)
    return f'<div class="field"><div class="label">{escape(label)}</div><div class="value">{escape(display)}</div></div>'


def _list(items: Iterable[Any], empty: str) -> str:
    values = [str(item) for item in items if str(item).strip()]
    if not values:
        return f'<p class="muted">{escape(empty)}</p>'
    return "<ul>" + "".join(f"<li>{escape(item)}</li>" for item in values) + "</ul>"


def _evidence_table(files: list[Dict[str, Any]]) -> str:
    if not files:
        return '<p class="muted" style="margin-top:14px;">No evidence files recorded.</p>'
    rows = "".join(
        f"<tr><td>{escape(str(item.get('file_name', '')))}</td><td>{escape(str(item.get('file_type', '')))}</td><td>{escape(str(item.get('processed', False)))}</td><td>{escape(str(item.get('uploaded_at', '')))}</td></tr>"
        for item in files
    )
    return f'<table style="margin-top:16px;"><thead><tr><th>File</th><th>Type</th><th>Processed</th><th>Uploaded</th></tr></thead><tbody>{rows}</tbody></table>'


def _timeline_table(events: list[Dict[str, Any]]) -> str:
    if not events:
        return '<p class="muted">No timeline events returned.</p>'
    rows = "".join(
        f"<tr><td>{escape(str(item.get('timestamp', '')))}</td><td>{escape(str(item.get('source', '')))}</td><td>{escape(str(item.get('severity', '')))}</td><td>{escape(str(item.get('event', '')))}</td></tr>"
        for item in events
    )
    return f"<table><thead><tr><th>Timestamp</th><th>Source</th><th>Severity</th><th>Event</th></tr></thead><tbody>{rows}</tbody></table>"


def _flag_table(flags: list[Dict[str, Any]]) -> str:
    if not flags:
        return '<p class="muted">No risk flags returned.</p>'
    rows = "".join(
        f"<tr><td>{escape(str(item.get('name', '')))}</td><td>{escape(str(item.get('description', '')))}</td><td>{escape(str(item.get('score', '')))}</td></tr>"
        for item in flags
    )
    return f"<table><thead><tr><th>Flag</th><th>Description</th><th>Score</th></tr></thead><tbody>{rows}</tbody></table>"


def _hypothesis_table(items: list[Dict[str, Any]]) -> str:
    if not items:
        return '<p class="muted">No hypotheses generated.</p>'
    rows = "".join(
        f"<tr><td>{escape(str(item.get('title', '')))}</td><td>{escape(str(item.get('confidence', '')))}</td><td>{escape(str(item.get('reasoning', '')))}</td></tr>"
        for item in items
    )
    return f"<table><thead><tr><th>Hypothesis</th><th>Confidence</th><th>Reasoning</th></tr></thead><tbody>{rows}</tbody></table>"


def _action_table(items: list[Dict[str, Any]]) -> str:
    if not items:
        return '<p class="muted">No action plan generated.</p>'
    rows = "".join(
        f"<tr><td>{escape(str(item.get('priority', '')))}</td><td>{escape(str(item.get('task', '')))}</td><td>{escape(str(item.get('why', '')))}</td></tr>"
        for item in items
    )
    return f"<table><thead><tr><th>Priority</th><th>Task</th><th>Why It Matters</th></tr></thead><tbody>{rows}</tbody></table>"


def _risk_class(risk_level: Any) -> str:
    normalized = str(risk_level).lower()
    if normalized == "high":
        return "risk-high"
    if normalized == "medium":
        return "risk-medium"
    return "risk-low"


def _markdown_list(items: Iterable[Any], empty: str) -> list[str]:
    values = [str(item) for item in items if str(item).strip()]
    if not values:
        return [f"- {empty}"]
    return [f"- {item}" for item in values]
