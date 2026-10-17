from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import uuid
from typing import Dict, List, Optional
from services.shared.schemas import (
    BankAccount,
    BankHoldRequest,
    BankHoldResponse,
    BankStepUpRequest,
    BankPayeeRiskResponse,
    FraudCaseReport,
    RiskTier,
)

app = FastAPI(
    title="ScamShield Mock Bank Service",
    description="Implements documented bank API surface: /bank/holds, /bank/step-up, /bank/payee-risk, /bank/fraud-cases",
    version="1.0.0"
)

# In-memory storage for mock bank state
accounts_db: Dict[str, BankAccount] = {
    "acc_pk_9941": BankAccount(
        account_id="acc_pk_9941",
        account_number="PK60HABB00018492019482",
        holder_name="Tariq Mahmood",
        balance=245000.0,
        currency="PKR"
    )
}

holds_db: Dict[str, dict] = {}
fraud_cases_db: List[dict] = []
audit_log: List[dict] = []

known_payees_db: Dict[str, dict] = {
    "PK92KELEC0001928374": {"is_new": False, "risk_level": "low", "fraud_reports": 0},
    "PK44MBL00098472910": {"is_new": True, "risk_level": "mule_suspect", "fraud_reports": 5},
    "PK12EPAY9988776655": {"is_new": True, "risk_level": "high", "fraud_reports": 2},
}

@app.get("/accounts/{account_id}", response_model=BankAccount)
@app.get("/bank/accounts/{account_id}", response_model=BankAccount)
def get_account(account_id: str):
    if account_id not in accounts_db:
        raise HTTPException(status_code=404, detail="Account not found")
    return accounts_db[account_id]

@app.get("/payee-risk", response_model=BankPayeeRiskResponse)
@app.get("/bank/payee-risk", response_model=BankPayeeRiskResponse)
def check_payee_risk(payee_account: str):
    """
    Checks payee account against historical mule account registry
    """
    payee_data = known_payees_db.get(payee_account, {"is_new": True, "risk_level": "mule_suspect", "fraud_reports": 1})
    return BankPayeeRiskResponse(
        payee_account=payee_account,
        is_new=payee_data["is_new"],
        risk_level=payee_data["risk_level"],
        historical_fraud_reports=payee_data["fraud_reports"]
    )

@app.post("/holds", response_model=BankHoldResponse)
@app.post("/bank/holds", response_model=BankHoldResponse)
def create_or_escalate_hold(req: BankHoldRequest):
    """
    Circuit-Breaker hook called by ADK Guardian Agent:
    Places an immediate hold on high-risk outgoing transactions.
    """
    hold_id = f"hold_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)

    hold_record = {
        "hold_id": hold_id,
        "call_id": req.call_id,
        "account_id": req.account_id,
        "payee_account": req.payee_account,
        "amount": req.amount,
        "tier": req.tier,
        "reason": req.reason,
        "status": "held",
        "created_at": now
    }

    holds_db[hold_id] = hold_record
    audit_log.append({
        "timestamp": now.isoformat(),
        "action": "TRANSACTION_HOLD_PLACED",
        "hold_id": hold_id,
        "amount": req.amount,
        "tier": req.tier,
        "reason": req.reason
    })

    return BankHoldResponse(
        hold_id=hold_id,
        status="held",
        amount=req.amount,
        created_at=now,
        message=f"Circuit-breaker engaged at Tier {req.tier}. Outgoing transfer paused."
    )

