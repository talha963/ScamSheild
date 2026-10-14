"""
Pure metric functions for ScamShield evaluation (PDF Section 8.2).
Only numpy is required.  No metric here is hard-coded: everything is computed from predictions.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from typing import Dict, Iterable, List, Optional, Sequence

import numpy as np

# Hackathon targets from PDF Section 8.2 (name -> (comparison, value, unit, label))
TARGETS = {
    "recall_at_far":        (">=", 90.0, "%",  "Recall at fixed false-alarm rate (FAR <= 2%)"),
    "far_at_operating_pt":  ("<=", 2.0,  "%",  "False-alarm rate at Tier-2 operating point"),
    "time_to_detect_p50":   ("<",  15.0, "s",  "Median time-to-detect (first cue -> Tier 2/3)"),
    "false_alarms_per_100": ("<",  3.0,  "",   "False alarms per 100 genuine calls"),
    "intervention_latency": ("<",  3.0,  "s",  "Intervention latency (phrase -> warning visible)"),
    "language_gap":         ("<=", 10.0, "pts", "Worst per-language recall gap vs best language"),
    "user_comprehension":   (">=", 8.0,  "/10", "Users who understand the warning and act"),
}


def check_target(name: str, value: Optional[float]) -> Dict:
    op, goal, unit, label = TARGETS[name]
    if value is None:
        return {"metric": name, "label": label, "value": None, "goal": f"{op} {goal}{unit}", "status": "NOT_MEASURED"}
    ok = {">=": value >= goal, "<=": value <= goal, "<": value < goal, ">": value > goal}[op]
    return {"metric": name, "label": label, "value": round(float(value), 3), "goal": f"{op} {goal}{unit}",
            "status": "PASS" if ok else "FAIL"}


# ---------------------------------------------------------------------------
# Detection metrics
# ---------------------------------------------------------------------------
def rates_at_threshold(scam_scores: Sequence[float], genuine_scores: Sequence[float], thr: float) -> Dict:
    s, g = np.asarray(scam_scores, float), np.asarray(genuine_scores, float)
    recall = float((s >= thr).mean()) if len(s) else float("nan")
    far = float((g >= thr).mean()) if len(g) else float("nan")
    return {"threshold": float(thr), "recall": recall, "far": far}


def recall_at_far(scam_scores, genuine_scores, far_target: float = 0.02) -> Dict:
    """Lowest threshold whose false-alarm rate <= far_target; returns recall at that point."""
    g = np.asarray(genuine_scores, float)
    best = None
    for thr in range(0, 102):
        r = rates_at_threshold(scam_scores, g, thr)
        if r["far"] <= far_target:
            best = r
            break
    if best is None:
        best = rates_at_threshold(scam_scores, g, 101)
    return best


def roc_curve(scam_scores, genuine_scores) -> Dict:
    pts = []
    for thr in range(0, 102):
        r = rates_at_threshold(scam_scores, genuine_scores, thr)
        pts.append({"threshold": thr, "tpr": r["recall"], "fpr": r["far"]})
    s, g = np.asarray(scam_scores, float), np.asarray(genuine_scores, float)
    if len(s) and len(g):  # Mann-Whitney AUC with tie handling
        gt = (s[:, None] > g[None, :]).sum()
        eq = (s[:, None] == g[None, :]).sum()
        auc = float((gt + 0.5 * eq) / (len(s) * len(g)))
    else:
        auc = float("nan")
    return {"auc": auc, "points": pts}


def time_to_detect_stats(ttd: Sequence[float]) -> Dict:
    a = np.asarray([x for x in ttd if x is not None], float)
    if not len(a):
        return {"n": 0, "p50": None, "p90": None, "mean": None, "max": None}
    return {"n": int(len(a)), "p50": float(np.median(a)), "p90": float(np.percentile(a, 90)),
            "mean": float(a.mean()), "max": float(a.max())}


def latency_stats(ms: Sequence[float]) -> Dict:
    a = np.asarray(ms, float)
    if not len(a):
        return {"n": 0}
    return {"n": int(len(a)), "p50_ms": float(np.percentile(a, 50)), "p95_ms": float(np.percentile(a, 95)),
            "p99_ms": float(np.percentile(a, 99)), "max_ms": float(a.max())}


# ---------------------------------------------------------------------------
# Per-group / fairness
# ---------------------------------------------------------------------------
def per_group_detection(rows: Iterable[Dict], group_key: str, thr: float = 60) -> Dict:
    """rows: dicts with label ('scam'/'genuine'), max_score and group_key."""
    buckets: Dict[str, Dict[str, List[float]]] = defaultdict(lambda: {"scam": [], "genuine": []})
    for r in rows:
        buckets[r[group_key]][r["label"]].append(r["max_score"])
    out = {}
    for grp, d in sorted(buckets.items()):
        rec = float((np.asarray(d["scam"]) >= thr).mean() * 100) if d["scam"] else None
        far = float((np.asarray(d["genuine"]) >= thr).mean() * 100) if d["genuine"] else None
        out[grp] = {"n_scam": len(d["scam"]), "n_genuine": len(d["genuine"]),
                    "recall_pct": rec, "far_pct": far}
    return out


def max_gap(per_group: Dict, key: str = "recall_pct") -> Optional[float]:
    vals = [v[key] for v in per_group.values() if v.get(key) is not None]
    return float(max(vals) - min(vals)) if len(vals) >= 2 else None


# ---------------------------------------------------------------------------
# Classification quality (scam type / requested action / tactics)
# ---------------------------------------------------------------------------
def confusion(gold: Sequence[str], pred: Sequence[str], labels: Sequence[str]) -> Dict:
    idx = {l: i for i, l in enumerate(labels)}
    m = np.zeros((len(labels), len(labels)), int)
    for g, p in zip(gold, pred):
        if g in idx and p in idx:
            m[idx[g], idx[p]] += 1
        elif g in idx:  # prediction outside label set -> count in 'uncertain'/'none' if exists
            m[idx[g], idx.get("uncertain", idx.get("none", 0))] += 1
    return {"labels": list(labels), "matrix": m.tolist()}


def classification_report(gold: Sequence[str], pred: Sequence[str], labels: Sequence[str]) -> Dict:
    out, f1s = {}, []
    for l in labels:
        tp = sum(1 for g, p in zip(gold, pred) if g == l and p == l)
        fp = sum(1 for g, p in zip(gold, pred) if g != l and p == l)
        fn = sum(1 for g, p in zip(gold, pred) if g == l and p != l)
        prec = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
        support = tp + fn
        out[l] = {"precision": prec, "recall": rec, "f1": f1, "support": support}
        if support:
            f1s.append(f1)
    acc = float(np.mean([g == p for g, p in zip(gold, pred)])) if len(gold) else float("nan")
    return {"accuracy": acc, "macro_f1": float(np.mean(f1s)) if f1s else float("nan"), "per_class": out}


def multilabel_prf(gold_sets: List[set], pred_sets: List[set], labels: Sequence[str]) -> Dict:
    out = {}
    for l in labels:
        tp = sum(1 for g, p in zip(gold_sets, pred_sets) if l in g and l in p)
        fp = sum(1 for g, p in zip(gold_sets, pred_sets) if l not in g and l in p)
        fn = sum(1 for g, p in zip(gold_sets, pred_sets) if l in g and l not in p)
        prec = tp / (tp + fp) if tp + fp else 0.0
        rec = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * prec * rec / (prec + rec) if prec + rec else 0.0
        out[l] = {"precision": prec, "recall": rec, "f1": f1, "tp": tp, "fp": fp, "fn": fn}
    return out


# ---------------------------------------------------------------------------
# Calibration (PDF 7.2: "a score of 90 means roughly what it says")
# ---------------------------------------------------------------------------
def calibration(scores: Sequence[float], labels: Sequence[int], n_bins: int = 10) -> Dict:
    p = np.asarray(scores, float) / 100.0
    y = np.asarray(labels, float)
    bins = np.linspace(0, 1, n_bins + 1)
    rel, ece = [], 0.0
    for i in range(n_bins):
        hi_incl = i == n_bins - 1
        mask = (p >= bins[i]) & ((p <= bins[i + 1]) if hi_incl else (p < bins[i + 1]))
        if mask.sum():
            conf, acc = float(p[mask].mean()), float(y[mask].mean())
            ece += mask.mean() * abs(conf - acc)
            rel.append({"bin": f"{bins[i]:.1f}-{bins[i+1]:.1f}", "n": int(mask.sum()), "mean_score": conf, "scam_rate": acc})
    return {"ece": float(ece), "brier": float(np.mean((p - y) ** 2)), "reliability": rel}


# ---------------------------------------------------------------------------
# Speech-extraction quality (Code-Switch Listener, F2)
# ---------------------------------------------------------------------------
def _edit_distance(a: Sequence[str], b: Sequence[str]) -> int:
    dp = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        prev, dp[0] = dp[0], i
        for j in range(1, len(b) + 1):
            cur = dp[j]
            dp[j] = min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] != b[j - 1]))
            prev = cur
    return dp[-1]


def wer(reference: str, hypothesis: str) -> float:
    r, h = reference.split(), hypothesis.split()
    return _edit_distance(r, h) / max(1, len(r))


def cer(reference: str, hypothesis: str) -> float:
    r, h = list(reference.replace(" ", "")), list(hypothesis.replace(" ", ""))
    return _edit_distance(r, h) / max(1, len(r))


def equal_error_rate(pos_scores: Sequence[float], neg_scores: Sequence[float]) -> float:
    pos, neg = np.asarray(pos_scores, float), np.asarray(neg_scores, float)
    best, best_gap = 0.5, 9.9
    for thr in np.unique(np.concatenate([pos, neg, [0.0, 1.0]])):
        fnr = float((pos < thr).mean())
        fpr = float((neg >= thr).mean())
        if abs(fnr - fpr) < best_gap:
            best_gap, best = abs(fnr - fpr), (fnr + fpr) / 2
    return float(best)
