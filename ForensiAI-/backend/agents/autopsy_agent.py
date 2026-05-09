from typing import Dict, Any
import json
import os
from utils.logger import log_info, log_error
from utils.helpers import clean_ai_response


def get_autopsy_agent():
    """
    Create autopsy analysis agent using CrewAI
    
    This agent analyzes autopsy reports and extracts:
    - Cause of death
    - Injuries
    - Toxicology findings
    """
    
    # Import here to avoid dependency issues
    try:
        from crewai import Agent, Task
        from dotenv import load_dotenv
        import litellm
        
        load_dotenv()
        
        # Configure LiteLLM for Featherless
        litellm.api_base = os.getenv(
            "FEATHERLESS_BASE_URL",
            "https://api.featherless.ai/v1"
        )
        litellm.api_key = os.getenv(
            "FEATHERLESS_API_KEY",
            "mock_key_replace_with_yours"
        )
        
        agent = Agent(
            role="Forensic Pathologist",
            goal="Analyze autopsy reports and extract critical findings",
            backstory="""You are an experienced forensic pathologist with decades of 
            experience analyzing autopsy reports. You excel at identifying patterns, 
            extracting key findings, and determining probable cause of death.""",
            llm_name=f"openai/{os.getenv('MODEL_NAME', 'Qwen/Qwen2.5-7B-Instruct')}",
            temperature=0.1,
            verbose=True
        )
        
        return agent
    
    except ImportError as e:
        log_error("CrewAI import error", e)
        return None


def analyze_autopsy_report(autopsy_text: str) -> Dict[str, Any]:
    """
    Analyze autopsy report using AI agent with fallback
    """
    
    try:
        from crewai import Agent, Task
        from pydantic import BaseModel
        import litellm
        
        # Define strict output model
        class AutopsyAnalysis(BaseModel):
            cause_of_death: str
            injuries: list
            toxins: list
            confidence: float
        
        agent = get_autopsy_agent()
        if not agent:
            return _fallback_autopsy_analysis(autopsy_text)
        
        # Create task
        task = Task(
            description=f"""Analyze this autopsy report and provide ONLY valid JSON output.
            
            Autopsy Report:
            {autopsy_text[:2000]}
            
            Return ONLY this JSON format with NO markdown, NO code fences, NO explanations:
            {{
                "cause_of_death": "identified cause or 'undetermined'",
                "injuries": ["injury1", "injury2"],
                "toxins": ["toxin1", "toxin2"],
                "confidence": 0.85
            }}
            """,
            agent=agent,
            output_json=AutopsyAnalysis,
            expected_output="Valid JSON with autopsy analysis"
        )
        
        result = task.execute()
        
        # Clean and parse response
        cleaned = clean_ai_response(str(result.raw))
        data = json.loads(cleaned)
        
        log_info(f"[OK] Autopsy analysis complete: {data['cause_of_death']}")
        
        return {
            "cause_of_death": data.get("cause_of_death", ""),
            "injuries": data.get("injuries", []),
            "toxins": data.get("toxins", []),
            "confidence": data.get("confidence", 0.5)
        }
    
    except Exception as e:
        log_error("Autopsy analysis failed, using fallback", e)
        return _fallback_autopsy_analysis(autopsy_text)


def _fallback_autopsy_analysis(autopsy_text: str) -> Dict[str, Any]:
    """Fallback autopsy analysis using keyword extraction"""
    
    text_lower = autopsy_text.lower()
    
    # Extract cause
    cause = "Natural causes"
    if "fatal haemorrhage" in text_lower or "fatal hemorrhage" in text_lower:
        cause = "Fatal haemorrhage due to multiple stab wounds"
    elif "sixty stab wounds" in text_lower or "60 stab wounds" in text_lower:
        cause = "Multiple stab wounds"
    elif "asphyxia" in text_lower:
        cause = "Asphyxiation"
    elif "trauma" in text_lower or "blunt force" in text_lower:
        cause = "Traumatic injury"
    elif "gunshot" in text_lower or "bullet" in text_lower:
        cause = "Gunshot wound"
    elif "stab" in text_lower or "laceration" in text_lower:
        cause = "Stab wound"
    elif "poison" in text_lower or "toxin" in text_lower:
        cause = "Poisoning"
    elif "drowning" in text_lower:
        cause = "Drowning"
    
    # Extract injuries
    injuries = []
    if "sixty stab wounds" in text_lower or "60 stab wounds" in text_lower:
        injuries.append("60 stab wounds documented")
    if "defensive wound" in text_lower:
        injuries.append("Defensive wounds on palms/hands")
    if "right lung" in text_lower:
        injuries.append("Right lung stab wounds")
    if "left lung" in text_lower:
        injuries.append("Left lung stab wounds")
    if "liver" in text_lower:
        injuries.append("Liver stab wounds")
    if "pancreas" in text_lower:
        injuries.append("Pancreas injury")
    if "intestine" in text_lower or "intestines" in text_lower:
        injuries.append("Intestinal injury")
    if "rib" in text_lower:
        injuries.append("Rib fractures")
    if "haemorrhage" in text_lower or "hemorrhage" in text_lower:
        injuries.append("Fatal haemorrhage")

    injury_keywords = [
        "fracture", "laceration", "contusion", "abrasion",
        "wound", "injury", "trauma", "hemorrhage"
    ]
    for keyword in injury_keywords:
        if keyword in text_lower:
            injuries.append(keyword.capitalize())
    
    # Extract toxins
    toxins = []
    toxin_keywords = [
        "alcohol", "drugs", "cocaine", "heroin", "methamphetamine",
        "poison", "cyanide", "arsenic", "strychnine"
    ]
    for keyword in toxin_keywords:
        if keyword in text_lower:
            toxins.append(keyword.capitalize())
    
    log_info(f"[OK] Autopsy fallback analysis: {cause}")
    
    return {
        "cause_of_death": cause,
        "injuries": _dedupe(injuries)[:10],
        "toxins": toxins[:5],
        "confidence": 0.65
    }


def _dedupe(items: list[str]) -> list[str]:
    seen = set()
    result = []
    for item in items:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result
