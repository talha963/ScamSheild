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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    now = datetime.now(timezone.utc)
    if req.hold_id not in holds_db:
        holds_db[req.hold_id] = {
            "hold_id": req.hold_id,
            "account_id": "acc_pk_9941",
            "amount": 85000.0,
            "status": "cooling_off_escrow",
            "payee_name": "Ali Raza (Unverified Mule Account)",
            "guardian_name": req.authorized_by or "Family Guardian",
            "created_at": now.isoformat()
        }

    hold = holds_db[req.hold_id]

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

from fastapi.responses import HTMLResponse
from services.notifications.dispatcher import (
    generate_guardian_alert,
    send_real_email,
    send_real_sms,
    get_notification_config,
    save_notification_config,
    alerts_cache,
)

@app.post("/holds/create-15min")
@app.post("/bank/holds/create-15min")
def create_15min_safety_hold(data: dict):
    hold_id = data.get("hold_id") or f"hold_{uuid.uuid4().hex[:8]}"
    now = datetime.now(timezone.utc)
    amount = float(data.get("amount", 85000.0))
    account_id = data.get("account_id", "acc_pk_9941")
    payee_name = data.get("payee_name", "Unknown Payee")
    payee_account = data.get("payee_account", "PK44MBL00098472910")
    guardian_name = data.get("guardian_name", "Hamza Tariq (Son)")
    guardian_phone = data.get("guardian_phone", "+92 300 9876543")
    guardian_email = data.get("guardian_email", "hamza.tariq@gmail.com")

    # Generate tailored multi-channel alerts (SMS & Responsive HTML Email)
    alert_info = generate_guardian_alert(
        hold_id=hold_id,
        user_name="Tariq Mahmood",
        amount=amount,
        currency="PKR",
        payee_name=payee_name,
        payee_account=payee_account,
        scam_type="Phone Urgency Imposter (Coerced Transfer Attempt)",
        guardian_name=guardian_name,
        guardian_phone=guardian_phone,
        guardian_email=guardian_email
    )

    # Attempt direct real email delivery (SMTP) to the exact address the user entered
    email_delivery_result = send_real_email(
        to_email=guardian_email,
        subject=alert_info["email_subject"],
        html_content=alert_info["email_html"],
        text_content=alert_info["sms_body"]
    )

    # Attempt direct real SMS delivery (Twilio) to the exact phone number the user entered
    sms_delivery_result = send_real_sms(
        phone_number=guardian_phone,
        message_text=alert_info["sms_body"]
    )

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
        "created_at": now.isoformat(),
        "email_delivery": email_delivery_result,
        "sms_delivery": sms_delivery_result,
        "sms_body": alert_info["sms_body"],
        "email_subject": alert_info["email_subject"],
        "reverse_url": alert_info["reverse_url"],
        "preview_url": f"/bank/notifications/preview/{hold_id}"
    }
    holds_db[hold_id] = hold_record

    audit_log.append({
        "timestamp": now.isoformat(),
        "action": "15_MIN_SAFETY_ESCROW_STARTED",
        "hold_id": hold_id,
        "amount": amount,
        "payee": payee_name,
        "guardian_notified": guardian_name,
        "guardian_email": guardian_email,
        "guardian_phone": guardian_phone,
        "email_delivery": email_delivery_result,
        "sms_delivery": sms_delivery_result
    })

    # Also notify n8n Guardian Circle Workflow in background
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
            "hold_duration_seconds": 900,
            "reverse_url": alert_info["reverse_url"]
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

# -----------------------------------------------------------------------------
# Gateway Notification Management & Direct Preview Endpoints
# -----------------------------------------------------------------------------

@app.get("/notifications/config")
@app.get("/bank/notifications/config")
def get_gateway_config():
    """Returns current SMTP and Twilio configuration (passwords masked)."""
    return get_notification_config(mask_secrets=True)

@app.post("/notifications/config")
@app.post("/bank/notifications/config")
def update_gateway_config(config_data: dict):
    """Saves updated SMTP or Twilio settings for live email/SMS sending."""
    updated = save_notification_config(config_data)
    audit_log.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": "GATEWAY_CONFIG_UPDATED",
        "smtp_host": updated.get("smtp_host"),
        "smtp_user": updated.get("smtp_user")
    })
    return {"status": "saved", "config": updated}

