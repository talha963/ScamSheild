"""Tests for the evaluation suite (run: pytest tests/ -q)."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402

from ml.evaluation import metrics as M  # noqa: E402
from ml.evaluation.dataset_generator import build_dataset, load_calls  # noqa: E402
from ml.evaluation.evaluators import evaluate_fusion_rules  # noqa: E402
from ml.evaluation.pipeline import analyze_utterance, simulate_call  # noqa: E402
from services.analysis.gemini_engine import GeminiAnalysisEngine  # noqa: E402


def test_recall_at_far_perfect_separation():
    r = M.recall_at_far([90, 95, 99], [5, 10, 20], 0.02)
    assert r["recall"] == 1.0 and r["far"] == 0.0


def test_auc_known_values():
    assert M.roc_curve([80, 90], [10, 20])["auc"] == 1.0
    assert M.roc_curve([50], [50])["auc"] == 0.5


def test_wer_cer():
    assert M.wer("a b c d", "a x c d") == 0.25
    assert M.cer("abcd", "abcd") == 0.0


def test_calibration_perfect_bins():
    c = M.calibration([100, 100, 0, 0], [1, 1, 0, 0])
    assert c["ece"] == 0.0 and c["brier"] == 0.0


def test_targets_status():
    assert M.check_target("recall_at_far", 91)["status"] == "PASS"
    assert M.check_target("time_to_detect_p50", 20)["status"] == "FAIL"
    assert M.check_target("user_comprehension", None)["status"] == "NOT_MEASURED"


def test_dataset_is_deterministic(tmp_path):
    a = build_dataset(scam_per_playbook=3, genuine_per_kind=3, lens_per_class=2, out_dir=tmp_path / "a")
    b = build_dataset(scam_per_playbook=3, genuine_per_kind=3, lens_per_class=2, out_dir=tmp_path / "b")
    assert a["calls_sha256"] == b["calls_sha256"]
    assert a["n_scam_calls"] >= 21 and a["n_genuine_calls"] >= 18


def test_pipeline_catches_curated_otp_scam():
    calls = {c["call_id"]: c for c in load_calls()}
    res = simulate_call(calls["curated_001"], GeminiAnalysisEngine())
    assert res["max_tier"] == 3 and res["pred_scam_type"] == "fake_bank_officer"


def test_pipeline_keeps_genuine_reminder_low():
    calls = {c["call_id"]: c for c in load_calls()}
    assert simulate_call(calls["curated_008"], GeminiAnalysisEngine())["max_tier"] <= 1


def test_utterance_extraction_shape():
    out = analyze_utterance("State Bank security, tell me your OTP now", GeminiAnalysisEngine())
    assert {"extracted", "evaluation", "latency_ms", "engine"} <= set(out)
    assert out["evaluation"]["fused_score"] >= 0


def test_fusion_design_rules_all_pass():
    r = evaluate_fusion_rules()
    assert r["failed"] == 0, [t for t in r["tests"] if t["status"] != "PASS"]
