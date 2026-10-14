"""
Component evaluators beyond call-level detection:

  evaluate_fusion_rules()     design rules of PDF 5.2 / 5.3 / 7.2 (no single weak signal holds a payment,
                              hard-stop combination, never-fall-quickly smoothing, tier boundaries, safe-word)
  evaluate_voice_clone()      Voice-Clone Shield (F7): AUC / EER / recall / FPR + per-group fairness
  evaluate_lens()             Scam Lens (F9): verdict accuracy, false-flag rate, brand + tamper checks
  evaluate_injection()        prompt-injection robustness (PDF 7.3 / Risks table)
  comprehension_*()           "at least 8 of 10 testers" user-comprehension study (PDF 8.2)
"""
from __future__ import annotations

import copy
import io
import json
import time
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

from ml.evaluation import metrics as M
from ml.evaluation.dataset_generator import DATA_DIR
from ml.evaluation.phrase_bank import INJECTION_SUFFIXES
from ml.evaluation.pipeline import DETECT_TIER, simulate_call
from services.fusion.risk_fusion import RiskFusionEngine
from services.shared.schemas import AcousticSignals, CallContext


# ---------------------------------------------------------------------------
# Fusion design rules
# ---------------------------------------------------------------------------
def _fuse(tactics=None, ctx=None, acoustic=None, **kw):
    eng = RiskFusionEngine()
    analysis = {"tactics": tactics or {}, "scam_type": kw.get("scam_type", "none"),
                "requested_action": kw.get("requested_action", "none")}
    return eng.fuse_signals("rule_test", 0, analysis, ctx or CallContext(unknown_caller=False),
                            acoustic or AcousticSignals(), kw.get("whitelisted", False))


