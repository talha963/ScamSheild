# ScamShield Live - Evaluation Suite (PDF Section 8)

Everything in the PDF that is *evaluation* is implemented here. All numbers are **measured**, never hard-coded.

```bash
pip install -r requirements.txt
python ml/evaluation/run_evaluation.py              # full run (~seconds with fallback, longer with Gemini)
python ml/evaluation/run_evaluation.py --regenerate # rebuild the synthetic corpus first
python ml/evaluation/run_evaluation.py --quick      # sample run
python ml/notebooks/evaluation_metrics.py           # same thing, original entry point
pytest tests/ -q                                    # unit tests
```
Outputs: `reports/evaluation_report.md`, `reports/evaluation_report.json`, `reports/per_call_results.csv`.
In the web app: **Evaluation** tab (run benchmark, read results, speak-and-evaluate, comprehension test).

## What "speak -> extract -> evaluate" means
`pipeline.py` replays each call chunk by chunk exactly like `services/audio_gateway/gateway.py`:
rolling 4-chunk (~20 s) window -> analysis engine (Gemini if `GEMINI_API_KEY` is set, otherwise the built-in
heuristic) extracts tactics + evidence phrase, scam type, claimed organisation, requested action, next ask and
a warning -> Risk Fusion Engine combines that with call context -> 0-100 score and tier.

## PDF requirement -> where it lives
| PDF item | Implementation |
|---|---|
| 8.1 Scam scripts (300-500, Urdu/Punjabi/English/Roman Urdu, varied pressure) | `dataset_generator.py` + `phrase_bank.py` (427 scam calls, 7 playbooks, 5 language modes, low/medium/high pressure) |
| 8.1 Genuine scripts incl. tricky "urgent but real" | 349 genuine calls, 6 kinds incl. `urgent_but_real`, some with banking app open |
| 8.1 Audio / synthetic-voice set | `evaluate_voice_clone()` reads `data/eval/audio/{real,synthetic}/*.wav`; falls back to clearly-labelled proxy signals |
| 8.1 Scam Lens images (150-300) | PIL-rendered fake/genuine SMS images; `--lens-per-class` scales it |
| 8.2 Recall at fixed false-alarm rate | `metrics.recall_at_far` (FAR <= 2%), plus ROC and AUC |
| 8.2 Time-to-detect (median < 15 s) | first scam cue -> first Tier 2/3, median + p90 |
| 8.2 False alarms per 100 genuine (< 3) | computed on genuine calls reaching Tier 2+ |
| 8.2 Intervention latency (< 3 s) | measured analysis+fusion time + PDF 6.2 budget for capture/STT/action |
| 8.2 Per-language performance (gap <= 10 pts) | Urdu, Roman Urdu, Punjabi, English, mixed |
| 8.2 User comprehension (8 of 10) | UI form + `POST /v1/evaluation/comprehension` -> `data/eval/comprehension_responses.json` |
| 7.2 Calibration | ECE + Brier + reliability bins |
| 5.2/5.3/7.2 design rules | `evaluate_fusion_rules()` (18 checks: no single weak signal holds a payment, hard stop, never-fall-quickly, tier boundaries, safe-word, action ladder) |
| 7.3 / Risks: prompt injection | `evaluate_injection()` appends injection text to scam calls and counts flipped verdicts |
| 9 Fairness testing | per-language and per-voice-group breakdowns |
| F2 Code-Switch Listener | `--asr-file` scores STT output with WER/CER per language |
| F3 Scam Playbook Classifier | scam-type accuracy, macro-F1, confusion matrix, requested-action accuracy, per-tactic P/R/F1 |
| F7 Voice-Clone Shield | AUC, EER, recall, false-flag rate, per-group gap |
| F9 Scam Lens | verdict recall, false-flag rate, brand and tamper accuracy |

## Honest reading of the numbers
* The corpus is synthetic-plus-curated: a reproducible regression baseline, not real-world accuracy.
* Without `GEMINI_API_KEY` the keyword fallback is what gets evaluated (the report says so). Re-run with a key to evaluate Gemini.
* Voice-clone results are plumbing tests until real WAV clips are added. Scam Lens needs a Gemini key to be meaningful.
* To add real data: drop `.wav` files into `data/eval/audio/real|synthetic/` (name them `<group>_<id>.wav`), add scripts to `phrase_bank.py` or use `dataset_generator.py --gemini-extra N`, then re-run.
