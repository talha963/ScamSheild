from typing import List, Optional, Dict, Literal
from pydantic import BaseModel, Field
from datetime import datetime

# Risk Tiers:
# Tier 0 (0-29): Silent Monitoring / Safe
# Tier 1 (30-59): Soft Caution Banner ("Banks never ask for your OTP")
# Tier 2 (60-84): Full-screen Warning + Spoken Urdu Alert + 60s Cool-Off Hold
# Tier 3 (85-100): Hard Stop / Hold Paused + Guardian Circle Alert
RiskTier = Literal[0, 1, 2, 3]

ScamPlaybook = Literal[
    "fake_bank_officer",
    "wallet_reversal",
    "prize_offer",
    "relative_in_trouble",
    "courier_customs_police",
    "sim_block",
    "investment",
    "none",
    "uncertain"
]

RequestedAction = Literal[
    "share_otp",
    "share_pin",
    "send_money",
    "install_app",
    "click_link",
    "none",
    "uncertain"
]

class TacticSignal(BaseModel):
    score: float = Field(ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    evidence: str = Field(max_length=200, description="Short quoted evidence phrase, max 8-15 words")

class TacticScores(BaseModel):
    authority_impersonation: Optional[TacticSignal] = None
    urgency_pressure: Optional[TacticSignal] = None
    secrecy_isolation: Optional[TacticSignal] = None
    credential_request: Optional[TacticSignal] = None
    remote_access_request: Optional[TacticSignal] = None
    payment_redirection: Optional[TacticSignal] = None
    emotional_manipulation: Optional[TacticSignal] = None
    too_good_offer: Optional[TacticSignal] = None

class CallContext(BaseModel):
    unknown_caller: bool = True
    banking_app_open: bool = False
    new_payee: bool = False
    amount_vs_history: float = Field(default=1.0, description="Multiplier relative to customer average transfer")
    device_or_sim_changed: bool = False

class AcousticSignals(BaseModel):
    synthetic_voice: float = Field(default=0.0, ge=0.0, le=1.0, description="Synthetic or deepfake voice likelihood")
    call_center_noise: float = Field(default=0.0, ge=0.0, le=1.0, description="Call center background acoustic pattern")
    pressure_tempo: float = Field(default=0.0, ge=0.0, le=1.0, description="Speech rate, interruptions, panic tempo")

class SafeWordChallenge(BaseModel):
    required: bool = False
    suggested_prompt: str = ""
    family_safe_word: Optional[str] = None

class RiskEvent(BaseModel):
    call_id: str
    t_offset_s: int = Field(ge=0, description="Seconds into call")
    tactics: TacticScores
    scam_type: ScamPlaybook = "none"
    caller_claims_org: Optional[str] = None
    requested_action: RequestedAction = "none"
    next_likely_ask: str = ""
    confidence: float = Field(ge=0.0, le=1.0)
    user_warning: str = Field(description="Calm warning sentence in English")
    user_warning_ur: str = Field(description="Calm warning in Urdu script")
    context: CallContext
    acoustic: AcousticSignals
    fused_score: int = Field(ge=0, le=100)
    tier: RiskTier = 0
    reasons: List[str] = Field(default_factory=list)
    actions: List[str] = Field(default_factory=list)
    safe_word_challenge: Optional[SafeWordChallenge] = None

# Banking SDK schemas
class BankAccount(BaseModel):
    account_id: str
    account_number: str
    holder_name: str
    balance: float
    currency: str = "PKR"

class BankHoldRequest(BaseModel):
    call_id: str
    account_id: str
    payee_account: str
    amount: float
    tier: RiskTier
    reason: str

class BankHoldResponse(BaseModel):
    hold_id: str
    status: Literal["held", "released", "blocked", "step_up_pending"]
    amount: float
    created_at: datetime
    message: str

class BankStepUpRequest(BaseModel):
    hold_id: str
    verification_method: Literal["guardian_approval", "callback_verified", "branch_override"]
    authorized_by: str
    comments: Optional[str] = None

class BankPayeeRiskResponse(BaseModel):
    payee_account: str
    is_new: bool
    risk_level: Literal["low", "medium", "high", "mule_suspect"]
    historical_fraud_reports: int

class FraudCaseReport(BaseModel):
    case_id: str
    call_id: str
    account_id: str
    loss_prevented: float
    scam_type: str
    status: str
    created_at: datetime

# Scam Lens schemas
class ScamLensAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None
    context_note: Optional[str] = None

class ScamLensAnalysisResponse(BaseModel):
    verdict: Literal["safe", "suspicious", "scam"]
    confidence: float
    detected_text: str
    extracted_links: List[str]
    tampering_detected: bool
    spoofed_brand: Optional[str]
    reasons: List[str]
    qr_destination: Optional[str] = None

# Evidence Pack schema
class EvidencePackDocument(BaseModel):
    incident_id: str
    call_id: str
    timestamp: datetime
    caller_number: str
    caller_claimed_org: Optional[str]
    scam_type: ScamPlaybook
    fused_risk_score: int
    actions_taken: List[str]
    redacted_transcript: List[Dict[str, str]]
    bank_details: Dict[str, str]
    guardian_audit: Dict[str, str]
    cryptographic_signature: str
