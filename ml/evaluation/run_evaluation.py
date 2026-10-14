"""
ScamShield Live - end-to-end evaluation runner (PDF Section 8).

    python ml/evaluation/run_evaluation.py                 # full run (uses data/eval, builds it if missing)
    python ml/evaluation/run_evaluation.py --regenerate    # rebuild the synthetic corpus first
    python ml/evaluation/run_evaluation.py --quick         # 15% sample, no injection test (fast smoke run)
    python ml/evaluation/run_evaluation.py --asr-file x.jsonl   # also score STT output: {"ref","hyp","lang"} per line

Pipeline: spoken turns -> rolling window -> extraction (Gemini or heuristic fallback) -> risk fusion
-> metrics.  Nothing is hard-coded; every number is measured from this run and written to
reports/evaluation_report.{json,md} and reports/per_call_results.csv.
"""
from __future__ import annotations

import argparse
import csv
import json
import random
import sys
import time
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ml.evaluation import metrics as M  # noqa: E402
from ml.evaluation.dataset_generator import DATA_DIR, build_dataset, load_calls  # noqa: E402
from ml.evaluation.evaluators import (  # noqa: E402
    comprehension_summary, evaluate_fusion_rules, evaluate_injection, evaluate_lens, evaluate_voice_clone,
)
from ml.evaluation.phrase_bank import TACTIC_NAMES  # noqa: E402
from ml.evaluation.pipeline import DETECT_TIER, simulate_call  # noqa: E402
from services.analysis.gemini_engine import GeminiAnalysisEngine  # noqa: E402

REPORT_DIR = ROOT / "reports"
OPERATING_THRESHOLD = 60  # Tier 2 starts at 60 (PDF 5.3)
PLAYBOOKS = ["fake_bank_officer", "wallet_reversal", "prize_offer", "relative_in_trouble",
             "courier_customs_police", "sim_block", "investment", "none", "uncertain"]
ACTIONS = ["share_otp", "share_pin", "send_money", "install_app", "click_link", "none", "uncertain"]

# Budget (PDF 6.2) for stages the offline benchmark cannot time without microphone audio.
UNMEASURED_STAGE_BUDGET_S = {"capture_and_chunking": 0.5, "streaming_transcription": 0.6, "action_delivery": 0.5}