@app.post("/step-up")
@app.post("/bank/step-up")
def execute_step_up_resolution(req: BankStepUpRequest):
    """
    Called upon Guardian approval or branch callback verification.
    """
    if req.hold_id not in holds_db:
        raise HTTPException(status_code=404, detail="Hold reference not found")

    hold = holds_db[req.hold_id]
    now = datetime.now(timezone.utc)

    if req.verification_method == "guardian_approval":
        hold["status"] = "released"
        # Deduct balance
        acc = accounts_db.get(hold["account_id"])
        if acc:
            acc.balance -= hold["amount"]

        audit_log.append({
            "timestamp": now.isoformat(),
            "action": "HOLD_RELEASED_GUARDIAN_APPROVED",
            "hold_id": req.hold_id,
            "authorized_by": req.authorized_by
        })
        return {"status": "released", "message": "Transfer released after Guardian verification"}

    elif req.verification_method == "branch_override":
        hold["status"] = "released"
        audit_log.append({
            "timestamp": now.isoformat(),
            "action": "HOLD_RELEASED_BRANCH_OVERRIDE",
            "hold_id": req.hold_id
        })
        return {"status": "released", "message": "Manual override confirmed"}

    elif req.verification_method in ["cancel_by_user", "reverse_by_guardian"]:
        hold["status"] = "reversed_by_guardian" if req.verification_method == "reverse_by_guardian" else "cancelled_by_user"
        audit_log.append({
            "timestamp": now.isoformat(),
            "action": "TRANSACTION_REVERSED_MONEY_SAVED",
            "hold_id": req.hold_id,
            "amount_saved": hold["amount"],
            "authorized_by": req.authorized_by,
            "reason": req.comments or "Family guardian reversed transfer during 15-minute cooling-off period"
        })
        return {
            "status": "reversed",
            "message": f"Transaction safely reversed by {req.authorized_by}. 100% of PKR {hold['amount']:,.2f} preserved in account."
        }

    else:
        hold["status"] = "blocked"
        return {"status": "blocked", "message": "Transfer permanently cancelled"}

@app.post("/holds/create-15min")
@app.post("/bank/holds/create-15min")
def create_15min_safety_hold(data: dict):
    hold_id = f"hold_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    amount = float(data.get("amount", 85000.0))
    account_id = data.get("account_id", "acc_pk_9941")
    payee_name = data.get("payee_name", "Unknown Payee")
    payee_account = data.get("payee_account", "PK44MBL00098472910")
    guardian_name = data.get("guardian_name", "Hamza Tariq (Son)")
    guardian_phone = data.get("guardian_phone", "+92 300 9876543")
    guardian_email = data.get("guardian_email", "hamza.tariq@gmail.com")

    hold_record = {
        "hold_id": hold_id,
        "account_id": account_id,
        "amount": amount,
        "payee_name": payee_name,
        "payee_account": payee_account,
        "guardian_name": guardian_name,
        "guardian_phone": guardian_phone,
        "guardian_email": guardian_email,
        "duration_seconds": 900,  # 15 minutes
        "status": "cooling_off_escrow",
        "reason": "ScamShield Phone Interceptor: High-risk urgency call in progress",
        "created_at": now.isoformat()
    }
    holds_db[hold_id] = hold_record
    audit_log.append({
        "timestamp": now.isoformat(),
        "action": "15_MIN_SAFETY_ESCROW_STARTED",
        "hold_id": hold_id,
        "amount": amount,
        "payee": payee_name,
        "guardian_notified": guardian_name
    })

    # Dispatch to n8n Guardian Circle Workflow in background
    try:
        import urllib.request
        import json as _json
        n8n_url = "http://scamshield-n8n:5678/webhook/guardian-alert"
        payload = {
            "hold_id": hold_id,
            "user_name": "Tariq Mahmood",
            "user_account": account_id,
            "amount": amount,
            "currency": "PKR",
            "tier": 3,
            "scam_type": "Phone Urgency Imposter (Coerced Transfer Attempt)",
            "payee_name": payee_name,
            "payee_account": payee_account,
            "guardian_name": guardian_name,
            "guardian_phone": guardian_phone,
            "guardian_email": guardian_email,
            "hold_duration_seconds": 900
        }
        req = urllib.request.Request(
            n8n_url,
            data=_json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        urllib.request.urlopen(req, timeout=1.2)
    except Exception:
        pass

    return hold_record

@app.post("/fraud-cases", response_model=FraudCaseReport)
@app.post("/bank/fraud-cases", response_model=FraudCaseReport)
def record_fraud_case(case_data: dict):
    case_id = f"fraud_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    report = {
        "case_id": case_id,
        "call_id": case_data.get("call_id", "unknown"),
        "account_id": case_data.get("account_id", "acc_pk_9941"),
        "loss_prevented": float(case_data.get("amount", 85000.0)),
        "scam_type": case_data.get("scam_type", "fake_bank_officer"),
        "status": "prevented",
        "created_at": now
    }
    fraud_cases_db.append(report)
    return FraudCaseReport(**report)

@app.get("/audit-log")
@app.get("/bank/audit-log")
def get_audit_trail():
    return {"events": audit_log, "total_events": len(audit_log)}