@app.post("/notifications/test-email")
@app.post("/bank/notifications/test-email")
def test_send_email(data: dict):
    """
    Sends a test rich HTML alert to the specified recipient email.
    """
    # 1. If credentials were provided in the test payload, persist them automatically!
    if data.get("smtp_user") or data.get("smtp_password"):
        save_notification_config(data)

    to_email = data.get("email") or data.get("smtp_user") or "hamza.tariq@gmail.com"
    dummy_hold = f"test_{uuid.uuid4().hex[:6]}"
    alert = generate_guardian_alert(
        hold_id=dummy_hold,
        user_name="Tariq Mahmood",
        amount=85000.0,
        currency="PKR",
        guardian_name="Guardian Delegate",
        guardian_phone="+92 300 9876543",
        guardian_email=to_email
    )
    result = send_real_email(
        to_email=to_email,
        subject=f"[Test] {alert['email_subject']}",
        html_content=alert["email_html"],
        text_content=alert["sms_body"],
        override_config=data
    )
    audit_log.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": "TEST_EMAIL_DISPATCHED",
        "recipient": to_email,
        "result": result
    })
    return result

@app.post("/notifications/test-sms")
@app.post("/bank/notifications/test-sms")
def test_send_sms(data: dict):
    """
    Sends a test SMS to the specified phone number.
    """
    phone = data.get("phone") or "+92 300 9876543"
    msg = f"🚨 [ScamShield Test] Emergency family alert test sent to {phone}. Gateway verified."
    result = send_real_sms(phone, msg)
    audit_log.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": "TEST_SMS_DISPATCHED",
        "phone": phone,
        "result": result
    })
    return result

@app.get("/notifications/preview/{hold_id}", response_class=HTMLResponse)
@app.get("/bank/notifications/preview/{hold_id}", response_class=HTMLResponse)
def preview_email_html(hold_id: str):
    """
    Serves the beautiful, responsive HTML email directly in the browser.
    """
    if hold_id in alerts_cache:
        return HTMLResponse(content=alerts_cache[hold_id]["email_html"], status_code=200)

    # Fallback if hold exists in DB
    if hold_id in holds_db:
        h = holds_db[hold_id]
        alert = generate_guardian_alert(
            hold_id=hold_id,
            user_name="Tariq Mahmood",
            amount=h["amount"],
            currency="PKR",
            payee_name=h.get("payee_name", "Unknown Payee"),
            guardian_name=h.get("guardian_name", "Family Guardian"),
            guardian_phone=h.get("guardian_phone", "+92 300 9876543"),
            guardian_email=h.get("guardian_email", "hamza.tariq@gmail.com")
        )
        return HTMLResponse(content=alert["email_html"], status_code=200)

    # Fallback sample preview
    sample = generate_guardian_alert(
        hold_id=hold_id,
        user_name="Tariq Mahmood",
        amount=85000.0,
        currency="PKR"
    )
    return HTMLResponse(content=sample["email_html"], status_code=200)

@app.get("/webhook/guardian-decision", response_class=HTMLResponse)
@app.get("/guardian-decision", response_class=HTMLResponse)
@app.get("/bank/guardian-decision", response_class=HTMLResponse)
def handle_guardian_decision(action: str = "block", hold_id: str = "", guardian: str = "Family Guardian"):
    """
    Public decision handler triggered when family member taps button in SMS or Email.
    """
    now = datetime.now(timezone.utc)
    amount_saved = 85000.0

    if hold_id in holds_db:
        hold = holds_db[hold_id]
        amount_saved = hold.get("amount", 85000.0)
        if action == "block":
            hold["status"] = "reversed_by_guardian"
            audit_log.append({
                "timestamp": now.isoformat(),
                "action": "TRANSACTION_REVERSED_MONEY_SAVED",
                "hold_id": hold_id,
                "amount_saved": amount_saved,
                "authorized_by": f"Family Guardian: {guardian}",
                "reason": "1-Tap Reversal link clicked from SMS / Email"
            })
        else:
            hold["status"] = "released"
            audit_log.append({
                "timestamp": now.isoformat(),
                "action": "HOLD_RELEASED_GUARDIAN_APPROVED",
                "hold_id": hold_id,
                "authorized_by": f"Family Guardian: {guardian}"
            })
    else:
        # Register hold so client polling catches reversal immediately
        if action == "block":
            holds_db[hold_id] = {
                "hold_id": hold_id,
                "amount": amount_saved,
                "status": "reversed_by_guardian",
                "guardian_name": guardian,
                "updated_at": now.isoformat()
            }
            audit_log.append({
                "timestamp": now.isoformat(),
                "action": "TRANSACTION_REVERSED_MONEY_SAVED",
                "hold_id": hold_id,
                "amount_saved": amount_saved,
                "authorized_by": f"Family Guardian: {guardian}",
                "reason": "1-Tap Reversal link clicked from SMS / Email"
            })

    if action == "block":
        return HTMLResponse(content=f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transaction Safely Reversed • ScamShield</title>
</head>
<body style="margin: 0; padding: 0; background: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
  <div style="max-width: 480px; margin: 20px; background: #0f172a; border: 1px solid #10b981; border-radius: 24px; padding: 36px 28px; text-align: center; box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.35);">
    <div style="width: 72px; height: 72px; margin: 0 auto 20px; background: rgba(16, 185, 129, 0.15); border: 2px solid #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 34px;">
      🛡️
    </div>
    <span style="display: inline-block; padding: 5px 12px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; border-radius: 100px; color: #6ee7b7; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
      100% Protected &amp; Refunded
    </span>
    <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 900; color: #ffffff;">
      Transaction Reversed Successfully!
    </h1>
    <p style="margin: 0 0 20px; font-size: 14px; color: #94a3b8; line-height: 1.5;">
      Thank you, <strong>{guardian}</strong>. The 15-minute escrow hold has been cancelled. 
      <strong>PKR {amount_saved:,.2f}</strong> has been completely preserved and refunded to Tariq Mahmood's account.
    </p>
    <div style="background: #1e293b; border-radius: 14px; padding: 18px; margin-bottom: 20px; text-align: left; font-size: 12px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748b;">Hold ID:</span>
        <span style="font-family: monospace; color: #38bdf8; font-weight: bold;">{hold_id}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span style="color: #64748b;">Action:</span>
        <span style="color: #10b981; font-weight: bold;">Reversed by Family</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="color: #64748b;">Status:</span>
        <span style="color: #6ee7b7; font-weight: bold;">Escrow Cancelled • Funds Safe</span>
      </div>
    </div>
    <div style="margin-bottom: 20px; padding: 12px; background: rgba(16, 185, 129, 0.08); border: 1px dashed #059669; border-radius: 12px; text-align: right; direction: rtl; font-family: serif; font-size: 15px; color: #6ee7b7;">
      رقم بحفاظت واپس اکاؤنٹ میں ریورس ہو چکی ہے۔ فراڈیے کو کچھ نہیں ملا۔
    </div>
    <p style="margin: 0; font-size: 11px; color: #475569;">
      ScamShield Live Autonomous Defense • Protected under State Bank of Pakistan Guidelines
    </p>
  </div>
</body>
</html>""", status_code=200)
    else:
        return HTMLResponse(content=f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Transfer Approved</title></head>
<body style="margin: 0; padding: 40px; background: #030712; font-family: sans-serif; color: #fff; text-align: center;">
  <h2>Transfer Approved by {guardian}</h2>
  <p>Hold {hold_id} released.</p>
</body>
</html>""", status_code=200)