def run_all(regenerate: bool = False, quick: bool = False, skip_injection: bool = False,
            asr_file: Optional[Path] = None, progress=None) -> Dict:
    t_start = time.time()
    if regenerate or not (DATA_DIR / "calls.jsonl").exists():
        build_dataset()
    calls = load_calls()
    if quick:
        rng = random.Random(1)
        calls = rng.sample(calls, max(40, int(len(calls) * 0.15)))
        skip_injection = True

    engine = GeminiAnalysisEngine()
    engine_name = "gemini:" + engine.client.__class__.__name__ if engine.client else "heuristic_fallback"

    rows, all_latency, schema_errors, results = [], [], 0, {}
    for k, call in enumerate(calls):
        res = simulate_call(call, engine)
        results[call["call_id"]] = res
        schema_errors += res["schema_errors"]
        all_latency += [e["compute_ms"] for e in res["events"]]
        rows.append({
            "call_id": call["call_id"], "label": call["label"], "language": call["language"],
            "pressure": call.get("pressure"), "gold_type": call["scam_type"], "gold_action": call["requested_action"],
            "kind": call.get("genuine_kind"), "source": call.get("source"),
            "max_score": res["max_score"], "max_tier": res["max_tier"], "detect_t": res["detect_t"],
            "ttd": res["ttd"], "pred_type": res["pred_scam_type"], "pred_action": res["pred_action"],
            "gold_tactics": call["gold_tactics"], "pred_tactics": res["pred_tactics"],
            "ev_total": res["evidence_total"], "ev_present": res["evidence_present"],
        })
        if progress and k % 50 == 0:
            progress(k, len(calls))

    scam = [r for r in rows if r["label"] == "scam"]
    gen = [r for r in rows if r["label"] == "genuine"]
    s_scores, g_scores = [r["max_score"] for r in scam], [r["max_score"] for r in gen]

    # --- 1. Detection -----------------------------------------------------------
    op = M.rates_at_threshold(s_scores, g_scores, OPERATING_THRESHOLD)
    at_far = M.recall_at_far(s_scores, g_scores, 0.02)
    roc = M.roc_curve(s_scores, g_scores)
    detected = [r for r in scam if r["max_tier"] >= DETECT_TIER]
    ttd = M.time_to_detect_stats([r["ttd"] for r in detected])
    false_alarms = sum(1 for r in gen if r["max_tier"] >= DETECT_TIER)
    fa_per_100 = 100.0 * false_alarms / max(1, len(gen))
    tier_dist = {
        "scam": {f"tier_{t}": sum(1 for r in scam if r["max_tier"] == t) for t in range(4)},
        "genuine": {f"tier_{t}": sum(1 for r in gen if r["max_tier"] == t) for t in range(4)},
    }
    misses = [{"call_id": r["call_id"], "language": r["language"], "type": r["gold_type"], "max_score": r["max_score"]}
              for r in scam if r["max_tier"] < DETECT_TIER][:15]
    false_alarm_examples = [{"call_id": r["call_id"], "language": r["language"], "kind": r["kind"], "max_score": r["max_score"]}
                            for r in gen if r["max_tier"] >= DETECT_TIER][:15]

    # --- 2. Latency -------------------------------------------------------------
    lat = M.latency_stats(all_latency)
    projected = (sum(UNMEASURED_STAGE_BUDGET_S.values()) + (lat.get("p95_ms", 0.0) / 1000.0))

    # --- 3. Language / fairness ---------------------------------------------------
    by_lang = M.per_group_detection(rows, "language", OPERATING_THRESHOLD)
    by_pressure = M.per_group_detection([r for r in rows if r["label"] == "genuine" or r["pressure"] in ("low", "medium", "high")],
                                        "pressure", OPERATING_THRESHOLD)
    lang_gap = M.max_gap(by_lang, "recall_pct")
    by_playbook = {}
    for pb in sorted({r["gold_type"] for r in scam}):
        sub = [r for r in scam if r["gold_type"] == pb]
        by_playbook[pb] = {"n": len(sub), "recall_pct": 100.0 * sum(r["max_tier"] >= DETECT_TIER for r in sub) / len(sub)}
    far_by_kind = {}
    for kind in sorted({r["kind"] for r in gen if r["kind"]}):
        sub = [r for r in gen if r["kind"] == kind]
        far_by_kind[kind] = {"n": len(sub), "far_pct": 100.0 * sum(r["max_tier"] >= DETECT_TIER for r in sub) / len(sub)}

    # --- 4. Understanding quality (the "extract what the person said" part) ------------
    gold_t = [r["gold_type"] for r in scam]
    pred_t = [r["pred_type"] for r in scam]
    type_report = M.classification_report(gold_t, pred_t, PLAYBOOKS)
    type_cm = M.confusion(gold_t, pred_t, PLAYBOOKS)
    act_report = M.classification_report([r["gold_action"] for r in scam], [r["pred_action"] for r in scam], ACTIONS)
    tactic_prf = M.multilabel_prf([set(r["gold_tactics"]) for r in scam], [set(r["pred_tactics"]) for r in scam], TACTIC_NAMES)
    ev_total, ev_present = sum(r["ev_total"] for r in rows), sum(r["ev_present"] for r in rows)
    type_by_lang = {}
    for lang in sorted({r["language"] for r in scam}):
        sub = [r for r in scam if r["language"] == lang]
        type_by_lang[lang] = float(sum(r["gold_type"] == r["pred_type"] for r in sub) / len(sub))
    genuine_types = Counter(r["pred_type"] for r in gen)

    # --- 5. Calibration -----------------------------------------------------------
    calib = M.calibration(s_scores + g_scores, [1] * len(s_scores) + [0] * len(g_scores))

    # --- 6. Other components -------------------------------------------------------
    fusion_rules = evaluate_fusion_rules()
    voice = evaluate_voice_clone()
    lens = evaluate_lens(limit=30 if quick else None)
    injection = None if skip_injection else evaluate_injection(calls, engine)
    comp = comprehension_summary()

    asr = None
    if asr_file and Path(asr_file).exists():
        pairs = [json.loads(l) for l in Path(asr_file).read_text(encoding="utf-8").splitlines() if l.strip()]
        per_lang: Dict[str, List] = {}
        for p in pairs:
            per_lang.setdefault(p.get("lang", "all"), []).append((M.wer(p["ref"], p["hyp"]), M.cer(p["ref"], p["hyp"])))
        asr = {lang: {"n": len(v), "wer": sum(a for a, _ in v) / len(v), "cer": sum(b for _, b in v) / len(v)}
               for lang, v in per_lang.items()}

    # --- 7. Targets (PDF 8.2) -------------------------------------------------------
    targets = [
        M.check_target("recall_at_far", at_far["recall"] * 100),
        M.check_target("far_at_operating_pt", op["far"] * 100),
        M.check_target("time_to_detect_p50", ttd["p50"]),
        M.check_target("false_alarms_per_100", fa_per_100),
        M.check_target("intervention_latency", projected),
        M.check_target("language_gap", lang_gap),
        M.check_target("user_comprehension", comp["score_out_of_10"] if comp["enough_testers"] else None),
    ]

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "runtime_seconds": round(time.time() - t_start, 1),
        "engine": engine_name,
        "mode": "quick_sample" if quick else "full",
        "dataset": json.loads((DATA_DIR / "dataset_manifest.json").read_text(encoding="utf-8")) if (DATA_DIR / "dataset_manifest.json").exists() else {},
        "evaluated_calls": {"scam": len(scam), "genuine": len(gen)},
        "targets": targets,
        "detection": {
            "operating_point_tier2": {"threshold": OPERATING_THRESHOLD, "recall_pct": op["recall"] * 100, "far_pct": op["far"] * 100},
            "recall_at_far_2pct": {"threshold": at_far["threshold"], "recall_pct": at_far["recall"] * 100, "far_pct": at_far["far"] * 100},
            "auc": roc["auc"], "roc": roc["points"],
            "time_to_detect": ttd, "false_alarms": false_alarms, "false_alarms_per_100_genuine": fa_per_100,
            "tier_distribution": tier_dist, "missed_scam_examples": misses, "false_alarm_examples": false_alarm_examples,
        },
        "latency": {"measured_compute": lat, "unmeasured_stage_budget_s": UNMEASURED_STAGE_BUDGET_S,
                    "projected_end_to_end_s": projected,
                    "note": "Projected = measured analysis+fusion p95 + PDF 6.2 budget for capture, STT and action delivery."},
        "fairness": {"per_language": by_lang, "language_recall_gap_pts": lang_gap, "per_pressure": by_pressure,
                     "per_playbook_recall": by_playbook, "false_alarm_by_genuine_kind": far_by_kind},
        "understanding": {
            "scam_type": {"accuracy": type_report["accuracy"], "macro_f1": type_report["macro_f1"],
                          "per_class": type_report["per_class"], "confusion": type_cm, "accuracy_by_language": type_by_lang},
            "requested_action": {"accuracy": act_report["accuracy"], "macro_f1": act_report["macro_f1"], "per_class": act_report["per_class"]},
            "tactics": tactic_prf,
            "evidence_phrase_rate": (ev_present / ev_total) if ev_total else None,
            "schema_valid_rate": 1.0 - schema_errors / max(1, len(all_latency) + schema_errors),
            "genuine_calls_predicted_scam_type": dict(genuine_types),
        },
        "calibration": calib,
        "fusion_rules": fusion_rules, "voice_clone": voice, "scam_lens": lens,
        "prompt_injection": injection, "user_comprehension": comp, "asr_quality": asr,
    }

    REPORT_DIR.mkdir(exist_ok=True)
    (REPORT_DIR / "evaluation_report.json").write_text(json.dumps(report, indent=2, ensure_ascii=False, default=str), encoding="utf-8")
    with (REPORT_DIR / "per_call_results.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["call_id", "label", "language", "pressure", "gold_type", "pred_type", "gold_action", "pred_action",
                    "max_score", "max_tier", "first_cue_to_detect_s", "gold_tactics", "pred_tactics"])
        for r in rows:
            w.writerow([r["call_id"], r["label"], r["language"], r["pressure"], r["gold_type"], r["pred_type"], r["gold_action"],
                        r["pred_action"], r["max_score"], r["max_tier"], r["ttd"], "|".join(r["gold_tactics"]), "|".join(r["pred_tactics"])])
    (REPORT_DIR / "evaluation_report.md").write_text(render_markdown(report), encoding="utf-8")
    return report


