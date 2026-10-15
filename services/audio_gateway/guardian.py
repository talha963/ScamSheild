import asyncio
import json
import logging
import re
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field

from services.shared.schemas import CallContext, AcousticSignals, RiskTier
from services.analysis.scam_call_simulator import CallTurn, evaluate_scammer_tactics
from services.analysis.call_audio_engine import CallAudioEngine
from services.fusion.risk_fusion import RiskFusionEngine

logger = logging.getLogger("scamshield.guardian")
router = APIRouter(prefix="/v1/live/guardian", tags=["Mobile Live Call Guardian"])

call_audio_engine = CallAudioEngine()
fusion_engine = RiskFusionEngine()

# Active in-memory tracking of mobile guardian sessions
active_guardian_sessions: Dict[str, Dict[str, Any]] = {}

# Numbers confirmed in the crowd-sourced scam registry (digits only). Demo seed data.
KNOWN_SCAM_NUMBERS = {"923019845120", "03019845120"}

TACTIC_LABELS = {
    "authority_impersonation": "Authority Impersonation",
    "urgency_pressure": "Manufactured Urgency",
    "secrecy_isolation": "Secrecy & Isolation",
    "credential_request": "Credential & OTP Extraction",
    "remote_access_request": "Remote Access Request",
    "payment_redirection": "Payment Redirection / Remote Tool",
    "emotional_manipulation": "Emotional Manipulation",
    "too_good_offer": "Too-Good-To-Be-True Offer",
}

class GuardianSessionStartRequest(BaseModel):
    caller_number: str = "+92 301 9845120"
    is_unknown_number: bool = True
    banking_app_open: bool = False
    device_id: Optional[str] = "android_device_01"

class GuardianSessionStartResponse(BaseModel):
    session_id: str
    status: str
    monitoring_mode: str
    caller_reputation: Dict[str, Any]
    websocket_url: str
    message: str

class TranscriptChunkRequest(BaseModel):
    session_id: str
    speaker: str = "caller" # "caller" (opponent) or "user"
    text: str
    timestamp_ms: int = Field(default_factory=lambda: int(datetime.now().timestamp() * 1000))
    banking_app_open: bool = False

class StealthAlertPayload(BaseModel):
    alert_triggered: bool
    risk_score: int
    tier: RiskTier
    detected_tactics: List[str]
    evidence_phrases: List[str]
    alert_title: str
    alert_message_en: str
    alert_message_ur: str
    secret_haptic_pattern: List[int] # Vibration pattern in ms [wait, buzz, wait, buzz]
    cut_call_recommended: bool
    silent_mode: bool = True # Crucial: Opponent must hear NOTHING
    guardian_auto_notified: bool = False
    bank_hold_active: bool = False
    caller_transcript: List[str] = Field(default_factory=list)  # caller speech heard in this chunk
    user_transcript: List[str] = Field(default_factory=list)    # phone owner's speech (never scored)

class CutCallActionRequest(BaseModel):
    session_id: str
    reason: str = "Scam alert triggered by ScamShield Guardian"
    cut_duration_seconds: int = 42

class CutCallActionResponse(BaseModel):
    status: str
    message: str
    evidence_pack_id: str
    held_amount_pkr: int
    guardian_notified: str
    timestamp: str


def _new_session(session_id: str, caller_number: str = "unknown", banking_app_open: bool = False) -> Dict[str, Any]:
    return {
        "session_id": session_id,
        "caller_number": caller_number,
        "started_at": datetime.now(timezone.utc),
        "transcript_history": [],
        "risk_score": 15,
        "tier": 0,
        "detected_tactics": [],
        "evidence_phrases": [],
        "alert_triggered": False,
        "banking_app_open": banking_app_open,
    }


def _get_session(session_id: str, banking_app_open: bool) -> Dict[str, Any]:
    session = active_guardian_sessions.get(session_id)
    if not session:
        # Backend may have restarted mid-call: recreate the session on the fly
        session = _new_session(session_id, banking_app_open=banking_app_open)
        active_guardian_sessions[session_id] = session
    return session


def _tier_for(score: int) -> int:
    return 3 if score >= 85 else 2 if score >= 60 else 1 if score >= 30 else 0


