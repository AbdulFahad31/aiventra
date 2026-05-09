import re
import pdfplumber
from pathlib import Path
from typing import Dict, Any
from utils.logger import log_info, log_error


def parse_pdf(file_path: str) -> Dict[str, Any]:
    """
    Parse PDF file and extract text content
    """
    try:
        result = {
            "text": "",
            "pages": 0,
            "extracted_sections": {}
        }
        
        with pdfplumber.open(file_path) as pdf:
            result["pages"] = len(pdf.pages)
            
            # Extract text from all pages
            all_text = []
            for i, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                all_text.append(text)
                
                # Extract tables if any
                tables = page.extract_tables()
                if tables:
                    result["extracted_sections"][f"page_{i+1}_tables"] = tables
            
            result["text"] = "\n".join(all_text)
        
        log_info(f"[OK] PDF parsed: {file_path} ({result['pages']} pages)")
        return result
    
    except Exception as e:
        log_error("PDF parsing failed", e)
        return {
            "text": "",
            "pages": 0,
            "error": str(e)
        }


def extract_autopsy_data(pdf_text: str) -> Dict[str, Any]:
    """
    Extract key autopsy information from PDF text
    """
    normalized_text = _normalize_pdf_text(pdf_text)
    text_lower = normalized_text.lower()

    data = {
        "victim_name": "",
        "age": "",
        "gender": "",
        "cause_of_death": "",
        "injuries": [],
        "toxicology": [],
        "notes": normalized_text[:4000],
        "raw_text": normalized_text
    }
    
    # Simple keyword-based extraction
    lines = text_lower.split('\n')
    
    for line in lines:
        if 'cause of death' in line:
            parts = line.split(':')
            if len(parts) > 1:
                data["cause_of_death"] = parts[1].strip()
        
        if 'injury' in line or 'wound' in line or 'trauma' in line:
            data["injuries"].append(line.strip())
        
        if 'toxin' in line or 'poison' in line or 'drug' in line:
            data["toxicology"].append(line.strip())

    stab_count = _extract_stab_count(text_lower)
    if stab_count:
        data["injuries"].append(f"{stab_count} stab wounds documented")

    injury_patterns = [
        ("defensive wound", "Defensive wounds on palms/hands"),
        ("right lung", "Right lung stab wounds"),
        ("left lung", "Left lung stab wounds"),
        ("liver", "Liver stab wounds"),
        ("pancreas", "Pancreas injury"),
        ("stomach", "Stomach injury"),
        ("intestine", "Intestinal injury"),
        ("mesentery", "Mesentery injury"),
        ("rib", "Rib fractures associated with stab wounds"),
        ("blood with clots", "Internal bleeding with clots"),
        ("haemorrhage", "Fatal haemorrhage"),
        ("hemorrhage", "Fatal hemorrhage"),
        ("organ", "Internal organ trauma")
    ]
    for keyword, finding in injury_patterns:
        if keyword in text_lower:
            data["injuries"].append(finding)

    if "fatal haemorrhage" in text_lower or "fatal hemorrhage" in text_lower:
        data["cause_of_death"] = "Fatal haemorrhage due to multiple stab wounds"
    elif "multiple stab wound" in text_lower or "multiple stab wounds" in text_lower:
        data["cause_of_death"] = "Multiple stab wounds"
    elif "stab wound" in text_lower and not data["cause_of_death"]:
        data["cause_of_death"] = "Stab wound"

    if "homicidal" in text_lower or "homicide" in text_lower:
        data["manner_of_death"] = "Homicidal"
    else:
        data["manner_of_death"] = ""

    if re.search(r"\b(\d{1,3})[- ]?year[- ]old\b", text_lower):
        data["age"] = re.search(r"\b(\d{1,3})[- ]?year[- ]old\b", text_lower).group(1)

    data["injuries"] = _dedupe(data["injuries"])[:12]
    data["toxicology"] = _dedupe(data["toxicology"])[:8]
    
    return data


def _normalize_pdf_text(text: str) -> str:
    """Clean common PDF extraction artifacts while preserving line breaks."""
    text = text.replace("(cid:976)", "fi")
    text = text.replace("ﬁ", "fi").replace("ﬂ", "fl")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _extract_stab_count(text_lower: str) -> int:
    match = re.search(r"case of (?:sixty|60) stab wounds", text_lower)
    if match:
        return 60

    numeric_matches = [
        int(value)
        for value in re.findall(r"\b(\d{1,3})\s+stab wounds?\b", text_lower)
    ]
    return max(numeric_matches) if numeric_matches else 0


def _dedupe(items: list[str]) -> list[str]:
    seen = set()
    result = []
    for item in items:
        cleaned = item.strip()
        key = cleaned.lower()
        if cleaned and key not in seen:
            seen.add(key)
            result.append(cleaned)
    return result