def evaluate_fusion_rules() -> Dict:
    tests: List[Dict] = []

    def add(name, passed, detail, kind="design_rule"):
        tests.append({"test": name, "status": "PASS" if passed else "FAIL", "detail": detail, "kind": kind})

    # 5.2: "no single weak signal can hold a payment"
    singles = {
        "unknown caller only": dict(ctx=CallContext(unknown_caller=True)),
        "banking app open only": dict(ctx=CallContext(unknown_caller=False, banking_app_open=True)),
        "new payee only": dict(ctx=CallContext(unknown_caller=False, new_payee=True)),
        "large amount (9x) only": dict(ctx=CallContext(unknown_caller=False, amount_vs_history=9.0)),
        "synthetic voice 0.9 only": dict(acoustic=AcousticSignals(synthetic_voice=0.9)),
        "urgency tactic only": dict(tactics={"urgency_pressure": {"score": 1.0, "evidence": "x"}}),
        "authority tactic only": dict(tactics={"authority_impersonation": {"score": 1.0, "evidence": "x"}}),
        "credential tactic only": dict(tactics={"credential_request": {"score": 1.0, "evidence": "x"}}),
    }
    for name, kw in singles.items():
        ev = _fuse(**kw)
        add(f"single signal cannot hard-hold: {name}", ev.tier < 3, f"score={ev.fused_score} tier={ev.tier}")

    # 5.2 / 7.2: credential + unknown call + banking activity -> Tier 3 floor
    ev = _fuse(tactics={"credential_request": {"score": 0.97, "evidence": "tell me the OTP"}},
               ctx=CallContext(unknown_caller=True, banking_app_open=True), requested_action="share_otp")
    add("hard stop: OTP ask + unknown call + banking app open -> Tier 3", ev.tier == 3,
        f"score={ev.fused_score} tier={ev.tier}")

    # PDF wording: the combination needs "a payment in progress" - implementation keys on banking_app_open.
    ev = _fuse(tactics={"credential_request": {"score": 0.97, "evidence": "tell me the OTP"}},
               ctx=CallContext(unknown_caller=True, banking_app_open=True, new_payee=False, amount_vs_history=1.0),
               requested_action="share_otp")
    add("NOTE hard stop fires with app open but no payee/amount (PDF says 'payment in progress')",
        True, f"tier={ev.tier}. Implementation uses banking_app_open as the payment proxy; "
              "consider also requiring new_payee or amount_vs_history to match the PDF wording.", kind="observation")

    # No hard stop when caller is known (e.g. bank's official number)
    ev = _fuse(tactics={"credential_request": {"score": 0.97, "evidence": "OTP"}},
               ctx=CallContext(unknown_caller=False, banking_app_open=True), requested_action="share_otp")
    add("hard stop does not fire for a known caller", ev.tier < 3, f"score={ev.fused_score} tier={ev.tier}")

    # Whitelist lowers prior risk (7.2)
    base = _fuse(tactics={"authority_impersonation": {"score": 0.9, "evidence": "x"}},
                 ctx=CallContext(unknown_caller=True))
    wl = _fuse(tactics={"authority_impersonation": {"score": 0.9, "evidence": "x"}},
               ctx=CallContext(unknown_caller=True), whitelisted=True)
    add("official bank number lowers risk (whitelist)", wl.fused_score < base.fused_score,
        f"{base.fused_score} -> {wl.fused_score}")

    # "Never fall quickly"
    eng = RiskFusionEngine()
    hot = {"tactics": {"credential_request": {"score": 1.0, "evidence": "OTP"},
                       "authority_impersonation": {"score": 1.0, "evidence": "bank"},
                       "urgency_pressure": {"score": 1.0, "evidence": "now"}}}
    ctx = CallContext(unknown_caller=True)
    for t in range(3):
        peak = eng.fuse_signals("c", t, hot, ctx, AcousticSignals()).fused_score
    drops, prev = [], peak
    for t in range(3, 8):
        cur = eng.fuse_signals("c", t, {"tactics": {}}, ctx, AcousticSignals()).fused_score
        drops.append(prev - cur); prev = cur
    add("never-fall-quickly smoothing (drop <= 3 per step)", max(drops) <= 3, f"peak={peak} drops={drops}")

    # Tier boundaries (5.3) - driven through the real engine at exact raw scores (alpha=1 => no smoothing lag)
    def tact(**kw):
        return {k: {"score": v, "evidence": "x"} for k, v in kw.items()}
    four = tact(authority_impersonation=1.0, urgency_pressure=1.0, secrecy_isolation=1.0, emotional_manipulation=1.0)  # capped at 75
    cases = [
        ("raw 29.4", tact(credential_request=29.4 / 38), CallContext(unknown_caller=False), 0),
        ("raw 30.0", tact(credential_request=30.0 / 38), CallContext(unknown_caller=False), 1),
        ("raw 59.4", tact(credential_request=1.0, authority_impersonation=21.4 / 22), CallContext(unknown_caller=False), 1),
        ("raw 60.0", tact(credential_request=1.0, authority_impersonation=1.0), CallContext(unknown_caller=False), 2),
        ("raw 84.0", four, CallContext(unknown_caller=False, amount_vs_history=4.5), 2),
        ("raw 85.0", four, CallContext(unknown_caller=False, amount_vs_history=5.0), 3),
    ]
    rows, ok = [], True
    for label, tt, cx, want in cases:
        e = RiskFusionEngine(alpha_smoothing=1.0)
        ev = e.fuse_signals("b", 0, {"tactics": tt}, cx, AcousticSignals())
        ok &= ev.tier == want
        rows.append(f"{label}->score {ev.fused_score}/tier {ev.tier} (want {want})")
    add("tier boundaries 0-29 / 30-59 / 60-84 / 85-100 via fusion engine", ok, "; ".join(rows))

    # Safe-word challenge for relative-in-trouble and synthetic voice (5.4)
    ev = _fuse(tactics={"emotional_manipulation": {"score": 0.9, "evidence": "x"}}, scam_type="relative_in_trouble")
    add("safe-word challenge for relative_in_trouble", bool(ev.safe_word_challenge and ev.safe_word_challenge.required), "")
    ev = _fuse(acoustic=AcousticSignals(synthetic_voice=0.8))
    add("safe-word challenge for synthetic voice", bool(ev.safe_word_challenge and ev.safe_word_challenge.required), "")

    # Action ladder (5.3)
    ladder = {3: "hold_transaction", 2: "cool_off_hold_60s", 1: "coach_prompt", 0: "silent_monitoring"}
    ev3 = _fuse(tactics={"credential_request": {"score": 1.0, "evidence": "x"}},
                ctx=CallContext(unknown_caller=True, banking_app_open=True), requested_action="share_otp")
    add("Tier 3 action ladder contains hold + guardian alert", "hold_transaction" in ev3.actions and "notify_guardians" in ev3.actions, str(ev3.actions))
    ev0 = _fuse()
    add("Tier 0 is silent monitoring only", ev0.actions == ["silent_monitoring"], str(ev0.actions))

    passed = sum(1 for t in tests if t["status"] == "PASS")
    return {"total": len(tests), "passed": passed, "failed": len(tests) - passed, "tests": tests}