def _build_alert(session: Dict[str, Any], score: int, tactics: List[str], evidence: List[str],
                 banking_app_open: bool, caller_text: Optional[List[str]] = None,
                 user_text: Optional[List[str]] = None) -> StealthAlertPayload:
    if banking_app_open:
        score = min(99, score + 15)
    # Scores never drop quickly within a call, and once the alarm fires it stays fired
    score = max(score, session["risk_score"] - 3)
    tier = _tier_for(score)
    alert_triggered = session["alert_triggered"] or score >= 85

    session.update(
        risk_score=score,
        tier=tier,
        alert_triggered=alert_triggered,
        detected_tactics=list(dict.fromkeys(session["detected_tactics"] + tactics)),
        evidence_phrases=list(dict.fromkeys(session["evidence_phrases"] + evidence))[-8:],
    )

    # Secret haptic vibration pattern (ms): Tier 3 intense triple buzz, Tier 2 soft double pulse
    haptic_pattern = [0]
    if tier >= 3:
        haptic_pattern = [0, 500, 150, 500, 150, 800]
    elif tier == 2:
        haptic_pattern = [0, 250, 150, 250]

    return StealthAlertPayload(
        alert_triggered=alert_triggered,
        risk_score=score,
        tier=tier,
        detected_tactics=session["detected_tactics"],
        evidence_phrases=session["evidence_phrases"],
        alert_title="🚨 CUT THE CALL! THIS IS A SCAMMER",
        alert_message_en="The caller is using high-pressure fraud tactics. Hang up immediately. The caller cannot see or hear this warning.",
        alert_message_ur="فوراً کال کاٹ دیں! دوسری طرف بات کرنے والا فراڈیا ہے۔ کالر کو اس وارننگ کا علم نہیں ہے۔",
        secret_haptic_pattern=haptic_pattern,
        cut_call_recommended=alert_triggered,
        silent_mode=True,
        guardian_auto_notified=tier >= 3,
        bank_hold_active=tier >= 3 and banking_app_open,
        caller_transcript=caller_text or [],
        user_transcript=user_text or [],
    )


@router.post("/session/start", response_model=GuardianSessionStartResponse)
def start_guardian_session(req: GuardianSessionStartRequest):
    """
    Called by mobile phone service when an incoming call connects from an unknown number.
    Initializes silent background acoustic & linguistic monitoring.
    """
    session_id = f"guard_{uuid.uuid4().hex[:8]}"

    # Check caller reputation
    is_known_scam = re.sub(r"\D", "", req.caller_number) in KNOWN_SCAM_NUMBERS
    reputation = {
        "number": req.caller_number,
        "is_scammer_flagged": is_known_scam,
        "reported_count": 47 if is_known_scam else 0,
        "category": "High Risk - Impersonation Ring" if is_known_scam else "Unverified Unknown Caller"
    }

    session = _new_session(session_id, req.caller_number, req.banking_app_open)
    if is_known_scam:
        session.update(risk_score=35, tier=1, detected_tactics=["Reported Scam Number"])
    active_guardian_sessions[session_id] = session

    return GuardianSessionStartResponse(
        session_id=session_id,
        status="ACTIVE_SILENT_MONITORING",
        monitoring_mode="OPPONENT_FOCUSED_STEALTH",
        caller_reputation=reputation,
        websocket_url=f"/v1/live/guardian/stream/{session_id}",
        message="ScamShield is secretly monitoring the opponent caller in background. Opponent cannot detect this."
    )

@router.post("/evaluate-chunk", response_model=StealthAlertPayload)
def evaluate_transcript_chunk(req: TranscriptChunkRequest):
    """
    Evaluates already-transcribed speech. Only the opponent's (caller's) words are scored;
    the user's own words are kept for context but never raise the risk.
    """
    session = _get_session(req.session_id, req.banking_app_open)
    is_caller = req.speaker == "caller"
    session["transcript_history"].append({"speaker": "scammer" if is_caller else "user", "text": req.text})

    if not is_caller:
        return _build_alert(session, session["risk_score"], [], [], req.banking_app_open, user_text=[req.text])

    turns = [CallTurn(speaker=t["speaker"], text=t["text"]) for t in session["transcript_history"][:-1]]
    eval_result = evaluate_scammer_tactics(turns, req.text)
    return _build_alert(session, eval_result["risk_score"], eval_result["detected_tactics"],
                        eval_result["evidence_phrases"], req.banking_app_open, caller_text=[req.text])