# ---------------------------------------------------------------------------
def _f(x, nd=1, suffix=""):
    return "n/a" if x is None else f"{x:.{nd}f}{suffix}"


def render_markdown(r: Dict) -> str:
    d, u = r["detection"], r["understanding"]
    L = [f"# ScamShield Live - Evaluation Report", "",
         f"Generated {r['generated_at']} | engine: **{r['engine']}** | mode: {r['mode']} | "
         f"{r['evaluated_calls']['scam']} scam + {r['evaluated_calls']['genuine']} genuine calls", "",
         "## Acceptance targets (PDF Section 8.2)", "", "| Metric | Measured | Goal | Status |", "|---|---|---|---|"]
    for t in r["targets"]:
        L.append(f"| {t['label']} | {_f(t['value'], 2)} | {t['goal']} | {t['status']} |")
    L += ["", "## Detection", "",
          f"- Tier-2 operating point: recall {_f(d['operating_point_tier2']['recall_pct'])}%, false-alarm rate {_f(d['operating_point_tier2']['far_pct'], 2)}%",
          f"- Recall at FAR<=2%: {_f(d['recall_at_far_2pct']['recall_pct'])}% (threshold {d['recall_at_far_2pct']['threshold']:.0f}, actual FAR {_f(d['recall_at_far_2pct']['far_pct'], 2)}%)",
          f"- ROC AUC: {_f(d['auc'], 3)}",
          f"- Time-to-detect median {_f(d['time_to_detect']['p50'])} s, p90 {_f(d['time_to_detect']['p90'])} s (n={d['time_to_detect']['n']})",
          f"- False alarms: {d['false_alarms']} ({_f(d['false_alarms_per_100_genuine'], 2)} per 100 genuine calls)", "",
          "## Per-language recall / false-alarm rate", "", "| Language | Scam n | Recall % | Genuine n | FAR % |", "|---|---|---|---|---|"]
    for lang, v in r["fairness"]["per_language"].items():
        L.append(f"| {lang} | {v['n_scam']} | {_f(v['recall_pct'])} | {v['n_genuine']} | {_f(v['far_pct'], 2)} |")
    L += ["", f"Worst-vs-best language recall gap: **{_f(r['fairness']['language_recall_gap_pts'])} points**", "",
          "## Per-playbook recall", "", "| Playbook | n | Recall % |", "|---|---|---|"]
    for pb, v in r["fairness"]["per_playbook_recall"].items():
        L.append(f"| {pb} | {v['n']} | {_f(v['recall_pct'])} |")
    L += ["", "## Understanding what was said (extraction quality)", "",
          f"- Scam-type accuracy {_f(u['scam_type']['accuracy'] * 100)}%, macro-F1 {_f(u['scam_type']['macro_f1'], 3)}",
          f"- Requested-action accuracy {_f(u['requested_action']['accuracy'] * 100)}%",
          f"- Evidence phrase present for {_f((u['evidence_phrase_rate'] or 0) * 100)}% of fired tactics",
          f"- Output schema valid for {_f(u['schema_valid_rate'] * 100, 2)}% of windows", "",
          "| Tactic | Precision | Recall | F1 |", "|---|---|---|---|"]
    for k, v in u["tactics"].items():
        L.append(f"| {k} | {v['precision']:.2f} | {v['recall']:.2f} | {v['f1']:.2f} |")
    lt = r["latency"]
    L += ["", "## Latency", "",
          f"- Measured analysis+fusion: p50 {_f(lt['measured_compute'].get('p50_ms'), 2)} ms, p95 {_f(lt['measured_compute'].get('p95_ms'), 2)} ms",
          f"- Projected end-to-end (adds PDF 6.2 budget for capture/STT/action): {_f(lt['projected_end_to_end_s'], 2)} s", "",
          "## Calibration", "", f"- ECE {_f(r['calibration']['ece'], 3)}, Brier {_f(r['calibration']['brier'], 3)}", "",
          "## Fusion design rules", "", f"- {r['fusion_rules']['passed']}/{r['fusion_rules']['total']} checks passed"]
    for t in r["fusion_rules"]["tests"]:
        if t["status"] != "PASS" or t["kind"] == "observation":
            L.append(f"  - {t['status']}: {t['test']} - {t['detail']}")
    v, ln = r["voice_clone"], r["scam_lens"]
    L += ["", "## Voice-Clone Shield", "",
          f"- data source: {v['data_source']} | synthetic recall {_f(v['synthetic_recall'] * 100)}% | false flag on real {_f(v['false_flag_rate_on_real'] * 100)}% | AUC {_f(v['auc'], 3)} | EER {_f(v['eer'], 3)}"]
    if v.get("warning"):
        L.append(f"- WARNING: {v['warning']}")
    L += ["", "## Scam Lens", ""]
    if ln.get("available"):
        L.append(f"- engine {ln['engine']} | scam recall {_f(ln['scam_recall'] * 100)}% | false-flag on genuine {_f(ln['false_flag_rate_on_genuine'] * 100)}% | brand accuracy {_f(ln['brand_impersonation_accuracy'] * 100)}%")
        if ln.get("warning"):
            L.append(f"- WARNING: {ln['warning']}")
    if r["prompt_injection"]:
        pi = r["prompt_injection"]
        L += ["", "## Prompt-injection robustness", "",
              f"- recall without injection {_f(pi['recall_without_injection'] * 100)}% -> with injection {_f(pi['recall_with_injection'] * 100)}%; verdicts flipped: {pi['verdicts_flipped_by_injection']}"]
    c = r["user_comprehension"]
    L += ["", "## User comprehension", "",
          f"- testers: {c['n_testers']} | passed: {c['n_passed']} | " + (c["note"] or "target 8/10")]
    L += ["", "## Honest limitations", "",
          "- The corpus is synthetic-plus-curated (PDF 8.1). Treat the numbers as a reproducible regression baseline, not real-world accuracy.",
          "- If `engine` says heuristic_fallback, the built-in keyword analyzer was evaluated (no GEMINI_API_KEY set). Re-run with a key to evaluate Gemini.",
          "- Voice-clone numbers are proxy-only until real/synthetic WAV clips are supplied; Scam Lens needs a Gemini key to be meaningful."]
    return "\n".join(L) + "\n"