# ---------------------------------------------------------------------------
# Voice-clone shield
# ---------------------------------------------------------------------------
def _proxy_voice_clip(rng: np.random.Generator, synthetic: bool, f0: float, sr: int = 16000, secs: float = 2.0):
    """Proxy signals ONLY for pipeline testing. Real evidence needs ASVspoof / recorded clips."""
    t = np.arange(int(sr * secs)) / sr
    jitter = (0.01 if synthetic else 0.06) * np.cumsum(rng.normal(0, 1, len(t))) / np.sqrt(len(t)) * 8
    f = f0 * (1 + jitter + (0.01 if synthetic else 0.05) * np.sin(2 * np.pi * 3 * t))
    phase = 2 * np.pi * np.cumsum(f) / sr
    sig = sum((1 / h) * np.sin(h * phase) for h in range(1, 7))
    env = 0.7 + 0.3 * np.sin(2 * np.pi * 4 * t + rng.uniform(0, 6)) if not synthetic else 0.9 + 0.05 * np.sin(2 * np.pi * 2 * t)
    sig = sig * env
    sig = sig / (np.abs(sig).max() + 1e-9)
    sig *= rng.uniform(0.08, 0.45)
    sig += rng.normal(0, rng.uniform(0.002, 0.05) * (0.5 if synthetic else 1.5), len(t))
    return sig.astype(np.float32)


def _load_wav_dir(folder: Path):
    from scipy.io import wavfile
    clips = []
    for p in sorted(folder.glob("*.wav")):
        sr, data = wavfile.read(p)
        data = data.astype(np.float32)
        if data.ndim > 1:
            data = data.mean(axis=1)
        if np.abs(data).max() > 1.5:
            data = data / 32768.0
        group = p.stem.split("_")[0]  # e.g. female_urdu_001.wav -> group "female"
        clips.append((data, sr, group))
    return clips


