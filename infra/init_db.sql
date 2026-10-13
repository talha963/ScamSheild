-- ==============================================================================
-- ScamShield Database Initialization Script (PostgreSQL / AlloyDB compatible)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_accounts (
    account_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id),
    account_number VARCHAR(64) UNIQUE NOT NULL,
    holder_name VARCHAR(255) NOT NULL,
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(8) DEFAULT 'PKR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_payees (
    payee_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    account_number VARCHAR(64) NOT NULL,
    bank_name VARCHAR(128) NOT NULL,
    is_new BOOLEAN DEFAULT FALSE,
    risk_level VARCHAR(32) DEFAULT 'low',
    fraud_reports INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS guardians (
    guardian_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id),
    name VARCHAR(255) NOT NULL,
    relationship VARCHAR(64) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    whatsapp_enabled BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS call_sessions (
    call_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(user_id),
    caller_number VARCHAR(32) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    max_score INT DEFAULT 0,
    final_tier INT DEFAULT 0,
    scam_type VARCHAR(64),
    consent_recorded BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS bank_holds (
    hold_id VARCHAR(64) PRIMARY KEY,
    call_id VARCHAR(64),
    account_id VARCHAR(64) REFERENCES bank_accounts(account_id),
    payee_account VARCHAR(64),
    amount NUMERIC(14, 2) NOT NULL,
    tier INT NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) DEFAULT 'held',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Demo Data
INSERT INTO users (user_id, name, phone)
VALUES ('usr_tariq_01', 'Tariq Mahmood', '+92 300 1234567')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO bank_accounts (account_id, user_id, account_number, holder_name, balance, currency)
VALUES ('acc_pk_9941', 'usr_tariq_01', 'PK60HABB00018492019482', 'Tariq Mahmood', 245000.00, 'PKR')
ON CONFLICT (account_id) DO NOTHING;

INSERT INTO bank_payees (payee_id, name, account_number, bank_name, is_new, risk_level, fraud_reports)
VALUES 
    ('p_1', 'K-Electric Bill Payment', 'PK92KELEC0001928374', 'HBL Bills', FALSE, 'low', 0),
    ('p_2', 'Muhammad Rizwan (Unknown)', 'PK44MBL00098472910', 'Meezan Bank', TRUE, 'mule_suspect', 5),
    ('p_3', 'Emergency Relief Cashier', 'PK12EPAY9988776655', 'Easypaisa', TRUE, 'high', 2)
ON CONFLICT (payee_id) DO NOTHING;

INSERT INTO guardians (guardian_id, user_id, name, relationship, phone, whatsapp_enabled, is_primary)
VALUES 
    ('g_1', 'usr_tariq_01', 'Hamza Tariq (Son)', 'Son', '+92 300 8291034', TRUE, TRUE),
    ('g_2', 'usr_tariq_01', 'Amina Tariq (Daughter)', 'Daughter', '+92 321 4458920', TRUE, FALSE)
ON CONFLICT (guardian_id) DO NOTHING;