def print_console(report: Dict) -> None:
    print("=" * 72)
    print("SCAMSHIELD LIVE - MEASURED EVALUATION (PDF Section 8.2)")
    print(f"engine: {report['engine']} | calls: {report['evaluated_calls']}")
    print("=" * 72)
    for t in report["targets"]:
        val = "n/a" if t["value"] is None else f"{t['value']:.2f}"
        print(f"  [{t['status']:<12}] {t['label']:<55} {val:>8}   goal {t['goal']}")
    d = report["detection"]
    print(f"\n  AUC {d['auc']:.3f} | caught@Tier2 {d['operating_point_tier2']['recall_pct']:.1f}% | "
          f"false alarms {d['false_alarms']} | scam-type acc {report['understanding']['scam_type']['accuracy']*100:.1f}%")
    print("  Per-language recall:", {k: round(v['recall_pct'], 1) for k, v in report['fairness']['per_language'].items() if v['recall_pct'] is not None})
    fr = report["fusion_rules"]
    print(f"  Fusion design rules: {fr['passed']}/{fr['total']} passed")
    if report["prompt_injection"]:
        print(f"  Prompt-injection verdicts flipped: {report['prompt_injection']['verdicts_flipped_by_injection']}")
    print(f"\n  Reports written to {REPORT_DIR}/ (evaluation_report.md|json, per_call_results.csv)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Run the ScamShield evaluation suite")
    ap.add_argument("--regenerate", action="store_true")
    ap.add_argument("--quick", action="store_true")
    ap.add_argument("--skip-injection", action="store_true")
    ap.add_argument("--asr-file", type=str, default=None)
    a = ap.parse_args()
    rep = run_all(a.regenerate, a.quick, a.skip_injection, Path(a.asr_file) if a.asr_file else None,
                  progress=lambda k, n: print(f"  ... {k}/{n} calls", flush=True))
    print_console(rep)
