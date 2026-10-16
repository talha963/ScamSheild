"""REST surface for the graduated circuit-breaker (PDF section 5.3 / features F4-F6)."""
from fastapi import APIRouter, HTTPException

from services.bank.circuit_breaker import (
    AccountStatusResponse,
    HoldActionRequest,
    HoldActionResponse,
    TransferValidateRequest,
    TransferValidateResponse,
    account_status,
    act_on_hold,
    audit_log,
    reset_demo,
    validate_transfer,
)

router = APIRouter(prefix="/bank", tags=["Banking Circuit-Breaker"])


@router.post("/transfers/validate", response_model=TransferValidateResponse)
def validate(req: TransferValidateRequest):
    """
    Called by the banking app before any money moves. Returns the tier, what friction to
    apply, and - at Tier 3 - the id of the escrow hold protecting the funds.
    """
    try:
        return validate_transfer(req)
    except KeyError:
        raise HTTPException(status_code=404, detail="Account not found")


@router.post("/holds/{hold_id}/action", response_model=HoldActionResponse)
def hold_action(hold_id: str, req: HoldActionRequest):
    """Guardian or bank officer decision on a held transfer: send it, or return the money."""
    try:
        return act_on_hold(hold_id, req)
    except KeyError:
        raise HTTPException(status_code=404, detail="Hold not found")


@router.get("/account/{account_id}/status", response_model=AccountStatusResponse)
def status(account_id: str):
    try:
        return account_status(account_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Account not found")


@router.get("/audit-trail")
def audit_trail():
    """Every circuit-breaker decision, for the bank's dispute and compliance record."""
    return {"events": audit_log, "total": len(audit_log)}


@router.post("/demo/reset")
def demo_reset():
    """Resets balance and clears holds so the demo can be run again from a clean slate."""
    reset_demo()
    return {"reset": True}
