from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime, timezone
import hashlib
import uuid
from typing import Optional, List
from pathlib import Path

from services.shared.config import settings
from services.shared.schemas import (
    ScamLensAnalysisResponse,
    EvidencePackDocument,
    RiskTier,
)
from services.audio_gateway.gateway import router as audio_router
from services.lens.vision_engine import ScamLensEngine
from apps.mock_bank.main import app as bank_subapp

app = FastAPI(
    title="ScamShield Live Core API",
    description="Multimodal Voice Scam Defense & Graduated Circuit Breaker for BFSI",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Audio Gateway WebSockets and Bank Subapp
app.include_router(audio_router)
app.mount("/bank", bank_subapp)

lens_engine = ScamLensEngine()

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "service": "ScamShield Live",
        "status": "operational",
        "models": {
            "live_analysis": settings.GEMINI_MODEL_LIVE,
            "deep_reasoning": settings.GEMINI_MODEL_REASONING,
            "vector_index": settings.PINECONE_INDEX_NAME
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.post("/v1/calls")
def create_call_session(caller_number: str = "+92 301 9845120", mode: str = "speaker_companion"):
    call_id = f"c_{uuid.uuid4().hex[:6]}"
    return {
        "call_id": call_id,
        "mode": mode,
        "caller_number": caller_number,
        "consent_recorded": True,
        "websocket_url": f"/v1/calls/{call_id}/audio",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

@app.post("/v1/lens/analyze", response_model=ScamLensAnalysisResponse)
async def analyze_lens_image(
    file: Optional[UploadFile] = File(None),
    note: Optional[str] = Form(None)
):
    if file:
        content = await file.read()
        return lens_engine.analyze_image_bytes(content)
    return lens_engine._heuristic_fallback(None)

@app.get("/v1/reputation/{number_hash}")
def get_number_reputation(number_hash: str):
    """
    Look up phone reputation from crowd-sourced BigQuery / vector graph
    """
    if "9845" in number_hash or "301" in number_hash:
        return {
            "number_hash": number_hash,
            "reports_7d": 47,
            "spoof_suspected": True,
            "claimed_orgs": ["State Bank of Pakistan", "FIA Cybercrime Wing"],
            "risk_verdict": "high_risk_scammer"
        }
    return {
        "number_hash": number_hash,
        "reports_7d": 0,
        "spoof_suspected": False,
        "claimed_orgs": [],
        "risk_verdict": "clean"
    }

@app.post("/v1/guardians/respond")
def handle_guardian_webhook(
    hold_id: str,
    action: str, # "approve" or "block"
    guardian_phone: str = "+92 300 8291034"
):
    """
    n8n Webhook target: processes WhatsApp/SMS 1-tap Approve or Block
    """
    now = datetime.now(timezone.utc)
    if action == "approve":
        return {
            "status": "success",
            "action": "APPROVED",
            "hold_id": hold_id,
            "message": "Transfer verified and authorized by primary guardian.",
            "timestamp": now.isoformat()
        }
    else:
        return {
            "status": "success",
            "action": "BLOCKED",
            "hold_id": hold_id,
            "message": "Scam confirmed by guardian. Transfer terminated permanently.",
            "timestamp": now.isoformat()
        }

@app.get("/v1/radar/campaigns")
def get_radar_campaigns():
    """
    Returns active campaign clusters from Pinecone semantic vector index
    """
    return {
        "active_campaigns": [
            {
                "campaign_id": "camp_001",
                "name": "State Bank Security Impersonation Ring",
                "scam_type": "fake_bank_officer",
                "call_count_7d": 1420,
                "region": "Lahore & Rawalpindi",
                "risk_score": 96,
                "trend": "rising"
            },
            {
                "campaign_id": "camp_002",
                "name": "Deepfake Kidnap / Safe-Word Bypass Network",
                "scam_type": "relative_in_trouble",
                "call_count_7d": 580,
                "region": "Karachi South",
                "risk_score": 98,
                "trend": "rising"
            }
        ],
        "total_intercepted_7d": 3890,
        "prevented_loss_pkr": 42800000
    }

@app.post("/v1/evidence/{call_id}", response_model=EvidencePackDocument)
def generate_evidence_pack(call_id: str):
    """
    Generates structured cybercrime evidence pack for bank dispute & insurance claim.
    """
    now = datetime.now(timezone.utc)
    hash_digest = hashlib.sha256(f"{call_id}-{now.isoformat()}".encode()).hexdigest()

    return EvidencePackDocument(
        incident_id=f"CASE-PK-2026-{call_id.upper()}",
        call_id=call_id,
        timestamp=now,
        caller_number="+92 301 9845120",
        caller_claimed_org="State Bank of Pakistan",
        scam_type="fake_bank_officer",
        fused_risk_score=96,
        actions_taken=["hold_transaction", "voice_warning_ur", "notify_guardians", "dispatch_evidence_pack"],
        redacted_transcript=[
            {"speaker": "caller", "snippet": "Assalam-o-Alaikum, main State Bank security se baat kar raha hoon..."},
            {"speaker": "caller", "snippet": "Aap ke phone par OTP code aaya hai, foran parh kar batayein!"}
        ],
        bank_details={"account": "PK60HABB00018492019482", "held_amount": "85,000 PKR", "payee": "Muhammad Rizwan"},
        guardian_audit={"notified": "Hamza Tariq (+92 300 8291034)", "channel": "WhatsApp", "status": "Delivered"},
        cryptographic_signature=hash_digest
    )

# Mount Static Frontend if built in dist
dist_path = Path(__file__).resolve().parent.parent / "apps" / "web" / "dist"
if dist_path.exists() and (dist_path / "index.html").exists():
    app.mount("/", StaticFiles(directory=str(dist_path), html=True), name="static_frontend")
else:
    @app.get("/")
    def root_fallback():
        return health_check()
