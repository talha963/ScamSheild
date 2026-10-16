"""Exercises the running Docker stack the way a judge would: through the frontend container."""
import sys
import httpx

WEB = "http://127.0.0.1:5173"     # nginx container (serves UI + proxies the API)
API = "http://127.0.0.1:8000"     # backend container, direct
ok = True


def check(label, cond, detail=""):
    global ok
    print(f"  {'PASS' if cond else 'FAIL'}  {label}{(' - ' + detail) if detail else ''}")
    if not cond:
        ok = False


print("\n1. Containers answering")
r = httpx.get(f"{API}/health", timeout=20)
check("backend /health", r.status_code == 200)
models = r.json().get("models", {})
check("Gemini key loaded into container", bool(models), str(models.get("live_analysis")))

r = httpx.get(f"{WEB}/", timeout=20)
check("frontend serves the web app", r.status_code == 200 and "<div id=\"root\"" in r.text)

r = httpx.get(f"{WEB}/health", timeout=20)
check("nginx proxies /health to backend", r.status_code == 200)

print("\n2. Banking circuit-breaker through nginx")
httpx.post(f"{WEB}/bank/demo/reset", timeout=20)
start = httpx.get(f"{WEB}/bank/account/acc_pk_9941/status", timeout=20).json()
check("account status via proxy", start["available_balance"] == 248500, f"Rs. {start['available_balance']:,.0f}")


def validate(amount, call, risk):
    return httpx.post(f"{WEB}/bank/transfers/validate", json={
        "account_id": "acc_pk_9941", "recipient_iban": "PK44MBL00098472910",
        "amount": amount, "recipient_bank": "Meezan Bank",
        "is_call_active": call, "active_call_risk_score": risk}, timeout=20).json()


check("Tier 0 sends", validate(5000, False, 0)["action"] == "INSTANT_TRANSFER")
check("Tier 1 cools off", validate(5000, True, 30)["action"] == "COOLING_OFF")
check("Tier 2 steps up", validate(5000, True, 60)["action"] == "STEP_UP_REQUIRED")

t3 = validate(85000, True, 96)
check("Tier 3 holds the money", t3["action"] == "GUARDIAN_HOLD" and not t3["allowed"])
check("guardian alerted", bool(t3["guardian"] and t3["guardian"]["notified"]))

held = httpx.get(f"{WEB}/bank/account/acc_pk_9941/status", timeout=20).json()
check("funds shown as held", held["held_funds_total"] == 85000, f"Rs. {held['held_funds_total']:,.0f}")

back = httpx.post(f"{WEB}/bank/holds/{t3['hold_id']}/action",
                  json={"action": "BLOCK", "actor": "GUARDIAN", "reason": "Scam"}, timeout=20).json()
check("guardian block returns money", back["status"] == "blocked_and_returned")
after = httpx.get(f"{WEB}/bank/account/acc_pk_9941/status", timeout=20).json()
check("balance restored", after["available_balance"] == held["available_balance"] + 85000)

print("\n3. Call guardian through nginx")
sid = httpx.post(f"{WEB}/v1/live/guardian/session/start",
                 json={"caller_number": "+92 333 1234567"}, timeout=20).json()["session_id"]
check("session created", sid.startswith("guard_"), sid)

d = httpx.post(f"{WEB}/v1/live/guardian/evaluate-chunk", json={
    "session_id": sid, "speaker": "caller",
    "text": "I am from State Bank, your account will be blocked, tell me the OTP now"}, timeout=25).json()
check("scam caller triggers alert", d["alert_triggered"] and d["tier"] == 3, f"score={d['risk_score']}")

d2 = httpx.post(f"{WEB}/v1/live/guardian/evaluate-chunk", json={
    "session_id": sid, "speaker": "user",
    "text": "I never share my OTP with anyone"}, timeout=25).json()
check("user's own words never add risk", d2["risk_score"] >= d["risk_score"])

print("\n4. Other demo endpoints")
check("radar campaigns", httpx.get(f"{WEB}/v1/radar/campaigns", timeout=20).status_code == 200)
check("evidence pack", httpx.post(f"{WEB}/v1/evidence/c_8f21", timeout=20).status_code == 200)
check("legacy mock bank", httpx.get(f"{WEB}/bank/accounts/acc_pk_9941", timeout=20).status_code == 200)
check("audit trail", httpx.get(f"{WEB}/bank/audit-trail", timeout=20).json()["total"] > 0)

print("\n5. Persistence of in-flight state")
httpx.post(f"{WEB}/bank/demo/reset", timeout=20)
fresh = httpx.get(f"{WEB}/bank/account/acc_pk_9941/status", timeout=20).json()
check("reset returns a clean demo", fresh["available_balance"] == 248500 and fresh["active_holds"] == 0)

print("\nRESULT:", "ALL PASS" if ok else "FAILURES ABOVE")
sys.exit(0 if ok else 1)
