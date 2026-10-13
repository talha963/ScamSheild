from typing import Dict, Any, List, Tuple
from services.shared.schemas import (
    CallContext,
    AcousticSignals,
    RiskTier,
    RiskEvent,
    SafeWordChallenge,
)

class RiskFusionEngine:
    def __init__(self, alpha_smoothing: float = 0.7):
        self.alpha = alpha_smoothing  # Weight for new signal
        self.previous_fused_scores: Dict[str, float] = {}

    def fuse_signals(
        self,
        call_id: str,
        t_offset_s: int,
        linguistic_analysis: Dict[str, Any],
        context: CallContext,
        acoustic: AcousticSignals,
        whitelisted_number: bool = False
    ) -> RiskEvent:
        tactics = linguistic_analysis.get("tactics", {})
        scam_type = linguistic_analysis.get("scam_type", "none")
        requested_action = linguistic_analysis.get("requested_action", "none")
        caller_org = linguistic_analysis.get("caller_claims_org")
        next_ask = linguistic_analysis.get("next_likely_ask", "")
        confidence = linguistic_analysis.get("confidence", 0.8)
        warning_en = linguistic_analysis.get("user_warning", "Stay cautious.")
        warning_ur = linguistic_analysis.get("user_warning_ur", "ہوشیار رہیں۔")

        # 1. Base linguistic risk calculation
        tactic_weights = {
            "credential_request": 38.0,
            "authority_impersonation": 22.0,
            "urgency_pressure": 18.0,
            "secrecy_isolation": 16.0,
            "emotional_manipulation": 24.0,
            "remote_access_request": 30.0,
            "payment_redirection": 25.0,
            "too_good_offer": 15.0
        }

        raw_score = 0.0
        for tactic_name, weight in tactic_weights.items():
            if tactic_name in tactics and tactics[tactic_name]:
                score_val = tactics[tactic_name].get("score", 0.0)
                raw_score += score_val * weight

        # Cap base raw score at 75
        raw_score = min(75.0, raw_score)

        # 2. Context multipliers (Call-Transaction Correlation F4)
        if context.unknown_caller:
            raw_score += 8.0

        if context.banking_app_open:
            raw_score += 12.0

        if context.new_payee:
            raw_score += 14.0

        if context.amount_vs_history > 3.0:
            raw_score += min(15.0, context.amount_vs_history * 2.0)

        # 3. Acoustic adjustments (Voice clone F7)
        if acoustic.synthetic_voice > 0.6:
            raw_score += acoustic.synthetic_voice * 25.0

        # Whitelist protection
        if whitelisted_number:
            raw_score = max(0.0, raw_score - 50.0)

        # 4. Temporal Smoothing with "Never Fall Quickly" rule
        prev_score = self.previous_fused_scores.get(call_id, 0.0)
        if raw_score >= prev_score:
            # Score rises smoothly or rapidly with new threats
            smoothed_score = (self.alpha * raw_score) + ((1 - self.alpha) * prev_score)
        else:
            # Never fall quickly rule: score decays by maximum 3 points per step
            smoothed_score = max(raw_score, prev_score - 3.0)

        # 5. HARD SAFETY RULES (Safety net floor)
        reasons: List[str] = []
        tier: RiskTier = 0

        # Rule 1: Credential OTP request + Unknown Caller + In-App Payment = Tier 3 HARD STOP
        has_credential_ask = "credential_request" in tactics and tactics["credential_request"].get("score", 0) > 0.7
        if (has_credential_ask or requested_action == "share_otp") and context.unknown_caller and context.banking_app_open:
            smoothed_score = max(88.0, smoothed_score)
            reasons.append("Hard Safety Net: Caller asked for OTP while banking app was active")

        # Determine Tier
        final_int_score = int(round(min(100.0, max(0.0, smoothed_score))))
        self.previous_fused_scores[call_id] = float(final_int_score)

        if final_int_score >= 85:
            tier = 3
        elif final_int_score >= 60:
            tier = 2
        elif final_int_score >= 30:
            tier = 1
        else:
            tier = 0

        # Build human-readable explanations
        if "authority_impersonation" in tactics:
            reasons.append(f"Impersonating authority: {caller_org or 'Banking official'}")
        if "urgency_pressure" in tactics:
            reasons.append("High urgency pressure tactics detected")
        if context.banking_app_open and context.unknown_caller:
            reasons.append("Banking app opened during active unknown call")
        if acoustic.synthetic_voice > 0.6:
            reasons.append(f"Synthetic deepfake voice signature ({(acoustic.synthetic_voice * 100):.0f}%)")

        if not reasons:
            reasons = ["Routine communication without red-flag signals"]

        # Action Ladder
        actions: List[str] = []
        if tier == 3:
            actions = ["hold_transaction", "voice_warning_ur", "notify_guardians", "dispatch_evidence_pack"]
        elif tier == 2:
            actions = ["cool_off_hold_60s", "soft_guardian_alert", "coach_prompt"]
        elif tier == 1:
            actions = ["coach_prompt", "flag_session"]
        else:
            actions = ["silent_monitoring"]

        # Safe-Word Challenge for relative in trouble
        safe_word: SafeWordChallenge = SafeWordChallenge(required=False)
        if scam_type == "relative_in_trouble" or acoustic.synthetic_voice > 0.6:
            safe_word = SafeWordChallenge(
                required=True,
                suggested_prompt="Ask for family safe-word or personal memory only the real relative knows.",
                family_safe_word="Falcon77"
            )

        return RiskEvent(
            call_id=call_id,
            t_offset_s=t_offset_s,
            tactics=tactics,
            scam_type=scam_type,
            caller_claims_org=caller_org,
            requested_action=requested_action,
            next_likely_ask=next_ask,
            confidence=confidence,
            user_warning=warning_en,
            user_warning_ur=warning_ur,
            context=context,
            acoustic=acoustic,
            fused_score=final_int_score,
            tier=tier,
            reasons=reasons,
            actions=actions,
            safe_word_challenge=safe_word
        )