def evaluate_voice_clone(n_per_class: int = 100, seed: int = 7) -> Dict:
    from ml.models.voice_clone_detector import VoiceCloneDetector
    det = VoiceCloneDetector()
    real_dir, syn_dir = DATA_DIR / "audio" / "real", DATA_DIR / "audio" / "synthetic"
    rng = np.random.default_rng(seed)

    if real_dir.exists() and syn_dir.exists() and list(real_dir.glob("*.wav")) and list(syn_dir.glob("*.wav")):
        real, syn, source = _load_wav_dir(real_dir), _load_wav_dir(syn_dir), "wav_files"
    else:
        groups = [("male", 110), ("female", 210), ("male_accentB", 130), ("female_accentB", 230)]
        real = [(_proxy_voice_clip(rng, False, groups[i % 4][1] * rng.uniform(0.9, 1.1)), 16000, groups[i % 4][0]) for i in range(n_per_class)]
        syn = [(_proxy_voice_clip(rng, True, groups[i % 4][1] * rng.uniform(0.9, 1.1)), 16000, groups[i % 4][0]) for i in range(n_per_class)]
        source = "PROXY_SIGNALS"

    def score(clips):
        return [det.analyze_audio_segment(x, sr)["synthetic_likelihood"] for x, sr, _ in clips]

    s_syn, s_real = score(syn), score(real)
    thr = det.synthetic_threshold
    tpr = float((np.asarray(s_syn) >= thr).mean())
    fpr = float((np.asarray(s_real) >= thr).mean())
    roc = M.roc_curve([x * 100 for x in s_syn], [x * 100 for x in s_real])

    by_group: Dict[str, Dict] = {}
    for g in sorted({c[2] for c in real + syn}):
        gs = [s for s, c in zip(s_syn, syn) if c[2] == g]
        gr = [s for s, c in zip(s_real, real) if c[2] == g]
        by_group[g] = {"n_synthetic": len(gs), "n_real": len(gr),
                       "synthetic_recall": float((np.asarray(gs) >= thr).mean()) if gs else None,
                       "real_false_flag_rate": float((np.asarray(gr) >= thr).mean()) if gr else None}
    fprs = [v["real_false_flag_rate"] for v in by_group.values() if v["real_false_flag_rate"] is not None]
    return {
        "data_source": source, "n_real": len(real), "n_synthetic": len(syn),
        "threshold": thr, "synthetic_recall": tpr, "false_flag_rate_on_real": fpr,
        "accuracy": float((tpr * len(syn) + (1 - fpr) * len(real)) / (len(syn) + len(real))),
        "auc": roc["auc"], "eer": M.equal_error_rate(s_syn, s_real),
        "per_group": by_group,
        "group_fpr_gap": float(max(fprs) - min(fprs)) if len(fprs) > 1 else None,
        "warning": ("Proxy signals were used because data/eval/audio/{real,synthetic}/*.wav were not found. "
                    "These numbers test the plumbing, NOT real deepfake detection. Add ASVspoof-style or "
                    "TTS-cloned clips (name files <group>_<anything>.wav) and re-run.") if source != "wav_files" else None,
    }


# ---------------------------------------------------------------------------
# Scam Lens
# ---------------------------------------------------------------------------
def evaluate_lens(limit: Optional[int] = None) -> Dict:
    from services.lens.vision_engine import ScamLensEngine
    labels_path = DATA_DIR / "lens_labels.json"
    if not labels_path.exists():
        return {"available": False, "reason": "Run the dataset generator first."}
    labels = json.loads(labels_path.read_text())
    if limit:
        labels = labels[:limit]
    eng = ScamLensEngine()
    rows, lat = [], []
    for item in labels:
        data = (DATA_DIR / "lens_images" / item["file"]).read_bytes()
        t0 = time.perf_counter()
        r = eng.analyze_image_bytes(data)
        lat.append((time.perf_counter() - t0) * 1000)
        rows.append({**item, "verdict": r.verdict, "spoofed_brand": r.spoofed_brand,
                     "tampering": r.tampering_detected, "has_reasons": bool(r.reasons)})
    scam = [r for r in rows if r["label"] == "scam"]
    gen = [r for r in rows if r["label"] == "genuine"]
    flagged = lambda r: r["verdict"] != "safe"
    recall = sum(flagged(r) for r in scam) / max(1, len(scam))
    fpr = sum(flagged(r) for r in gen) / max(1, len(gen))
    brand_hits = [r for r in scam if r["brand"]]
    brand_acc = (sum(1 for r in brand_hits if r["spoofed_brand"] and r["brand"].lower() in r["spoofed_brand"].lower())
                 / max(1, len(brand_hits)))
    constant = len({r["verdict"] for r in rows}) == 1
    return {
        "available": True, "engine": "gemini_vision" if eng.client else "heuristic_fallback",
        "n_scam": len(scam), "n_genuine": len(gen), "scam_recall": recall, "false_flag_rate_on_genuine": fpr,
        "accuracy": (recall * len(scam) + (1 - fpr) * len(gen)) / max(1, len(rows)),
        "brand_impersonation_accuracy": brand_acc,
        "tamper_recall": (sum(1 for r in scam if r["tampered"] and r["tampering"]) / max(1, sum(1 for r in scam if r["tampered"]))),
        "explanation_rate": sum(r["has_reasons"] for r in rows) / max(1, len(rows)),
        "latency_ms": M.latency_stats(lat),
        "verdict_counts": {v: sum(1 for r in rows if r["verdict"] == v) for v in ("safe", "suspicious", "scam")},
        "warning": ("The offline fallback returns the same 'scam' verdict for every image, so the false-flag rate "
                    "is 100%. Set GEMINI_API_KEY to evaluate the real vision model.") if constant and not eng.client else None,
    }


