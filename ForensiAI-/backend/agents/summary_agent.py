from typing import Dict, Any, List
import json
import os
from utils.logger import log_info, log_error
from utils.helpers import clean_ai_response


def generate_investigation_summary(case_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate executive summary and recommendations
    """
    
    try:
        from crewai import Agent, Task
        from pydantic import BaseModel
        import litellm
        from dotenv import load_dotenv
        
        load_dotenv()
        
        # Configure LiteLLM
        litellm.api_base = os.getenv(
            "FEATHERLESS_BASE_URL",
            "https://api.featherless.ai/v1"
        )
        litellm.api_key = os.getenv(
            "FEATHERLESS_API_KEY",
            "mock_key_replace_with_yours"
        )
        
        class StoryBeat(BaseModel):
            title: str
            description: str
            phase: str
            timestamp_guess: str
            connected_evidence: str

        class InvestigationSummary(BaseModel):
            summary: str
            crime_story: str
            story_beats: list[StoryBeat]
            recommendations: list
            confidence: float
        
        agent = Agent(
            role="Investigation Supervisor",
            goal="Generate investigation summary and recommendations",
            backstory="""You are a senior investigation supervisor with expertise in
            synthesizing complex evidence into actionable intelligence.""",
            llm_name=f"openai/{os.getenv('MODEL_NAME', 'Qwen/Qwen2.5-7B-Instruct')}",
            temperature=0.1,
            verbose=True
        )
        
        case_summary = json.dumps({
            "cause_of_death": case_data.get("cause_of_death", ""),
            "injuries": case_data.get("injuries", []),
            "timeline_events": [e.get("event") for e in case_data.get("events", [])][:15],
            "anomalies": case_data.get("anomalies", [])[:5],
            "risk_level": case_data.get("risk_level", "")
        }, indent=2)
        
        task = Task(
            description=f"""Based on this investigation data, provide an executive summary, a rich crime story narrative, and recommendations.
            
            Investigation Data:
            {case_summary}
            
            Return ONLY this JSON with NO markdown, NO code fences:
            {{
                "summary": "Brief executive investigation summary (1-2 sentences)",
                "crime_story": "A dramatic, realistic 2-paragraph narrative reconstructing the events of the crime like a true crime detective story based on the timeline and anomalies.",
                "story_beats": [
                    {{"title": "Victim entered industrial compound", "description": "...", "phase": "normal", "timestamp_guess": "...", "connected_evidence": "..."}},
                    {{"title": "Suspicious vehicle observed near rear entrance", "description": "...", "phase": "suspicious", "timestamp_guess": "...", "connected_evidence": "..."}},
                    {{"title": "Violent assault likely occurred", "description": "...", "phase": "critical", "timestamp_guess": "...", "connected_evidence": "..."}}
                ],
                "recommendations": ["recommendation1", "recommendation2"],
                "confidence": 0.85
            }}
            
            RULES for story_beats:
            1. You MUST output 4-8 comprehensive, deeply detailed story beats.
            2. Each beat must have a phase: "normal", "suspicious", or "critical".
            3. EXACTLY ONE beat MUST be "critical". This is the climax incident.
            4. Do NOT use technical labels like "GPS Event". Use narrative language like "Victim movement abruptly stopped".
            5. Ensure the description contains deep, insightful forensic reasoning rather than just simple statements.
            """,
            agent=agent,
            output_json=InvestigationSummary,
            expected_output="Valid JSON with summary and recommendations"
        )
        
        result = task.execute()
        
        cleaned = clean_ai_response(str(result.raw))
        data = json.loads(cleaned)
        
        log_info(f"[OK] Investigation summary generated")
        
        return {
            "summary": data.get("summary", "Investigation ongoing"),
            "crime_story": data.get("crime_story", ""),
            "story_beats": data.get("story_beats", []),
            "recommendations": data.get("recommendations", []),
            "confidence": data.get("confidence", 0.5)
        }
    
    except Exception as e:
        log_error("Summary generation failed, using fallback", e)
        return _fallback_summary_generation(case_data)


def _fallback_summary_generation(case_data: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback summary generation"""
    
    cause = case_data.get("cause_of_death", "undetermined")
    risk_level = case_data.get("risk_level", "UNKNOWN")
    injuries = case_data.get("injuries", [])
    events = case_data.get("events", [])
    anomalies = case_data.get("anomalies", [])
    timeline_count = len(events)
    
    injury_summary = ", ".join(injuries[:5]) if injuries else "no structured injury findings"
    anomaly_summary = ", ".join(anomalies[:3]) if anomalies else "no cross-source anomalies beyond available evidence limits"

    summary = (
        f"The forensic review identifies {cause} as the primary medical finding. "
        f"Key autopsy indicators include {injury_summary}. "
        f"The case is classified as {risk_level} risk based on injury severity, case notes, and available evidence correlation. "
        f"The reconstructed timeline currently contains {timeline_count} event(s); correlation review notes {anomaly_summary}. "
        "These findings should be treated as investigative intelligence and validated against original evidence, scene documentation, and witness statements."
    )
    
    recommendations = []
    
    if risk_level == "HIGH":
        recommendations.extend([
            "Escalate to priority investigation team",
            "Request additional forensic analysis",
            "Conduct extended witness interviews",
            "Preserve and re-check all original evidence media",
            "Correlate autopsy injury pattern with scene photographs and weapon characteristics"
        ])
    elif risk_level == "MEDIUM":
        recommendations.extend([
            "Continue standard investigation protocols",
            "Review timeline for inconsistencies",
            "Request specialist pathology review",
            "Collect missing CCTV, GPS, or metadata evidence where available"
        ])
    else:
        recommendations.extend([
            "Proceed with standard investigation procedures",
            "Collect additional evidence if new inconsistencies emerge"
        ])
    
    recommendations.extend([
        "Document all findings for prosecution support",
        "Record limitations caused by missing evidence sources"
    ])
    
    log_info(f"[OK] Summary fallback generated with {len(recommendations)} recommendations")
    
    return {
        "summary": summary,
        "crime_story": summary,
        "story_beats": [],
        "recommendations": recommendations,
        "confidence": 0.65
    }
