"""
Evaluation corpus builder (PDF Section 8.1 "Dataset plan").

Produces, deterministically from a seed:
  data/eval/calls.jsonl           scam + genuine call scripts with per-turn timestamps,
                                  gold tactic labels, gold scam type, language, context timeline
  data/eval/lens_images/*.png     staged fake / genuine SMS + receipt screenshots (Scam Lens set)
  data/eval/lens_labels.json      gold labels for those images
  data/eval/dataset_manifest.json counts per class / language / playbook, seed, sha256

Size goals from the PDF: 300-500 scam scripts, 300-500 genuine scripts, 150-300 Lens images
(the Lens set here is smaller by default; raise --lens-per-class to reach the goal).

Optional: if GEMINI_API_KEY is set, `--gemini-extra N` asks Gemini for N additional scam scripts
(manually review them, as the PDF says) and appends them with source="gemini".
"""
from __future__ import annotations

import argparse
import hashlib
import json
import random
from pathlib import Path
from typing import Dict, List

from ml.evaluation.phrase_bank import (
    FILLER, GENUINE_KINDS, LANGS, SCAM_PLAYBOOKS,
)

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data" / "eval"


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
def _pick(rng: random.Random, phrases: List[tuple], lang: str):
    """Pick a phrase in `lang`; fall back to any phrase of the stage."""
    pool = [p for p in phrases if p[0] == lang] or phrases
    return rng.choice(pool)


def _call_language(turn_langs: List[str]) -> str:
    uniq = set(turn_langs)
    return uniq.pop() if len(uniq) == 1 else "mixed"


def _scam_call(rng: random.Random, idx: int, playbook: str, lang_mode: str, pressure: str) -> Dict:
    spec = SCAM_PLAYBOOKS[playbook]
    stages = spec["stages"]
    n_pressure = {"low": 1, "medium": 2, "high": 3}[pressure]

    def lang_for_turn() -> str:
        return rng.choice(LANGS) if lang_mode == "mixed" else lang_mode

    plan = [("hook", 1), ("pressure", n_pressure), ("ask", 1)]
    turns: List[Dict] = []
    t = 0.0
    # opening small talk from the user so detection time is not trivially 0
    opener_lang = lang_for_turn()
    turns.append({"t": 0, "speaker": "user", "text": rng.choice(FILLER[opener_lang]),
                  "lang": opener_lang, "tactics": [], "cue": False})
    t += rng.uniform(4, 7)
    for stage, count in plan:
        for _ in range(count):
            lang = lang_for_turn()
            l, text, tactics = _pick(rng, stages[stage], lang)
            turns.append({"t": round(t, 1), "speaker": "caller", "text": text,
                          "lang": l, "tactics": tactics, "cue": True, "stage": stage})
            t += rng.uniform(4, 7)
            if rng.random() < 0.5:
                fl = lang_for_turn()
                turns.append({"t": round(t, 1), "speaker": "user", "text": rng.choice(FILLER[fl]),
                              "lang": fl, "tactics": [], "cue": False})
                t += rng.uniform(3, 5)

    first_cue_t = min(x["t"] for x in turns if x["cue"])
    last_t = turns[-1]["t"]

    # Context timeline (Call-Transaction Correlation, Section 5.2)
    ctx_events = [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": False,
                                       "new_payee": False, "amount_vs_history": 1.0}}]
    if rng.random() < 0.75:  # 25% of victims have not opened the app yet
        t_open = round(rng.uniform(first_cue_t + 5, max(first_cue_t + 6, last_t)), 1)
        ctx_events.append({"t": t_open, "context": {"unknown_caller": True, "banking_app_open": True,
                                                    "new_payee": False, "amount_vs_history": 1.0}})
        if rng.random() < 0.8:
            ctx_events.append({"t": round(t_open + rng.uniform(3, 8), 1),
                               "context": {"unknown_caller": True, "banking_app_open": True,
                                           "new_payee": True,
                                           "amount_vs_history": round(rng.uniform(2.5, 9.0), 1)}})

    langs = [x["lang"] for x in turns if x["speaker"] == "caller"]
    return {
        "call_id": f"scam_{idx:04d}", "label": "scam", "source": "synthetic_template",
        "scam_type": playbook, "requested_action": spec["requested_action"],
        "language": _call_language(langs), "pressure": pressure,
        "gold_tactics": sorted({tc for x in turns for tc in x["tactics"]}),
        "first_cue_t": first_cue_t, "turns": turns, "context_events": ctx_events,
    }


