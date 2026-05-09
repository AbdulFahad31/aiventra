from typing import Dict, Any, Optional
from utils.logger import log_info, log_error


class TODCalculator:
    """
    Time of Death calculator using deterministic Python logic
    
    Based on:
    - Algor mortis (body temperature)
    - Rigor mortis stages
    - Ambient conditions
    """
    
    # Constants
    NORMAL_BODY_TEMP = 37.0
    COOLING_RATE_NO_EXTERNAL = 1.5  # degrees per hour (Henssge nomogram baseline)
    COOLING_RATE_WITH_EXTERNAL = 2.0
    
    RIGOR_STAGES = {
        "none": 0,
        "early": 3,
        "moderate": 8,
        "full": 12,
        "passing": 24,
        "resolved": 48
    }
    
    @staticmethod
    def calculate_algor_mortis(
        body_temp: float,
        ambient_temp: float,
        external_cooling: bool = False
    ) -> Dict[str, Any]:
        """
        Calculate TOD using body temperature (algor mortis)
        
        Formula: Time = (Normal Temp - Body Temp) / Cooling Rate
        """
        if body_temp is None or ambient_temp is None:
            return {
                "hours": 0,
                "confidence": 0,
                "method": "insufficient_data"
            }
        
        # Validate inputs
        if body_temp > 37.5 or body_temp < 10:
            return {
                "hours": 0,
                "confidence": 0,
                "method": "invalid_temperature"
            }
        
        temp_diff = TODCalculator.NORMAL_BODY_TEMP - body_temp
        cooling_rate = TODCalculator.COOLING_RATE_WITH_EXTERNAL if external_cooling else TODCalculator.COOLING_RATE_NO_EXTERNAL
        
        hours_since_death = temp_diff / cooling_rate
        
        # Temperature-based confidence
        confidence = min(100, (temp_diff / 25) * 100)  # More difference = higher confidence
        
        return {
            "hours": round(hours_since_death, 1),
            "confidence": round(confidence, 1),
            "method": "algor_mortis",
            "temp_diff": round(temp_diff, 1),
            "cooling_rate": cooling_rate
        }
    
    @staticmethod
    def calculate_rigor_mortis(rigor_stage: str) -> Dict[str, Any]:
        """
        Calculate TOD using rigor mortis stage
        """
        if rigor_stage is None or rigor_stage.lower() not in TODCalculator.RIGOR_STAGES:
            return {
                "hours": 0,
                "confidence": 0,
                "method": "insufficient_data"
            }
        
        hours = TODCalculator.RIGOR_STAGES.get(rigor_stage.lower(), 0)
        
        # Rigor is less reliable than temperature
        confidence = {
            "early": 40,
            "moderate": 60,
            "full": 70,
            "passing": 50,
            "resolved": 30
        }.get(rigor_stage.lower(), 0)
        
        return {
            "hours": hours,
            "confidence": confidence,
            "method": "rigor_mortis",
            "stage": rigor_stage
        }
    
    @staticmethod
    def estimate_tod(
        body_temperature: Optional[float] = None,
        ambient_temperature: Optional[float] = None,
        rigor_stage: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Estimate time of death using multiple methods
        Returns averaged result with confidence
        """
        results = []
        
        # Method 1: Algor mortis (temperature)
        if body_temperature and ambient_temperature:
            algor_result = TODCalculator.calculate_algor_mortis(
                body_temperature,
                ambient_temperature,
                external_cooling=False
            )
            if algor_result["confidence"] > 0:
                results.append(algor_result)
        
        # Method 2: Rigor mortis
        if rigor_stage:
            rigor_result = TODCalculator.calculate_rigor_mortis(rigor_stage)
            if rigor_result["confidence"] > 0:
                results.append(rigor_result)
        
        # Calculate average
        if results:
            avg_hours = sum(r["hours"] for r in results) / len(results)
            avg_confidence = sum(r["confidence"] for r in results) / len(results)
            primary_method = results[0]["method"]
        else:
            avg_hours = 0
            avg_confidence = 0
            primary_method = "no_data"
        
        # Generate death window
        death_window = TODCalculator.generate_death_window(avg_hours)
        
        log_info(f"[OK] TOD calculated: {avg_hours} hours ± window, confidence: {avg_confidence}%")
        
        return {
            "estimated_hours_since_death": round(avg_hours, 1),
            "confidence_score": round(avg_confidence, 1),
            "estimated_death_window": death_window,
            "methods_used": [r["method"] for r in results],
            "details": results
        }
    
    @staticmethod
    def generate_death_window(hours: float) -> str:
        """Generate human-readable death time window"""
        if hours == 0:
            return "Unknown"
        
        hours_lower = max(0, hours - 2)
        hours_upper = hours + 2
        
        if hours < 24:
            return f"{hours_lower:.0f}-{hours_upper:.0f} hours ago"
        else:
            days = hours / 24
            days_lower = hours_lower / 24
            days_upper = hours_upper / 24
            return f"{days_lower:.1f}-{days_upper:.1f} days ago"
