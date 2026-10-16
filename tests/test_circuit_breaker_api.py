"""Checks every tier of the circuit-breaker, and that held money is never lost."""
import sys
import httpx

B = "http://127.0.0.1:8000/bank"
ACC = "acc_pk_9941"
ok = True


def check(label, cond, detail=""):
    global ok
    print(f"  {'PASS' if cond else 'FAIL'}  {label}{(' - ' + detail) if detail else ''}")
    if not cond:
        ok = False


def validate(amount, call=False, risk=0):
    return httpx.post(f"{B}/transfers/validate", json={
        "account_id": ACC, "recipient_iban": "PK44MBL00098472910", "amount": amount,
        "recipient_bank": "Meezan Bank", "purpose": "Family support",
        "is_call_active": call, "active_call_risk_score": risk,
    }, timeout=20).json()


httpx.post(f"{B}/demo/reset", timeout=20)
start = httpx.get(f"{B}/account/{ACC}/status", timeout=20).json()
print(f"\nOpening balance: Rs. {start['balance']:,.0f}\n")

print("Tier 0 - no call")
r = validate(5000)
check("instant transfer", r["allowed"] and r["tier"] == 0 and r["action"] == "INSTANT_TRANSFER", r["action"])

print("\nTier 1 - low-risk call")
r = validate(5000, call=True, risk=30)
check("cooling off", r["tier"] == 1 and r["action"] == "COOLING_OFF", r["action"])
check("60s countdown", r["cooling_off_seconds"] == 60)
check("not blocked outright", not r["allowed"])

print("\nTier 2 - elevated, small amount")
r = validate(5000, call=True, risk=60)
check("step-up only", r["tier"] == 2 and r["action"] == "STEP_UP_REQUIRED", r["action"])
check("no escrow for small amount", r["hold_id"] is None)

print("\nTier 2 - elevated, above Rs. 25,000")
r = validate(40000, call=True, risk=60)
check("escrow hold created", r["tier"] == 2 and r["hold_id"] is not None)
check("release time set", r["escrow_release_at"] is not None)

print("\nTier 3 - active scam call")
r = validate(85000, call=True, risk=96)
check("guardian hold", r["tier"] == 3 and r["action"] == "GUARDIAN_HOLD", r["action"])
check("money not sent", r["allowed"] is False)
check("amount held", r["held_amount"] == 85000)
check("guardian notified", r["guardian"] and r["guardian"]["notified"])
check("reassuring English", "NOT left your account" in r["message_en"], r["message_en"][:60])
check("Roman Urdu present", "mehfooz" in r["message_ur"], r["message_ur"])
tier3_hold = r["hold_id"]

print("\nEscalation rule: risk 70+ and amount 10k+ forces Tier 3")
r = validate(12000, call=True, risk=72)
check("escalated from tier 2 to 3", r["tier"] == 3, f"tier={r['tier']}")
esc_hold = r["hold_id"]

print("\nGuardian blocks the scam -> money returns")
before = httpx.get(f"{B}/account/{ACC}/status", timeout=20).json()
r = httpx.post(f"{B}/holds/{tier3_hold}/action",
               json={"action": "BLOCK", "actor": "GUARDIAN", "reason": "Confirmed scam"}, timeout=20).json()
check("returned to account", r["status"] == "blocked_and_returned", r["status"])
after = httpx.get(f"{B}/account/{ACC}/status", timeout=20).json()
check("available balance restored",
      after["available_balance"] == before["available_balance"] + 85000,
      f"{before['available_balance']:,.0f} -> {after['available_balance']:,.0f}")

print("\nGuardian approves a genuine one -> it sends")
r = httpx.post(f"{B}/holds/{esc_hold}/action",
               json={"action": "APPROVE", "actor": "GUARDIAN", "reason": "Checked, it is real"}, timeout=20).json()
check("sent", r["status"] == "released_and_sent", r["status"])

print("\nDouble-action is rejected")
r = httpx.post(f"{B}/holds/{esc_hold}/action",
               json={"action": "BLOCK", "actor": "GUARDIAN", "reason": "again"}, timeout=20).json()
check("already resolved", r["status"] == "already_resolved", r["status"])

print("\nAudit trail")
a = httpx.get(f"{B}/audit-trail", timeout=20).json()
check("decisions recorded", a["total"] >= 5, f"{a['total']} events")

print("\nOld bank endpoints still work")
acc = httpx.get("http://127.0.0.1:8000/bank/accounts/acc_pk_9941", timeout=20)
check("legacy /bank/accounts reachable", acc.status_code == 200, f"HTTP {acc.status_code}")

print("\nRESULT:", "ALL PASS" if ok else "FAILURES ABOVE")
sys.exit(0 if ok else 1)
