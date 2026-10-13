-- ScamShield Live BigQuery Schema (Appendix C)
-- Data & Evaluation Analytics, Audit Trail, and Reputation Graph

CREATE SCHEMA IF NOT EXISTS scamshield;

-- 1. Call metadata & overall session outcome
CREATE TABLE IF NOT EXISTS scamshield.calls (
    call_id STRING OPTIONS(description="Unique call session UUID"),
    user_id STRING OPTIONS(description="Pseudonymized user ID"),
    started_at TIMESTAMP OPTIONS(description="Call initiation timestamp"),
    mode STRING OPTIONS(description="Capture mode: speaker_companion, sdk, telecom"),
    consent_ts TIMESTAMP OPTIONS(description="User explicit consent timestamp"),
    max_score INT64 OPTIONS(description="Peak fused risk score (0-100)"),
    final_tier INT64 OPTIONS(description="Final action tier reached (0-3)"),
    scam_type STRING OPTIONS(description="Classified scam playbook")
);

-- 2. Rolling time-series signals per 20s window
CREATE TABLE IF NOT EXISTS scamshield.call_signals (
    call_id STRING,
    t_offset_s INT64 OPTIONS(description="Time offset in seconds into the call"),
    tactic_json JSON OPTIONS(description="Linguistic tactic scores and quoted evidence"),
    acoustic_json JSON OPTIONS(description="Acoustic features including synthetic voice likelihood"),
    context_json JSON OPTIONS(description="Correlated banking app telemetry"),
    fused_score INT64 OPTIONS(description="Calibrated fused risk score"),
    redacted_snippet STRING OPTIONS(description="Privacy-Vault masked speech snippet")
);

-- 3. Circuit-Breaker Interventions and Guardian responses
CREATE TABLE IF NOT EXISTS scamshield.interventions (
    call_id STRING,
    ts TIMESTAMP,
    tier INT64,
    action STRING OPTIONS(description="hold_transaction, coach_prompt, guardian_alert"),
    outcome STRING OPTIONS(description="blocked, released, timeout"),
    user_override BOOL OPTIONS(description="Whether user executed manual override")
);

-- 4. Crowd-sourced number reputation & spoofing registry
CREATE TABLE IF NOT EXISTS scamshield.number_reputation (
    number_hash STRING OPTIONS(description="SHA-256 salted hash of caller MSISDN"),
    reports INT64 OPTIONS(description="Count of scam reports"),
    first_seen DATE,
    last_seen DATE,
    claimed_orgs ARRAY<STRING> OPTIONS(description="Institutions claimed by this caller"),
    spoof_suspected BOOL OPTIONS(description="Whether caller ID spoofing was indicated")
);

-- 5. Threat Intelligence and Semantic Campaign Clusters
CREATE TABLE IF NOT EXISTS scamshield.campaigns (
    campaign_id STRING,
    centroid ARRAY<FLOAT64> OPTIONS(description="Vector embedding centroid (768-dim)"),
    scam_type STRING,
    first_seen TIMESTAMP,
    volume_7d INT64,
    region_coarse STRING OPTIONS(description="High-level region e.g. Punjab, Karachi")
);
