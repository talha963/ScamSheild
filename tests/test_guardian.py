"""Tests for the mobile Silent Guardian API (run: pytest tests/ -q)."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from fastapi import FastAPI  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from services.audio_gateway import guardian  # noqa: E402
from services.analysis.call_audio_engine import _normalize_analysis  # noqa: E402

app = FastAPI()
app.include_router(guardian.router)
client = TestClient(app)


def _session(number="+92 333 1234567"):
    return client.post("/v1/live/guardian/session/start", json={"caller_number": number}).json()["session_id"]


def _text(sid, speaker, text):
    return client.post("/v1/live/guardian/evaluate-chunk",
                       json={"session_id": sid, "speaker": speaker, "text": text}).json()


def test_users_own_words_never_raise_risk():
    sid = _session()
    r = _text(sid, "user", "I never share my OTP or PIN code with anyone")
    assert r["risk_score"] == 15 and not r["alert_triggered"]


def test_keywords_match_whole_words_only():
    sid = _session()
    r = _text(sid, "caller", "My husband is out shopping, please call back later")
    assert r["detected_tactics"] == [] and not r["alert_triggered"]


def test_caller_otp_demand_triggers_alert_and_stays_latched():
    sid = _session()
    r = _text(sid, "caller", "I am from State Bank, your account will be blocked, tell me the OTP now")
    assert r["alert_triggered"] and r["tier"] == 3 and r["cut_call_recommended"]
    r = _text(sid, "caller", "Hello? Are you there?")
    assert r["alert_triggered"] and r["risk_score"] >= 85


def test_reputation_matches_exact_number_only():
    flagged = client.post("/v1/live/guardian/session/start", json={"caller_number": "+92 301 9845120"}).json()
    other = client.post("/v1/live/guardian/session/start", json={"caller_number": "+92 301 5550000"}).json()
    assert flagged["caller_reputation"]["is_scammer_flagged"]
    assert not other["caller_reputation"]["is_scammer_flagged"]


def test_audio_chunk_scores_caller_only(monkeypatch):
    class FakeEngine:
        available = True

        def analyze_chunk(self, audio_bytes, mime_type, prior):
            return {
                "segments": [{"speaker": "user", "text": "Hello?"},
                             {"speaker": "caller", "text": "Read me the OTP you just received"}],
                "caller_analysis": _normalize_analysis({
                    "tactics": {"credential_request": {"score": 0.95, "evidence": "Read me the OTP"}},
                    "scam_type": "fake_bank_officer", "requested_action": "share_otp", "confidence": 0.9,
                }),
            }

    monkeypatch.setattr(guardian, "call_audio_engine", FakeEngine())
    sid = _session()
    r = client.post("/v1/live/guardian/audio-chunk", data={"session_id": sid},
                    files={"audio": ("c.wav", b"\0" * 4000, "audio/wav")}).json()
    assert r["alert_triggered"] and r["caller_transcript"] == ["Read me the OTP you just received"]
    assert r["user_transcript"] == ["Hello?"]


def test_audio_chunk_without_gemini_returns_503(monkeypatch):
    class Offline:
        available = False

    monkeypatch.setattr(guardian, "call_audio_engine", Offline())
    r = client.post("/v1/live/guardian/audio-chunk", data={"session_id": "x"},
                    files={"audio": ("c.wav", b"\0" * 4000, "audio/wav")})
    assert r.status_code == 503


def test_normalize_analysis_handles_messy_model_output():
    n = _normalize_analysis({"tactics": {"urgency_pressure": {"score": None, "evidence": None},
                                         "credential_request": {"score": "1.7", "evidence": "x" * 500}},
                             "scam_type": "bogus", "requested_action": None, "caller_claims_org": "null"})
    assert n["tactics"]["urgency_pressure"] == {"score": 0.0, "evidence": ""}
    assert n["tactics"]["credential_request"]["score"] == 1.0
    assert len(n["tactics"]["credential_request"]["evidence"]) == 200
    assert n["scam_type"] == "uncertain" and n["requested_action"] == "uncertain"
    assert n["caller_claims_org"] is None