@app.get("/holds/active")
@app.get("/bank/holds/active")
def get_active_holds(hold_id: Optional[str] = None):
    """Returns status of a specific hold or the currently active cooling-off escrow hold."""
    if hold_id:
        if hold_id in holds_db:
            return {"has_hold": True, "hold": holds_db[hold_id]}
        return {"has_hold": False, "hold": None}
    
    # If no hold_id specified, only return holds actively in cooling_off_escrow
    for h_id in reversed(list(holds_db.keys())):
        if holds_db[h_id].get("status") == "cooling_off_escrow":
            return {"has_hold": True, "hold": holds_db[h_id]}
            
    return {"has_hold": False, "hold": None}

@app.get("/holds/{hold_id}")
@app.get("/bank/holds/{hold_id}")
def get_hold_by_id(hold_id: str):
    if hold_id in holds_db:
        return {"found": True, "hold": holds_db[hold_id]}
    return {"found": False, "hold": None}

@app.post("/dispatch/email")
@app.post("/bank/dispatch/email")
def dispatch_email_endpoint(data: dict):
    """Direct email dispatch endpoint for n8n or external triggers."""
    to_email = data.get("recipient_email") or data.get("guardian_email")
    subject = data.get("subject", "🚨 ScamShield Emergency Alert")
    html_content = data.get("email_html", "<p>Alert</p>")
    text_content = data.get("sms_text")
    result = send_real_email(to_email, subject, html_content, text_content)
    audit_log.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": "API_EMAIL_DISPATCH",
        "recipient": to_email,
        "result": result
    })
    return result

@app.post("/dispatch/sms")
@app.post("/bank/dispatch/sms")
def dispatch_sms_endpoint(data: dict):
    """Direct SMS dispatch endpoint for n8n or external triggers."""
    phone = data.get("guardian_phone") or data.get("phone")
    text = data.get("sms_text") or data.get("sms_body")
    result = send_real_sms(phone, text)
    audit_log.append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": "API_SMS_DISPATCH",
        "phone": phone,
        "result": result
    })
    return result

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

@app.post("/audit-log")
@app.post("/bank/audit-log")
def append_audit_event(entry: dict):
    """Allows n8n or external services to log audit trail events."""
    now = datetime.now(timezone.utc)
    entry["timestamp"] = now.isoformat()
    audit_log.append(entry)
    return {"status": "recorded", "total_events": len(audit_log)}

@app.get("/audit-log")
@app.get("/bank/audit-log")
def get_audit_trail():
    return {"events": audit_log, "total_events": len(audit_log)}

