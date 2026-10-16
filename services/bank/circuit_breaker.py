"""
Graduated Circuit-Breaker for Authorized Push Payment (APP) fraud.

A victim on a scam call authorises the transfer themselves on their own device, so the bank sees
a legitimate instruction. This module adds the missing signal - the live call - and applies
graduated friction instead of a blunt block:

    Tier 0  (0-20)    Safe        instant transfer
    Tier 1  (21-49)   Low         calm banner + 60s cooling-off for new payees
    Tier 2  (50-74)   Elevated    step-up biometric + 15 min escrow above Rs. 25,000
    Tier 3  (75-100)  Critical    funds held in escrow, guardian alerted, money never leaves

Money held at Tier 3 stays inside the customer's own bank. It is ring-fenced, not sent anywhere,
so nothing is lost while a human checks.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

# --- Tier thresholds -------------------------------------------------------------------------
TIER_1_MIN = 21
TIER_2_MIN = 50
TIER_3_MIN = 75

# A live high-risk call plus a meaningful amount is the APP-fraud pattern itself
CALL_RISK_ESCALATION = 70
CALL_AMOUNT_ESCALATION = 10_000

COOLING_OFF_SECONDS = 60
STEP_UP_AMOUNT = 25_000
ESCROW_MINUTES_TIER2 = 15

TransferAction = Literal["INSTANT_TRANSFER", "COOLING_OFF", "STEP_UP_REQUIRED", "GUARDIAN_HOLD"]


class TransferValidateRequest(BaseModel):
    account_id: str
    recipient_iban: str
    amount: float = Field(gt=0, description="Amount in PKR")
    recipient_bank: Optional[str] = None
    purpose: Optional[str] = None
    is_call_active: bool = False
    active_call_risk_score: int = Field(default=0, ge=0, le=100)


class GuardianInfo(BaseModel):
    name: str
    relationship: str
    channel: str
    notified: bool


class TransferValidateResponse(BaseModel):
    allowed: bool
    tier: int
    action: TransferAction
    risk_score: int
    hold_id: Optional[str] = None
    held_amount: Optional[float] = None
    cooling_off_seconds: Optional[int] = None
    escrow_release_at: Optional[datetime] = None
    reasons: List[str]
    # Shown to the customer. Calm and reassuring: they are a victim, not a suspect.
    message_en: str
    message_ur: str
    guardian: Optional[GuardianInfo] = None


class HoldActionRequest(BaseModel):
    action: Literal["APPROVE", "BLOCK"]
    actor: Literal["GUARDIAN", "BANK_OFFICER", "CUSTOMER"]
    reason: str = ""


class HoldActionResponse(BaseModel):
    hold_id: str
    status: Literal["released_and_sent", "blocked_and_returned", "already_resolved"]
    amount: float
    balance_after: float
    message_en: str
    message_ur: str
    resolved_at: datetime


class AccountStatusResponse(BaseModel):
    account_id: str
    account_number_masked: str
    holder_name: str
    balance: float
    available_balance: float
    currency: str
    held_funds_total: float
    active_holds: int
    circuit_breaker_tier: int
    guardian: GuardianInfo


# --- In-memory state (demo; a real deployment would use the core banking ledger) --------------
DEFAULT_GUARDIAN = GuardianInfo(
    name="Ayesha", relationship="Daughter", channel="WhatsApp", notified=False
)

accounts: Dict[str, dict] = {
    "acc_pk_9941": {
        "account_id": "acc_pk_9941",
        "account_number": "PK60HABB00018492019482",
        "holder_name": "Tariq Mahmood",
        "balance": 248_500.0,
        "currency": "PKR",
    }
}

holds: Dict[str, dict] = {}
audit_log: List[dict] = []


def _mask(account_number: str) -> str:
    return f"{account_number[:6]}••••••{account_number[-4:]}" if len(account_number) > 10 else account_number


def _log(action: str, **fields) -> None:
    audit_log.append({"timestamp": datetime.now(timezone.utc).isoformat(), "action": action, **fields})


def tier_for(risk_score: int) -> int:
    if risk_score >= TIER_3_MIN:
        return 3
    if risk_score >= TIER_2_MIN:
        return 2
    if risk_score >= TIER_1_MIN:
        return 1
    return 0


def validate_transfer(req: TransferValidateRequest) -> TransferValidateResponse:
    account = accounts.get(req.account_id)
    if account is None:
        raise KeyError(req.account_id)

    reasons: List[str] = []
    risk = req.active_call_risk_score if req.is_call_active else 0
    if req.is_call_active:
        reasons.append(f"A phone call is active while this transfer is being made (risk {risk}%)")

    tier = tier_for(risk)

    # The core APP-fraud rule: a high-risk live call plus real money is a scam in progress,
    # whatever the raw score alone would have said.
    if req.is_call_active and risk >= CALL_RISK_ESCALATION and req.amount >= CALL_AMOUNT_ESCALATION:
        if tier < 3:
            reasons.append(
                f"Escalated to Tier 3: a high-pressure call is in progress and the amount is "
                f"Rs. {req.amount:,.0f}"
            )
        tier = 3

    now = datetime.now(timezone.utc)

    # ---- Tier 3: hold the money inside the bank, alert the guardian -------------------------
    if tier == 3:
        hold_id = f"hold_{uuid.uuid4().hex[:8]}"
        holds[hold_id] = {
            "hold_id": hold_id,
            "account_id": req.account_id,
            "recipient_iban": req.recipient_iban,
            "recipient_bank": req.recipient_bank,
            "amount": req.amount,
            "tier": 3,
            "status": "held",
            "created_at": now,
            "risk_score": risk,
        }
        account["balance"] -= req.amount          # ring-fenced, not sent anywhere
        guardian = DEFAULT_GUARDIAN.model_copy(update={"notified": True})
        reasons.append("Funds moved to safety escrow inside your own bank")
        reasons.append(f"Emergency alert sent to {guardian.name} ({guardian.relationship})")
        _log("CIRCUIT_BREAKER_TIER3", hold_id=hold_id, amount=req.amount, risk=risk)

        return TransferValidateResponse(
            allowed=False, tier=3, action="GUARDIAN_HOLD", risk_score=risk,
            hold_id=hold_id, held_amount=req.amount, reasons=reasons,
            message_en=("Your money has NOT left your account. It is safe and being held securely "
                        "while we check this transfer with your trusted contact."),
            message_ur="Aapki raqam mehfooz hai, kisi ko muntaqil nahi hui.",
            guardian=guardian,
        )

    # ---- Tier 2: step up, and escrow larger amounts ----------------------------------------
    if tier == 2:
        if req.amount >= STEP_UP_AMOUNT:
            hold_id = f"hold_{uuid.uuid4().hex[:8]}"
            release_at = now + timedelta(minutes=ESCROW_MINUTES_TIER2)
            holds[hold_id] = {
                "hold_id": hold_id, "account_id": req.account_id,
                "recipient_iban": req.recipient_iban, "recipient_bank": req.recipient_bank,
                "amount": req.amount, "tier": 2, "status": "held",
                "created_at": now, "release_at": release_at, "risk_score": risk,
            }
            account["balance"] -= req.amount
            reasons.append(f"Amounts over Rs. {STEP_UP_AMOUNT:,} are held for {ESCROW_MINUTES_TIER2} minutes during a suspicious call")
            _log("ESCROW_TIER2", hold_id=hold_id, amount=req.amount, risk=risk)
            return TransferValidateResponse(
                allowed=False, tier=2, action="STEP_UP_REQUIRED", risk_score=risk,
                hold_id=hold_id, held_amount=req.amount, escrow_release_at=release_at,
                reasons=reasons,
                message_en=("Please confirm with your fingerprint. This transfer is paused for "
                            f"{ESCROW_MINUTES_TIER2} minutes so you have time to check who you are talking to."),
                message_ur="Baraye meherbani apni tasdeeq karein. Transfer thori der ke liye roka gaya hai.",
            )
        reasons.append("Fingerprint confirmation needed because of the current call")
        return TransferValidateResponse(
            allowed=False, tier=2, action="STEP_UP_REQUIRED", risk_score=risk, reasons=reasons,
            message_en="Please confirm this transfer with your fingerprint.",
            message_ur="Baraye meherbani apne fingerprint se tasdeeq karein.",
        )

    # ---- Tier 1: a calm pause, nothing blocked ---------------------------------------------
    if tier == 1:
        reasons.append("A short pause before sending, in case someone is rushing you")
        return TransferValidateResponse(
            allowed=False, tier=1, action="COOLING_OFF", risk_score=risk,
            cooling_off_seconds=COOLING_OFF_SECONDS, reasons=reasons,
            message_en=("Take a moment. A real bank will never rush you or ask for codes on the phone. "
                        "You can send this in a minute."),
            message_ur="Zara ruk jaiye. Asli bank kabhi phone par jaldi nahi machata.",
        )

    # ---- Tier 0: normal banking ------------------------------------------------------------
    account["balance"] -= req.amount
    _log("TRANSFER_SENT", amount=req.amount, to=req.recipient_iban)
    return TransferValidateResponse(
        allowed=True, tier=0, action="INSTANT_TRANSFER", risk_score=risk,
        reasons=["No risk signals detected"],
        message_en="Transfer sent successfully.",
        message_ur="Raqam kamyabi se bhej di gayi hai.",
    )


def act_on_hold(hold_id: str, req: HoldActionRequest) -> HoldActionResponse:
    hold = holds.get(hold_id)
    if hold is None:
        raise KeyError(hold_id)

    account = accounts[hold["account_id"]]
    now = datetime.now(timezone.utc)

    if hold["status"] != "held":
        return HoldActionResponse(
            hold_id=hold_id, status="already_resolved", amount=hold["amount"],
            balance_after=account["balance"],
            message_en="This transfer has already been dealt with.",
            message_ur="Is transfer ka faisla pehle ho chuka hai.",
            resolved_at=now,
        )

    if req.action == "APPROVE":
        # The guardian vouched for it: the money leaves as the customer intended.
        hold["status"] = "released"
        _log("HOLD_RELEASED", hold_id=hold_id, actor=req.actor, reason=req.reason)
        return HoldActionResponse(
            hold_id=hold_id, status="released_and_sent", amount=hold["amount"],
            balance_after=account["balance"],
            message_en=f"Approved by {req.actor.title()}. The transfer has been sent.",
            message_ur="Tasdeeq ho gayi. Raqam bhej di gayi hai.",
            resolved_at=now,
        )

    # Blocked: the ring-fenced money goes straight back to the customer.
    hold["status"] = "blocked"
    account["balance"] += hold["amount"]
    _log("HOLD_BLOCKED_FUNDS_RETURNED", hold_id=hold_id, actor=req.actor, amount=hold["amount"])
    return HoldActionResponse(
        hold_id=hold_id, status="blocked_and_returned", amount=hold["amount"],
        balance_after=account["balance"],
        message_en=f"Scam confirmed by {req.actor.title()}. Rs. {hold['amount']:,.0f} has been returned to your account.",
        message_ur=f"Fraud ki tasdeeq ho gayi. Rs. {hold['amount']:,.0f} aapke account mein wapas aa gaye hain.",
        resolved_at=now,
    )


def account_status(account_id: str) -> AccountStatusResponse:
    account = accounts.get(account_id)
    if account is None:
        raise KeyError(account_id)

    active = [h for h in holds.values() if h["account_id"] == account_id and h["status"] == "held"]
    held_total = sum(h["amount"] for h in active)
    tier = max((h["tier"] for h in active), default=0)

    return AccountStatusResponse(
        account_id=account_id,
        account_number_masked=_mask(account["account_number"]),
        holder_name=account["holder_name"],
        balance=account["balance"] + held_total,   # what the customer still owns
        available_balance=account["balance"],      # what they can spend right now
        currency=account["currency"],
        held_funds_total=held_total,
        active_holds=len(active),
        circuit_breaker_tier=tier,
        guardian=DEFAULT_GUARDIAN.model_copy(update={"notified": bool(active)}),
    )


def reset_demo() -> None:
    """Puts the demo account back to its starting state between runs."""
    holds.clear()
    audit_log.clear()
    accounts["acc_pk_9941"]["balance"] = 248_500.0
