"""
Agent Development Kit (ADK) Multi-Agent System for ScamShield Live
Roles:
- Listener: Rolling transcript maintainer and speech analysis dispatcher
- Analyst: Multi-signal fusion, reputation lookup, forensic reasoning
- Guardian: Graduated friction ladder, circuit-breaker execution, step-up verification
- Coach: Multilingual calm behavioral whisper prompts (Urdu & English)
- Reporter: Automated incident dossier generation and threat intelligence feed
"""

import logging
from typing import Dict, Any, List
from services.shared.schemas import RiskEvent, RiskTier, CallContext, AcousticSignals
from services.analysis.gemini_engine import GeminiAnalysisEngine
from services.fusion.risk_fusion import RiskFusionEngine

logger = logging.getLogger("scamshield.agents")

class ListenerAgent:
    def __init__(self, analysis_engine: GeminiAnalysisEngine):
        self.engine = analysis_engine

    def process_transcript(self, rolling_text: str) -> Dict[str, Any]:
        """Listens to speech stream and produces structured psychological tactics."""
        return self.engine.analyze_window(rolling_text)

class AnalystAgent:
    def __init__(self, fusion_engine: RiskFusionEngine):
        self.fusion = fusion_engine

    def evaluate(
        self,
        call_id: str,
        t_offset_s: int,
        linguistic: Dict[str, Any],
        context: CallContext,
        acoustic: AcousticSignals
    ) -> RiskEvent:
        """Combines speech, acoustic, context and reputation signals into a calibrated 0-100 score."""
        return self.fusion.fuse_signals(
            call_id=call_id,
            t_offset_s=t_offset_s,
            linguistic_analysis=linguistic,
            context=context,
            acoustic=acoustic
        )

class GuardianAgent:
    def determine_interventions(self, event: RiskEvent) -> List[str]:
        """
        Applies graduated friction ladder:
        Tier 0: Silent monitoring
        Tier 1: Caution banner (soft education)
        Tier 2: 60-second cool-off hold + soft guardian alert
        Tier 3: Hard hold + guardian approval prompt
        """
        if event.tier == 3:
            return ["hold_transaction", "voice_warning_ur", "notify_guardians", "dispatch_evidence_pack"]
        elif event.tier == 2:
            return ["cool_off_hold_60s", "soft_guardian_alert", "coach_prompt"]
        elif event.tier == 1:
            return ["coach_prompt", "flag_session"]
        return ["silent_monitoring"]

class CoachAgent:
    def get_whisper_prompts(self, event: RiskEvent) -> Dict[str, str]:
        """Produces language-matched, calming whispers to break the scammer's spell."""
        return {
            "english": event.user_warning,
            "urdu": event.user_warning_ur,
            "recommended_response": "Ask: 'I will call back on your official bank helpline.' Then hang up."
        }

class ReporterAgent:
    def compile_incident_summary(self, event: RiskEvent) -> Dict[str, Any]:
        """Builds structured summary for banking audit logs and cybercrime complaints."""
        return {
            "call_id": event.call_id,
            "threat_tier": event.tier,
            "fused_score": event.fused_score,
            "scam_playbook": event.scam_type,
            "actions": event.actions,
            "forensic_reasons": event.reasons
        }
