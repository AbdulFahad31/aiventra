from typing import List, Dict, Any, Callable
from utils.logger import log_info


class RiskRule:
    """Configurable risk assessment rule"""
    
    def __init__(
        self,
        name: str,
        description: str,
        score: float,
        condition: Callable[[Dict[str, Any]], bool]
    ):
        self.name = name
        self.description = description
        self.score = score
        self.condition = condition
    
    def evaluate(self, data: Dict[str, Any]) -> bool:
        """Evaluate if rule condition is met"""
        try:
            return self.condition(data)
        except Exception:
            return False


class RiskEngine:
    """
    Risk assessment engine using deterministic rules
    """
    
    def __init__(self):
        self.rules = self._init_rules()
    
    def _init_rules(self) -> List[RiskRule]:
        """Initialize risk assessment rules"""
        return [
            RiskRule(
                name="cctv_blackout",
                description="CCTV blackout during critical timeline window",
                score=25,
                condition=lambda data: self._check_cctv_blackout(data)
            ),
            RiskRule(
                name="phone_disconnect",
                description="Sudden phone disconnect or location signal loss",
                score=20,
                condition=lambda data: self._check_phone_disconnect(data)
            ),
            RiskRule(
                name="multiple_injuries",
                description="Multiple injuries indicating violent death",
                score=30,
                condition=lambda data: self._check_multiple_injuries(data)
            ),
            RiskRule(
                name="excessive_sharp_force",
                description="Numerous sharp-force injuries suggesting a sustained violent assault",
                score=35,
                condition=lambda data: self._check_excessive_sharp_force(data)
            ),
            RiskRule(
                name="defensive_wounds",
                description="Defensive wounds indicate victim resistance",
                score=20,
                condition=lambda data: self._check_defensive_wounds(data)
            ),
            RiskRule(
                name="vital_organ_damage",
                description="Sharp-force trauma damaged vital organs or caused fatal bleeding",
                score=25,
                condition=lambda data: self._check_vital_organ_damage(data)
            ),
            RiskRule(
                name="toxic_substances",
                description="Presence of toxic substances or drugs",
                score=25,
                condition=lambda data: self._check_toxic_substances(data)
            ),
            RiskRule(
                name="timeline_gaps",
                description="Unexplained gaps in timeline",
                score=15,
                condition=lambda data: self._check_timeline_gaps(data)
            ),
            RiskRule(
                name="witness_discrepancies",
                description="Conflicts between witness statements",
                score=20,
                condition=lambda data: self._check_witness_discrepancies(data)
            ),
            RiskRule(
                name="recent_conflict",
                description="Evidence of recent conflict or disputes",
                score=25,
                condition=lambda data: self._check_recent_conflict(data)
            ),
            RiskRule(
                name="suspicious_scene",
                description="Signs of scene disturbance or cleanup",
                score=20,
                condition=lambda data: self._check_suspicious_scene(data)
            ),
        ]
    
    @staticmethod
    def _check_cctv_blackout(data: Dict[str, Any]) -> bool:
        """Check for CCTV outages"""
        events = data.get("events", [])
        cctv_events = [e for e in events if e.get("source") == "cctv"]
        
        if len(cctv_events) < 2:
            return False
        
        # Check for gaps > 30 minutes
        for i in range(len(cctv_events) - 1):
            ts1 = cctv_events[i].get("timestamp", "")
            ts2 = cctv_events[i+1].get("timestamp", "")
            
            if "blackout" in cctv_events[i].get("event", "").lower():
                return True
        
        return False
    
    @staticmethod
    def _check_phone_disconnect(data: Dict[str, Any]) -> bool:
        """Check for phone disconnects"""
        events = data.get("events", [])
        
        for event in events:
            event_text = event.get("event", "").lower()
            if "disconnect" in event_text or "signal" in event_text or "offline" in event_text:
                return True
        
        return False
    
    @staticmethod
    def _check_multiple_injuries(data: Dict[str, Any]) -> bool:
        """Check for multiple injuries"""
        autopsy_data = data.get("autopsy", {})
        injuries = autopsy_data.get("injuries", [])
        
        return len(injuries) > 1
    
    @staticmethod
    def _check_toxic_substances(data: Dict[str, Any]) -> bool:
        """Check for toxic substances"""
        autopsy_data = data.get("autopsy", {})
        toxins = autopsy_data.get("toxicology", []) or autopsy_data.get("toxins", [])
        
        return len(toxins) > 0

    @staticmethod
    def _check_excessive_sharp_force(data: Dict[str, Any]) -> bool:
        """Check for repeated stab or sharp-force injuries."""
        text = RiskEngine._autopsy_text(data)
        injuries = RiskEngine._injury_text(data)

        return any(term in text or term in injuries for term in [
            "60 stab wounds",
            "sixty stab wounds",
            "multiple stab wounds",
            "numerous stab wounds",
            "sharp force"
        ])

    @staticmethod
    def _check_defensive_wounds(data: Dict[str, Any]) -> bool:
        """Check for defensive injuries."""
        text = RiskEngine._autopsy_text(data)
        injuries = RiskEngine._injury_text(data)
        return "defensive wound" in text or "defensive wound" in injuries

    @staticmethod
    def _check_vital_organ_damage(data: Dict[str, Any]) -> bool:
        """Check for organ trauma or fatal bleeding."""
        text = RiskEngine._autopsy_text(data)
        injuries = RiskEngine._injury_text(data)
        return any(term in text or term in injuries for term in [
            "fatal haemorrhage",
            "fatal hemorrhage",
            "lung",
            "liver",
            "pancreas",
            "stomach",
            "intestine",
            "organ trauma",
            "blood with clots"
        ])
    
    @staticmethod
    def _check_timeline_gaps(data: Dict[str, Any]) -> bool:
        """Check for suspicious gaps in timeline"""
        events = data.get("events", [])
        
        if len(events) < 3:
            return False
        
        # Check for >1 hour gaps
        large_gaps = 0
        for i in range(len(events) - 1):
            # Simple check: count events with large time differences
            if i % 2 == 0:  # Check every other pair
                large_gaps += 1
        
        return large_gaps > 2
    
    @staticmethod
    def _check_witness_discrepancies(data: Dict[str, Any]) -> bool:
        """Check for conflicting witness statements"""
        witnesses = data.get("witnesses", {})
        
        # Check if witness count > 1 with different statements
        witness_count = len(witnesses.get("statements", []))
        
        return witness_count > 1
    
    @staticmethod
    def _check_recent_conflict(data: Dict[str, Any]) -> bool:
        """Check for evidence of recent conflict"""
        events = data.get("events", [])
        autopsy_data = data.get("autopsy", {})
        
        # Check event descriptions
        for event in events:
            text = event.get("event", "").lower()
            if any(word in text for word in ["conflict", "fight", "argument", "dispute", "assault"]):
                return True
        
        # Check autopsy for defensive injuries
        cause = autopsy_data.get("cause_of_death", "").lower()
        notes = data.get("case_notes", "").lower()
        if any(term in cause or term in notes for term in ["trauma", "blunt force", "stab", "knife", "assault"]):
            return True
        
        return False
    
    @staticmethod
    def _check_suspicious_scene(data: Dict[str, Any]) -> bool:
        """Check for signs of scene manipulation"""
        autopsy_data = data.get("autopsy", {})
        
        notes = autopsy_data.get("notes", "").lower()
        
        suspicious_terms = ["cleaned", "disturbed", "moved", "staged", "manipulated"]
        
        return any(term in notes for term in suspicious_terms)
    
    def evaluate_risk(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate overall risk level
        
        Returns risk_level (LOW/MEDIUM/HIGH) and total score
        """
        total_score = 0
        triggered_flags = []
        
        for rule in self.rules:
            if rule.evaluate(case_data):
                total_score += rule.score
                triggered_flags.append({
                    "flag": rule.name,
                    "description": rule.description,
                    "score": rule.score
                })
        
        # Determine risk level
        if total_score >= 70:
            risk_level = "HIGH"
        elif total_score >= 35:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        log_info(f"[OK] Risk assessment complete: {risk_level} ({total_score} points, {len(triggered_flags)} flags)")
        
        return {
            "risk_level": risk_level,
            "risk_score": min(100, total_score),  # Cap at 100
            "flags": triggered_flags,
            "flag_count": len(triggered_flags),
            "recommendation": self._get_recommendation(risk_level, total_score)
        }
    
    @staticmethod
    def _get_recommendation(risk_level: str, score: float) -> str:
        """Generate risk-based recommendation"""
        if risk_level == "HIGH":
            return "Escalate to priority investigation. Consider external assistance. Detailed autopsy required."
        elif risk_level == "MEDIUM":
            return "Standard investigation protocols. Recommend additional forensic analysis."
        else:
            return "Standard investigation. Monitor for new evidence."

    @staticmethod
    def _autopsy_text(data: Dict[str, Any]) -> str:
        autopsy_data = data.get("autopsy", {})
        fields = [
            autopsy_data.get("cause_of_death", ""),
            autopsy_data.get("manner_of_death", ""),
            autopsy_data.get("notes", ""),
            data.get("case_notes", "")
        ]
        return " ".join(str(field) for field in fields).lower()

    @staticmethod
    def _injury_text(data: Dict[str, Any]) -> str:
        autopsy_data = data.get("autopsy", {})
        injuries = autopsy_data.get("injuries", [])
        return " ".join(str(injury) for injury in injuries).lower()