# ---------------------------------------------------------------------------
# Prompt-injection robustness
# ---------------------------------------------------------------------------
def evaluate_injection(calls: List[Dict], analysis_engine, max_calls: int = 120) -> Dict:
    scams = [c for c in calls if c["label"] == "scam"][:max_calls]
    base_caught = inj_caught = flipped = 0
    for k, c in enumerate(scams):
        base = simulate_call(c, analysis_engine)
        attacked = copy.deepcopy(c)
        last = max(i for i, t in enumerate(attacked["turns"]) if t["speaker"] == "caller")
        attacked["turns"][last]["text"] += " " + INJECTION_SUFFIXES[k % len(INJECTION_SUFFIXES)]
        att = simulate_call(attacked, analysis_engine)
        b, a = base["max_tier"] >= DETECT_TIER, att["max_tier"] >= DETECT_TIER
        base_caught += b; inj_caught += a; flipped += int(b and not a)
    n = max(1, len(scams))
    return {"n": len(scams), "recall_without_injection": base_caught / n, "recall_with_injection": inj_caught / n,
            "verdicts_flipped_by_injection": flipped, "flip_rate": flipped / max(1, base_caught),
            "pass": flipped == 0}


# ---------------------------------------------------------------------------
# User-comprehension study (8 of 10 testers)
# ---------------------------------------------------------------------------
COMP_FILE = DATA_DIR / "comprehension_responses.json"
COMP_QUESTION = {
    "warning_shown": "Bank never asks for your OTP. Hang up.",
    "q1": "What is this warning telling you?",
    "q1_options": ["Hang up and do not share the OTP", "Share the OTP quickly", "Ignore it, it is a normal bank call", "Transfer the money"],
    "q1_correct": 0,
    "q2": "What would you do right now?",
    "q2_options": ["Hang up and call the bank's official number", "Read out the OTP", "Continue the transfer", "Stay on the call"],
    "q2_correct": 0,
}


def comprehension_add(response: Dict) -> Dict:
    COMP_FILE.parent.mkdir(parents=True, exist_ok=True)
    rows = json.loads(COMP_FILE.read_text()) if COMP_FILE.exists() else []
    row = {"tester": response.get("tester") or f"tester_{len(rows) + 1}",
           "language": response.get("language", "en"),
           "q1": int(response["q1"]), "q2": int(response["q2"]),
           "understood": int(response["q1"]) == COMP_QUESTION["q1_correct"],
           "acted_correctly": int(response["q2"]) == COMP_QUESTION["q2_correct"]}
    row["passed"] = row["understood"] and row["acted_correctly"]
    rows.append(row)
    COMP_FILE.write_text(json.dumps(rows, indent=2))
    return row


def comprehension_summary() -> Dict:
    rows = json.loads(COMP_FILE.read_text()) if COMP_FILE.exists() else []
    n = len(rows)
    passed = sum(r["passed"] for r in rows)
    return {"n_testers": n, "n_passed": passed, "pass_rate": (passed / n) if n else None,
            "score_out_of_10": round(10 * passed / n, 2) if n else None,
            "enough_testers": n >= 10, "responses": rows,
            "note": None if n >= 10 else "Collect at least 10 testers before reporting this metric."}


def comprehension_reset() -> None:
    if COMP_FILE.exists():
        COMP_FILE.unlink()
