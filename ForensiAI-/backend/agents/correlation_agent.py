from typing import Dict, Any, List
import json
import os
from utils.logger import log_info, log_error
from utils.helpers import clean_ai_response


def analyze_correlations(evidence_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyze correlations between different evidence sources
    Identify suspicious patterns and anomalies
    """
    
    try:
        from crewai import Agent, Task
        from pydantic import BaseModel
        import litellm
        
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
        
        class CorrelationAnalysis(BaseModel):
            anomalies: list
            suspicious_patterns: list
            confidence: float
        
        agent = Agent(
            role="Evidence Correlation Specialist",
            goal="Identify suspicious patterns and correlations in evidence",
            backstory="""You are an expert at correlating multiple evidence sources,
            identifying gaps, and detecting suspicious patterns.""",
            llm_name=f"openai/{os.getenv('MODEL_NAME', 'Qwen/Qwen2.5-7B-Instruct')}",
            temperature=0.1,
            verbose=True
        )
        
        evidence_summary = json.dumps(evidence_data, indent=2)[:2000]
        
        task = Task(
            description=f"""Analyze this evidence data for correlations and anomalies.
            
            Evidence Data:
            {evidence_summary}
            
            Return ONLY this JSON format with NO markdown, NO code fences:
            {{
                "anomalies": ["anomaly1", "anomaly2"],
                "suspicious_patterns": ["pattern1", "pattern2"],
                "confidence": 0.80
            }}
            """,
            agent=agent,
            output_json=CorrelationAnalysis,
            expected_output="Valid JSON with correlation analysis"
        )
        
        result = task.execute()
        
        cleaned = clean_ai_response(str(result.raw))
        data = json.loads(cleaned)
        
        log_info(f"[OK] Correlation analysis complete: {len(data.get('anomalies', []))} anomalies")
        
        return {
            "anomalies": data.get("anomalies", []),
            "suspicious_patterns": data.get("suspicious_patterns", []),
            "confidence": data.get("confidence", 0.5)
        }
    
    except Exception as e:
        log_error("Correlation analysis failed, using fallback", e)
        return _fallback_correlation_analysis(evidence_data)


def _fallback_correlation_analysis(evidence_data: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback correlation analysis"""
    
    anomalies = []
    patterns = []
    
    # Check for timeline gaps
    events = evidence_data.get("events", [])
    if len(events) < 3:
        anomalies.append("Limited timeline data for correlation")
    
    # Check for CCTV issues
    cctv_events = [e for e in events if e.get("source") == "cctv"]
    if len(cctv_events) == 0:
        anomalies.append("No CCTV data available")
    
    # Check for GPS gaps
    gps_events = [e for e in events if e.get("source") == "gps"]
    if len(gps_events) == 0:
        anomalies.append("No GPS tracking data")
    
    # Detect patterns
    high_severity_events = [e for e in events if e.get("severity") == "high"]
    if len(high_severity_events) > 2:
        patterns.append("Multiple high-severity events detected")
    
    if any("blackout" in e.get("event", "").lower() for e in events):
        patterns.append("System blackout or signal loss detected")
    
    log_info(f"[OK] Correlation fallback: {len(anomalies)} anomalies, {len(patterns)} patterns")
    
    return {
        "anomalies": anomalies,
        "suspicious_patterns": patterns,
        "confidence": 0.60
    }


# Import at module level to handle optional dependency
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        pass
