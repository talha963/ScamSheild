"""
"Person speaks -> extract -> evaluate" pipeline.

Replays a call exactly like services/audio_gateway/gateway.py does for live transcripts:
  every spoken chunk is appended to a rolling transcript, the last 4 chunks (~20 s) go to the
  analysis engine (Gemini, or the built-in heuristic if no key), the structured signals
  (tactics + evidence, scam type, claimed org, requested action, next ask, warning) are extracted,
  then the Risk Fusion Engine fuses them with the call context into a 0-100 score and a tier.

The same function also powers the "Speak & Evaluate" box in the web dashboard.
"""
from __future__ import annotations

import time
from collections import Counter
from typing import Any, Dict, List, Optional

from services.analysis.gemini_engine import GeminiAnalysisEngine
from services.fusion.risk_fusion import RiskFusionEngine
from services.shared.schemas import AcousticSignals, CallContext

WINDOW_CHUNKS = 4  # identical to gateway.py ("rolling 20s window")
DETECT_TIER = 2    # "caught" = Tier 2 or Tier 3 (PDF 5.3 / 8.2)


def _context_at(events: List[Dict], t: float) -> CallContext:
    cur = events[0]["context"]
    for ev in events:
        if ev["t"] <= t:
            cur = ev["context"]
    return CallContext(**cur)


def tactic_summary(tactics: Dict[str, Any], min_score: float = 0.5) -> Dict[str, Dict]:
    out = {}
    for name, sig in (tactics or {}).items():
        if sig and sig.get("score", 0) >= min_score:
            out[name] = {"score": sig["score"], "evidence": sig.get("evidence", "")}
    return out


def simulate_call(call: Dict, analysis_engine: GeminiAnalysisEngine,
                  acoustic: Optional[AcousticSignals] = None, text_override: Optional[Dict[int, str]] = None) -> Dict:
    """Run one call script through extraction + fusion; return per-turn events and call-level summary."""
    fusion = RiskFusionEngine()  # fresh smoothing state per call
    acoustic = acoustic or AcousticSignals(synthetic_voice=0.05, call_center_noise=0.4, pressure_tempo=0.5)
    chunks: List[str] = []
    events: List[Dict] = []
    errors = 0

    for i, turn in enumerate(call["turns"]):
        text = (text_override or {}).get(i, turn["text"])
        chunks.append(text)
        window = " ".join(chunks[-WINDOW_CHUNKS:])
        ctx = _context_at(call["context_events"], turn["t"])

        t0 = time.perf_counter()
        analysis = analysis_engine.analyze_window(window)
        t1 = time.perf_counter()
        try:
            risk = fusion.fuse_signals(call_id=call["call_id"], t_offset_s=int(turn["t"]),
                                       linguistic_analysis=analysis, context=ctx, acoustic=acoustic)
        except Exception:  # schema violation counts against the system
            errors += 1
            continue
        t2 = time.perf_counter()

        events.append({
            "i": i, "t": turn["t"], "speaker": turn["speaker"], "text": text,
            "tactics": tactic_summary(analysis.get("tactics", {})),
            "scam_type": risk.scam_type, "requested_action": risk.requested_action,
            "caller_claims_org": risk.caller_claims_org, "next_likely_ask": risk.next_likely_ask,
            "user_warning": risk.user_warning, "user_warning_ur": risk.user_warning_ur,
            "fused_score": risk.fused_score, "tier": risk.tier, "reasons": risk.reasons,
            "actions": risk.actions,
            "analysis_ms": (t1 - t0) * 1000, "fusion_ms": (t2 - t1) * 1000,
            "compute_ms": (t2 - t0) * 1000,
        })

    return {"call_id": call["call_id"], "events": events, "schema_errors": errors,
            **summarize_events(call, events)}


def summarize_events(call: Dict, events: List[Dict]) -> Dict:
    if not events:
        return {"max_score": 0, "max_tier": 0, "detect_t": None, "ttd": None, "pred_scam_type": "none",
                "pred_action": "none", "pred_tactics": [], "evidence_total": 0, "evidence_present": 0}

    max_score = max(e["fused_score"] for e in events)
    max_tier = max(e["tier"] for e in events)
    detect = next((e for e in events if e["tier"] >= DETECT_TIER), None)
    detect_t = detect["t"] if detect else None

    ttd = None
    if detect_t is not None and call.get("first_cue_t") is not None:
        ttd = max(0.0, float(detect_t) - float(call["first_cue_t"]))

    # predicted scam type / action: majority vote over informative turns, else last turn
    informative = [e for e in events if e["scam_type"] not in ("none", "uncertain")]
    pred_type = Counter(e["scam_type"] for e in informative).most_common(1)[0][0] if informative else "none"
    act_inf = [e for e in events if e["requested_action"] not in ("none", "uncertain")]
    pred_action = Counter(e["requested_action"] for e in act_inf).most_common(1)[0][0] if act_inf else "none"

    pred_tactics, ev_total, ev_present = set(), 0, 0
    for e in events:
        for name, sig in e["tactics"].items():
            pred_tactics.add(name)
            ev_total += 1
            ev_present += 1 if sig.get("evidence") else 0

    return {"max_score": max_score, "max_tier": max_tier, "detect_t": detect_t, "ttd": ttd,
            "pred_scam_type": pred_type, "pred_action": pred_action,
            "pred_tactics": sorted(pred_tactics), "evidence_total": ev_total, "evidence_present": ev_present}


def analyze_utterance(text: str, analysis_engine: GeminiAnalysisEngine,
                      context: Optional[CallContext] = None, language_hint: Optional[str] = None) -> Dict:
    """Single spoken sentence (or short paragraph) -> extracted signals + fused score.  Used by the UI."""
    call = {"call_id": "live_probe", "first_cue_t": 0.0,
            "turns": [{"t": 0, "speaker": "caller", "text": text}],
            "context_events": [{"t": 0, "context": (context or CallContext()).model_dump()}]}
    res = simulate_call(call, analysis_engine)
    ev = res["events"][0] if res["events"] else {}
    return {"text": text, "language_hint": language_hint, "extracted": {
                "tactics": ev.get("tactics", {}), "scam_type": ev.get("scam_type"),
                "requested_action": ev.get("requested_action"), "caller_claims_org": ev.get("caller_claims_org"),
                "next_likely_ask": ev.get("next_likely_ask")},
            "evaluation": {"fused_score": ev.get("fused_score", 0), "tier": ev.get("tier", 0),
                           "reasons": ev.get("reasons", []), "actions": ev.get("actions", []),
                           "user_warning": ev.get("user_warning"), "user_warning_ur": ev.get("user_warning_ur")},
            "latency_ms": round(ev.get("compute_ms", 0.0), 2),
            "engine": "gemini" if analysis_engine.client else "heuristic_fallback"}