def _genuine_call(rng: random.Random, idx: int, kind: str, lang_mode: str) -> Dict:
    pool = GENUINE_KINDS[kind]
    n_turns = rng.randint(2, 4)
    turns: List[Dict] = []
    t = 0.0
    for _ in range(n_turns):
        lang = rng.choice(LANGS) if lang_mode == "mixed" else lang_mode
        l, text = _pick(rng, pool, lang)
        turns.append({"t": round(t, 1), "speaker": "caller", "text": text,
                      "lang": l, "tactics": [], "cue": False})
        t += rng.uniform(4, 7)
        fl = rng.choice(LANGS) if lang_mode == "mixed" else lang_mode
        turns.append({"t": round(t, 1), "speaker": "user", "text": rng.choice(FILLER[fl]),
                      "lang": fl, "tactics": [], "cue": False})
        t += rng.uniform(3, 5)

    # Hard negatives: some genuine calls happen while the user pays a bill in the app.
    ctx_events = [{"t": 0, "context": {"unknown_caller": rng.random() < 0.5, "banking_app_open": False,
                                       "new_payee": False, "amount_vs_history": 1.0}}]
    if rng.random() < 0.20:
        unk = ctx_events[0]["context"]["unknown_caller"]
        ctx_events.append({"t": round(turns[-1]["t"] / 2, 1),
                           "context": {"unknown_caller": unk, "banking_app_open": True,
                                       "new_payee": rng.random() < 0.4,
                                       "amount_vs_history": round(rng.uniform(0.5, 3.0), 1)}})
    langs = [x["lang"] for x in turns if x["speaker"] == "caller"]
    return {
        "call_id": f"genuine_{idx:04d}", "label": "genuine", "source": "synthetic_template",
        "scam_type": "none", "requested_action": "none", "genuine_kind": kind,
        "language": _call_language(langs), "pressure": "none", "gold_tactics": [],
        "first_cue_t": None, "turns": turns, "context_events": ctx_events,
    }


