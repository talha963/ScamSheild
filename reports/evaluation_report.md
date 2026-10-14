# ScamShield Live - Evaluation Report

Generated 2026-10-14T07:38:07.452546+00:00 | engine: **heuristic_fallback** | mode: full | 427 scam + 349 genuine calls

## Acceptance targets (PDF Section 8.2)

| Metric | Measured | Goal | Status |
|---|---|---|---|
| Recall at fixed false-alarm rate (FAR <= 2%) | 16.16 | >= 90.0% | FAIL |
| False-alarm rate at Tier-2 operating point | 2.01 | <= 2.0% | FAIL |
| Median time-to-detect (first cue -> Tier 2/3) | 18.35 | < 15.0s | FAIL |
| False alarms per 100 genuine calls | 2.01 | < 3.0 | PASS |
| Intervention latency (phrase -> warning visible) | 1.60 | < 3.0s | PASS |
| Worst per-language recall gap vs best language | 32.14 | <= 10.0pts | FAIL |
| Users who understand the warning and act | n/a | >= 8.0/10 | NOT_MEASURED |

## Detection

- Tier-2 operating point: recall 16.4%, false-alarm rate 2.01%
- Recall at FAR<=2%: 16.2% (threshold 61, actual FAR 1.72%)
- ROC AUC: 0.844
- Time-to-detect median 18.3 s, p90 33.3 s (n=70)
- False alarms: 7 (2.01 per 100 genuine calls)

## Per-language recall / false-alarm rate

| Language | Scam n | Recall % | Genuine n | FAR % |
|---|---|---|---|---|
| en | 84 | 32.1 | 67 | 8.96 |
| mixed | 93 | 15.1 | 79 | 1.27 |
| pa | 72 | 0.0 | 50 | 0.00 |
| rur | 92 | 31.5 | 78 | 0.00 |
| ur | 86 | 0.0 | 75 | 0.00 |

Worst-vs-best language recall gap: **32.1 points**

## Per-playbook recall

| Playbook | n | Recall % |
|---|---|---|
| courier_customs_police | 61 | 0.0 |
| fake_bank_officer | 61 | 37.7 |
| investment | 61 | 0.0 |
| prize_offer | 61 | 0.0 |
| relative_in_trouble | 61 | 31.1 |
| sim_block | 61 | 44.3 |
| wallet_reversal | 61 | 1.6 |

## Understanding what was said (extraction quality)

- Scam-type accuracy 14.8%, macro-F1 0.143
- Requested-action accuracy 24.6%
- Evidence phrase present for 100.0% of fired tactics
- Output schema valid for 100.00% of windows

| Tactic | Precision | Recall | F1 |
|---|---|---|---|
| authority_impersonation | 0.67 | 0.23 | 0.35 |
| urgency_pressure | 1.00 | 0.06 | 0.11 |
| secrecy_isolation | 1.00 | 0.31 | 0.47 |
| credential_request | 1.00 | 0.49 | 0.66 |
| remote_access_request | 0.00 | 0.00 | 0.00 |
| payment_redirection | 0.00 | 0.00 | 0.00 |
| emotional_manipulation | 1.00 | 0.39 | 0.56 |
| too_good_offer | 0.00 | 0.00 | 0.00 |

## Latency

- Measured analysis+fusion: p50 0.02 ms, p95 0.03 ms
- Projected end-to-end (adds PDF 6.2 budget for capture/STT/action): 1.60 s

## Calibration

- ECE 0.303, Brier 0.271

## Fusion design rules

- 18/18 checks passed
  - PASS: NOTE hard stop fires with app open but no payee/amount (PDF says 'payment in progress') - tier=3. Implementation uses banking_app_open as the payment proxy; consider also requiring new_payee or amount_vs_history to match the PDF wording.

## Voice-Clone Shield

- data source: PROXY_SIGNALS | synthetic recall 50.0% | false flag on real 18.0% | AUC 0.630 | EER 0.460
- WARNING: Proxy signals were used because data/eval/audio/{real,synthetic}/*.wav were not found. These numbers test the plumbing, NOT real deepfake detection. Add ASVspoof-style or TTS-cloned clips (name files <group>_<anything>.wav) and re-run.

## Scam Lens

- engine heuristic_fallback | scam recall 100.0% | false-flag on genuine 100.0% | brand accuracy 16.7%
- WARNING: The offline fallback returns the same 'scam' verdict for every image, so the false-flag rate is 100%. Set GEMINI_API_KEY to evaluate the real vision model.

## Prompt-injection robustness

- recall without injection 19.2% -> with injection 19.2%; verdicts flipped: 0

## User comprehension

- testers: 0 | passed: 0 | Collect at least 10 testers before reporting this metric.

## Honest limitations

- The corpus is synthetic-plus-curated (PDF 8.1). Treat the numbers as a reproducible regression baseline, not real-world accuracy.
- If `engine` says heuristic_fallback, the built-in keyword analyzer was evaluated (no GEMINI_API_KEY set). Re-run with a key to evaluate Gemini.
- Voice-clone numbers are proxy-only until real/synthetic WAV clips are supplied; Scam Lens needs a Gemini key to be meaningful.