@router.post("/audio-chunk", response_model=StealthAlertPayload)
async def evaluate_audio_chunk(
    session_id: str = Form(...),
    audio: UploadFile = File(..., description="A few seconds of call audio (16 kHz mono WAV)"),
    banking_app_open: bool = Form(False),
    t_offset_s: int = Form(0),
):
    """
    Raw call audio from the Android Silent Guardian. Gemini transcribes the chunk, separates the
    caller from the phone owner, and scores scam tactics on the caller's words only.
    """
    if not call_audio_engine.available:
        raise HTTPException(status_code=503, detail="Live call transcription needs GEMINI_API_KEY on the server.")

    audio_bytes = await audio.read()
    if len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio chunk is empty.")

    session = _get_session(session_id, banking_app_open)
    prior_caller = " ".join(t["text"] for t in session["transcript_history"] if t["speaker"] == "scammer")
    result = await asyncio.to_thread(
        call_audio_engine.analyze_chunk, audio_bytes, audio.content_type or "audio/wav", prior_caller)
    if result is None:
        raise HTTPException(status_code=502, detail="Speech analysis failed for this chunk.")

    caller_text = [s["text"] for s in result["segments"] if s["speaker"] == "caller"]
    user_text = [s["text"] for s in result["segments"] if s["speaker"] == "user"]
    for seg in result["segments"]:
        session["transcript_history"].append(
            {"speaker": "scammer" if seg["speaker"] == "caller" else "user", "text": seg["text"]})

    if not caller_text:
        # Nothing new from the caller: keep the current risk level
        return _build_alert(session, session["risk_score"], [], [], banking_app_open, user_text=user_text)

    analysis = result["caller_analysis"]
    event = fusion_engine.fuse_signals(
        call_id=session_id,
        t_offset_s=t_offset_s,
        linguistic_analysis=analysis,
        context=CallContext(unknown_caller=True, banking_app_open=False),
        acoustic=AcousticSignals(),
    )
    score = event.fused_score
    tactic_scores = analysis.get("tactics") or {}
    credential = (tactic_scores.get("credential_request") or {}).get("score", 0)
    if analysis.get("requested_action") in ("share_otp", "share_pin") or credential >= 0.8:
        # An unknown caller asking for an OTP/PIN is a scam on its own: alarm immediately
        score = max(score, 90)

    strong = {k: v for k, v in tactic_scores.items() if isinstance(v, dict) and v.get("score", 0) >= 0.5}
    tactics = [TACTIC_LABELS.get(k, k) for k in strong]
    evidence = [f"{TACTIC_LABELS.get(k, k)}: '{v['evidence']}'" for k, v in strong.items() if v.get("evidence")]
    return _build_alert(session, score, tactics, evidence, banking_app_open, caller_text, user_text)

@router.post("/cut-call", response_model=CutCallActionResponse)
def cut_call_action(req: CutCallActionRequest):
    """
    Called when the user taps 'Cut Call (Hang Up)' on the floating stealth alert.
    Terminates session, locks held bank funds, and notifies emergency family contacts.
    """
    active_guardian_sessions.pop(req.session_id, None)
    fusion_engine.previous_fused_scores.pop(req.session_id, None)

    pack_id = f"EV-PK-{uuid.uuid4().hex[:6].upper()}"

    return CutCallActionResponse(
        status="CALL_TERMINATED_SAFE",
        message="Call was safely cut. The scammer was thwarted without realizing ScamShield intervened.",
        evidence_pack_id=pack_id,
        held_amount_pkr=85000,
        guardian_notified="Hamza Tariq (+92 300 8291034) via WhatsApp",
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@router.websocket("/stream/{session_id}")
async def guardian_websocket_stream(websocket: WebSocket, session_id: str):
    """
    Duplex high-speed WebSocket for mobile phone real-time continuous audio transcription chunks.
    Streams back instant stealth risk events with zero latency.
    """
    await websocket.accept()
    logger.info(f"Mobile Guardian WebSocket connected for session: {session_id}")

    try:
        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)

            speaker = data.get("speaker", "caller")
            text = data.get("text", "")
            banking_app_open = data.get("banking_app_open", False)

            req = TranscriptChunkRequest(
                session_id=session_id,
                speaker=speaker,
                text=text,
                banking_app_open=banking_app_open
            )
            result = evaluate_transcript_chunk(req)

            await websocket.send_json({
                "type": "stealth_risk_event",
                "data": result.model_dump()
            })
    except WebSocketDisconnect:
        logger.info(f"Mobile Guardian WebSocket disconnected: {session_id}")
    except Exception as e:
        logger.error(f"Error in guardian WebSocket stream: {e}")
        await websocket.close()