def _curated_calls() -> List[Dict]:
    """Hand-written calls taken from the PDF (Section 5.1 examples + Appendix B)."""
    def mk(cid, label, stype, action, turns, ctx, tactics):
        return {"call_id": cid, "label": label, "source": "curated_pdf", "scam_type": stype,
                "requested_action": action, "language": "rur", "pressure": "high" if label == "scam" else "none",
                "gold_tactics": tactics, "first_cue_t": turns[0]["t"] if label == "scam" else None,
                "turns": [{**t, "lang": "rur", "speaker": "caller", "cue": label == "scam", "tactics": []} for t in turns],
                "context_events": ctx}
    c_ctx = [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": True, "new_payee": True, "amount_vs_history": 6.2}}]
    return [
        mk("curated_001", "scam", "fake_bank_officer", "share_otp",
           [{"t": 0, "text": "Aap ka account block ho raha hai, verify kar lein."},
            {"t": 6, "text": "Main State Bank security department se bol raha hoon, tell me the OTP now."}],
           c_ctx, ["authority_impersonation", "urgency_pressure", "credential_request"]),
        mk("curated_002", "scam", "wallet_reversal", "send_money",
           [{"t": 0, "text": "Ghalti se paise bhej diye, wapas kar dein."}],
           [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": False, "new_payee": False, "amount_vs_history": 1.0}}],
           ["emotional_manipulation", "payment_redirection"]),
        mk("curated_003", "scam", "prize_offer", "send_money",
           [{"t": 0, "text": "Aap ka inaam nikal aaya hai, fee jama karwain."}],
           [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": False, "new_payee": False, "amount_vs_history": 1.0}}],
           ["too_good_offer", "payment_redirection"]),
        mk("curated_004", "scam", "relative_in_trouble", "send_money",
           [{"t": 0, "text": "Mama main musibat mein hoon, kisi ko mat batana."}],
           [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": False, "new_payee": False, "amount_vs_history": 1.0}}],
           ["emotional_manipulation", "secrecy_isolation"]),
        mk("curated_005", "scam", "courier_customs_police", "send_money",
           [{"t": 0, "text": "Aap ke naam par parcel pakra gaya hai."}],
           [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": False, "new_payee": False, "amount_vs_history": 1.0}}],
           ["authority_impersonation"]),
        mk("curated_006", "scam", "sim_block", "share_otp",
           [{"t": 0, "text": "Aap ki SIM band ho jayegi, code bata dein."}],
           [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": False, "new_payee": False, "amount_vs_history": 1.0}}],
           ["urgency_pressure", "credential_request"]),
        mk("curated_007", "scam", "investment", "send_money",
           [{"t": 0, "text": "Roz ka 5 percent profit pakka hai."}],
           [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": False, "new_payee": False, "amount_vs_history": 1.0}}],
           ["too_good_offer"]),
        mk("curated_008", "genuine", "none", "none",
           [{"t": 0, "text": "Yeh aap ke bank ki taraf se yaad dehani hai, aap ka bill Friday ko due hai."}],
           [{"t": 0, "context": {"unknown_caller": False, "banking_app_open": False, "new_payee": False, "amount_vs_history": 1.0}}], []),
    ]


# ---------------------------------------------------------------------------
# Scam Lens image set (PIL rendered "screenshots")
# ---------------------------------------------------------------------------
LENS_SCAM_TEXTS = [
    ("HBL ALERT: Your account is suspended due to unverified CNIC. Click bit.ly/hbl-verify-urgent within 2 hours or debit card will be blocked.", "HBL"),
    ("JazzCash: Aap ke wallet mein Rs 25,000 inaam aaya hai. Claim karne ke liye http://jazz-claim.xyz/win par login karein foran.", "JazzCash"),
    ("Easypaisa: Suspicious login detected. Verify your PIN now at easypaisa-secure.top or account will be closed today.", "Easypaisa"),
    ("Meezan Bank: Your card expires tonight. Update details at meezan-update.info/login immediately.", "Meezan"),
    ("BISP Relief: You are selected for Rs 12,500 support. Send Rs 500 processing fee to 0300-0000000 to receive funds.", "BISP"),
    ("PTA NOTICE: Your SIM will be blocked in 24h. Reply with the code sent to you to avoid deactivation.", "PTA"),
]
LENS_GENUINE_TEXTS = [
    "HBL: Rs 1,500 debited at Imtiaz Store via Debit Card ending 4821. Balance Rs 38,210. If not you call 111-111-425.",
    "Your OTP is 482915. Do not share this code with anyone. It is valid for 5 minutes. - Meezan Bank",
    "K-Electric: Your bill of Rs 6,240 for September is due on 20 Oct. Pay via the official app or any bank branch.",
    "Easypaisa: You received Rs 3,000 from Ali Raza. TID 18422991. Thank you for using Easypaisa.",
    "Daraz: Your order #88421 has been shipped and will arrive by Friday. Track in the Daraz app.",
    "Mom: Beta dinner par aa rahe ho? Biryani bani hai, jaldi aa jao.",
]


def _render_image(text: str, path: Path, tampered: bool = False, seed: int = 0) -> None:
    from PIL import Image, ImageDraw, ImageFont
    rng = random.Random(seed)
    img = Image.new("RGB", (640, 360), (rng.randint(235, 250),) * 3)
    d = ImageDraw.Draw(img)
    try:
        font = ImageFont.load_default(size=15)
    except TypeError:  # older Pillow
        font = ImageFont.load_default()
    words, lines, cur = text.split(), [], ""
    for w in words:
        if len(cur) + len(w) > 58:
            lines.append(cur); cur = w
        else:
            cur = (cur + " " + w).strip()
    lines.append(cur)
    d.rectangle([20, 20, 620, 70], fill=(30, 100, 180))
    d.text((32, 36), "Messages", fill=(255, 255, 255), font=font)
    y = 95
    for ln in lines:
        d.text((34, y), ln, fill=(20, 20, 20), font=font); y += 24
    if tampered:  # mismatched blocks to mimic doctored fields
        d.rectangle([420, 300, 600, 330], fill=(250, 250, 250))
        d.text((428, 308), "12:07 PM 31/02", fill=(10, 10, 120), font=font)
    img.save(path)


def build_lens_set(out_dir: Path, per_class: int, seed: int) -> List[Dict]:
    img_dir = out_dir / "lens_images"
    img_dir.mkdir(parents=True, exist_ok=True)
    labels = []
    for i in range(per_class):
        text, brand = LENS_SCAM_TEXTS[i % len(LENS_SCAM_TEXTS)]
        p = img_dir / f"scam_{i:03d}.png"
        _render_image(text, p, tampered=(i % 3 == 0), seed=seed + i)
        labels.append({"file": p.name, "label": "scam", "brand": brand, "tampered": i % 3 == 0})
    for i in range(per_class):
        text = LENS_GENUINE_TEXTS[i % len(LENS_GENUINE_TEXTS)]
        p = img_dir / f"genuine_{i:03d}.png"
        _render_image(text, p, tampered=False, seed=seed + 1000 + i)
        labels.append({"file": p.name, "label": "genuine", "brand": None, "tampered": False})
    (out_dir / "lens_labels.json").write_text(json.dumps(labels, indent=2), encoding="utf-8")
    return labels


# ---------------------------------------------------------------------------
# optional Gemini extension
# ---------------------------------------------------------------------------
def _gemini_extra(n: int, seed: int) -> List[Dict]:
    from services.shared.config import settings
    if not settings.GEMINI_API_KEY or n <= 0:
        print("[dataset] --gemini-extra skipped (no GEMINI_API_KEY)")
        return []
    from google import genai
    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    out, rng = [], random.Random(seed)
    types = list(SCAM_PLAYBOOKS)
    for i in range(n):
        pb, lang = rng.choice(types), rng.choice(["Urdu script", "Roman Urdu", "Punjabi (Shahmukhi)", "English"])
        prompt = (f"Write a realistic 4-turn phone scam script for the '{pb}' playbook in {lang}. "
                  'Return JSON only: {"turns": ["...", "..."]}. Caller lines only. No real names or numbers.')
        try:
            r = client.models.generate_content(model=settings.GEMINI_MODEL_LIVE, contents=prompt,
                                               config={"response_mime_type": "application/json"})
            lines = json.loads(r.text)["turns"]
        except Exception as e:  # keep going
            print(f"[dataset] gemini sample {i} failed: {e}")
            continue
        t, turns = 0.0, []
        for ln in lines:
            turns.append({"t": round(t, 1), "speaker": "caller", "text": ln, "lang": "mixed", "tactics": [], "cue": True})
            t += 5.5
        out.append({"call_id": f"gem_{i:04d}", "label": "scam", "source": "gemini", "scam_type": pb,
                    "requested_action": SCAM_PLAYBOOKS[pb]["requested_action"], "language": "mixed",
                    "pressure": "medium", "gold_tactics": [], "first_cue_t": 0.0, "turns": turns,
                    "context_events": [{"t": 0, "context": {"unknown_caller": True, "banking_app_open": False,
                                                            "new_payee": False, "amount_vs_history": 1.0}}]})
    return out


# ---------------------------------------------------------------------------
def build_dataset(scam_per_playbook: int = 60, genuine_per_kind: int = 58, seed: int = 2026,
                  lens_per_class: int = 60, gemini_extra: int = 0, out_dir: Path = DATA_DIR) -> Dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    rng = random.Random(seed)
    calls: List[Dict] = []
    lang_modes = LANGS + ["mixed"]
    pressures = ["low", "medium", "high"]

    i = 0
    for pb in SCAM_PLAYBOOKS:
        for k in range(scam_per_playbook):
            calls.append(_scam_call(rng, i, pb, lang_modes[k % len(lang_modes)], pressures[(k // 5) % 3]))
            i += 1
    j = 0
    for kind in GENUINE_KINDS:
        for k in range(genuine_per_kind):
            calls.append(_genuine_call(rng, j, kind, lang_modes[k % len(lang_modes)]))
            j += 1
    calls += _curated_calls()
    calls += _gemini_extra(gemini_extra, seed)

    path = out_dir / "calls.jsonl"
    with path.open("w", encoding="utf-8") as f:
        for c in calls:
            f.write(json.dumps(c, ensure_ascii=False) + "\n")

    lens = build_lens_set(out_dir, lens_per_class, seed)

    def count(key, label=None):
        d: Dict[str, int] = {}
        for c in calls:
            if label and c["label"] != label:
                continue
            d[c[key]] = d.get(c[key], 0) + 1
        return d

    manifest = {
        "seed": seed,
        "n_scam_calls": sum(c["label"] == "scam" for c in calls),
        "n_genuine_calls": sum(c["label"] == "genuine" for c in calls),
        "scam_by_playbook": count("scam_type", "scam"),
        "scam_by_language": count("language", "scam"),
        "genuine_by_language": count("language", "genuine"),
        "genuine_by_kind": {k: sum(1 for c in calls if c.get("genuine_kind") == k) for k in GENUINE_KINDS},
        "n_lens_images": len(lens),
        "sources": count("source"),
        "calls_sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "note": "Synthetic-plus-curated corpus (PDF Section 8.1). Scam/genuine scripts are template-composed "
                "from ml/evaluation/phrase_bank.py; review and extend with Gemini or recorded calls before "
                "claiming real-world accuracy.",
    }
    (out_dir / "dataset_manifest.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest


def load_calls(path: Path = DATA_DIR / "calls.jsonl") -> List[Dict]:
    with path.open(encoding="utf-8") as f:
        return [json.loads(line) for line in f if line.strip()]


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Generate the ScamShield evaluation corpus")
    ap.add_argument("--scam-per-playbook", type=int, default=60)
    ap.add_argument("--genuine-per-kind", type=int, default=58)
    ap.add_argument("--lens-per-class", type=int, default=60)
    ap.add_argument("--seed", type=int, default=2026)
    ap.add_argument("--gemini-extra", type=int, default=0)
    a = ap.parse_args()
    m = build_dataset(a.scam_per_playbook, a.genuine_per_kind, a.seed, a.lens_per_class, a.gemini_extra)
    print(json.dumps(m, indent=2, ensure_ascii=False))
