"""
ScamShield Live - Multi-Channel Emergency Dispatcher
Handles real SMTP email delivery (Gmail, Outlook, Custom SMTP) and SMS dispatch (Twilio)
to whatever contact information the user specifies in the app.
"""

import os
import json
import uuid
import smtplib
import urllib.request
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, Optional

CONFIG_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "notification_config.json"

# In-memory store of recently generated alerts for preview
alerts_cache: Dict[str, Dict[str, Any]] = {}

def get_notification_config(mask_secrets: bool = True) -> Dict[str, Any]:
    """
    Load SMTP and SMS notification configuration from file or environment.
    """
    config = {
        "smtp_host": os.getenv("SMTP_HOST", "smtp.gmail.com"),
        "smtp_port": int(os.getenv("SMTP_PORT", "587")),
        "smtp_user": os.getenv("SMTP_USER", ""),
        "smtp_password": os.getenv("SMTP_PASSWORD", ""),
        "smtp_from": os.getenv("SMTP_FROM", ""),
        "smtp_use_tls": os.getenv("SMTP_USE_TLS", "true").lower() in ["true", "1", "yes"],
        "twilio_sid": os.getenv("TWILIO_ACCOUNT_SID", ""),
        "twilio_token": os.getenv("TWILIO_AUTH_TOKEN", ""),
        "twilio_from": os.getenv("TWILIO_FROM_NUMBER", ""),
        "public_host": os.getenv("PUBLIC_HOST", "https://flatbed-carve-imprint.ngrok-free.dev"),
    }

    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                saved = json.load(f)
                config.update(saved)
        except Exception:
            pass

    # Determine whether real credentials exist
    has_smtp = bool(config.get("smtp_user") and config.get("smtp_password"))
    has_twilio = bool(config.get("twilio_sid") and config.get("twilio_token"))

    if mask_secrets:
        safe_copy = dict(config)
        safe_copy["smtp_password_configured"] = has_smtp
        if safe_copy.get("smtp_password"):
            safe_copy["smtp_password"] = "••••••••••••••••"
        
        safe_copy["twilio_token_configured"] = has_twilio
        if safe_copy.get("twilio_token"):
            safe_copy["twilio_token"] = "••••••••••••••••"
        return safe_copy

    config["smtp_password_configured"] = has_smtp
    config["twilio_token_configured"] = has_twilio
    return config

def save_notification_config(new_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Save notification configuration updates to persisted JSON file.
    """
    current = get_notification_config(mask_secrets=False)
    
    # Update fields that were provided (don't overwrite with masked string or transient flags)
    for k, v in new_config.items():
        if k in ["smtp_password_configured", "twilio_token_configured"]:
            continue
        if k in ["smtp_password", "twilio_token"] and isinstance(v, str) and v.startswith("••"):
            continue
        if k == "smtp_password" and isinstance(v, str):
            v = v.strip().replace(" ", "")
        if k in ["smtp_user", "smtp_host", "smtp_from"] and isinstance(v, str):
            v = v.strip()
        current[k] = v

    # Remove transient computed flags before writing to disk
    to_save = dict(current)
    to_save.pop("smtp_password_configured", None)
    to_save.pop("twilio_token_configured", None)

    CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(to_save, f, indent=2)

    return get_notification_config(mask_secrets=True)

def generate_guardian_alert(
    hold_id: str,
    user_name: str,
    amount: float,
    currency: str = "PKR",
    payee_name: str = "Ali Raza (Unverified Mule Account)",
    payee_account: str = "PK44MBL00098472910",
    scam_type: str = "Phone Imposter (Urgency Coercion)",
    guardian_name: str = "Hamza Tariq (Son)",
    guardian_phone: str = "+92 300 9876543",
    guardian_email: str = "hamza.tariq@gmail.com",
    public_host: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates tailored, responsive HTML email and SMS alert for the specified family member.
    """
    cfg = get_notification_config(mask_secrets=False)
    host = public_host or cfg.get("public_host") or "https://flatbed-carve-imprint.ngrok-free.dev"

    reverse_url = f"{host}/webhook/guardian-decision?action=block&hold_id={hold_id}&guardian={urllib.parse.quote(guardian_name)}&ngrok-skip-browser-warning=true"
    approve_url = f"{host}/webhook/guardian-decision?action=approve&hold_id={hold_id}&guardian={urllib.parse.quote(guardian_name)}&ngrok-skip-browser-warning=true"

    # Native SMS text
    sms_body = (
        f"🚨 SCAMSHIELD EMERGENCY: Your family member {user_name} requested a transfer of "
        f"{currency} {amount:,.2f} during an active scam call.\n\n"
        f"Money is safely frozen for 15 minutes. If this is fraud, tap here to REVERSE and refund immediately:\n"
        f"{reverse_url}\n\n"
        f"To approve if genuine: {approve_url}"
    )

    # Ultra-Modern Responsive Dark-Mode HTML Email Template
    email_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScamShield Urgent Family Alert</title>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f9fafb;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #030712; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #4c0519 0%, #1e1b4b 50%, #0f172a 100%); padding: 32px; border-bottom: 1px solid #1e293b;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; padding: 6px 14px; background: rgba(225, 29, 72, 0.25); border: 1px solid #f43f5e; border-radius: 100px; color: #fda4af; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;">
                      🚨 Emergency Family Interception
                    </div>
                    <h1 style="margin: 14px 0 6px; font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                      ScamShield Live Defense Network
                    </h1>
                    <p style="margin: 0; font-size: 13px; color: #cbd5e1;">
                      Direct Security Notification for <strong>{guardian_name}</strong>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px;">
              
              <!-- Critical Alert Box -->
              <div style="background: rgba(225, 29, 72, 0.12); border-left: 4px solid #f43f5e; padding: 20px 22px; border-radius: 14px; margin-bottom: 26px;">
                <p style="margin: 0 0 6px; font-size: 15px; font-weight: 800; color: #fecdd3;">
                  High-Risk Transfer Paused During Coerced Call!
                </p>
                <p style="margin: 0; font-size: 13px; color: #e2e8f0; line-height: 1.6;">
                  Your family member <strong>{user_name}</strong> is currently on an unverified call and attempted to transfer funds. ScamShield detected urgency coercion and placed the money into a <strong>15-Minute Safety Escrow</strong>.
                </p>
              </div>

              <!-- Transaction Detail Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 16px; padding: 22px; margin-bottom: 28px; border: 1px solid #334155;">
                <tr>
                  <td style="padding-bottom: 14px; border-bottom: 1px solid #334155;">
                    <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Protected Family Member</span><br>
                    <strong style="font-size: 16px; color: #ffffff;">{user_name}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #334155;">
                    <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Amount Intercepted</span><br>
                    <strong style="font-size: 28px; font-weight: 900; color: #38bdf8;">{currency} {amount:,.2f}</strong>
                    <span style="display: inline-block; padding: 3px 8px; background: rgba(16, 185, 129, 0.2); border: 1px solid #059669; border-radius: 8px; color: #6ee7b7; font-size: 11px; font-weight: 700; margin-left: 8px;">100% Held Safe</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 14px 0; border-bottom: 1px solid #334155;">
                    <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Intended Recipient (Suspected Mule)</span><br>
                    <span style="font-size: 14px; color: #f87171; font-weight: 700;">{payee_name}</span><br>
                    <span style="font-size: 12px; color: #94a3b8; font-family: monospace;">{payee_account}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 14px;">
                    <span style="font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">AI Threat Assessment</span><br>
                    <span style="font-size: 13px; color: #fbbf24; font-weight: 600;">⚠️ {scam_type}</span>
                  </td>
                </tr>
              </table>

              <!-- Urgent Action Callouts -->
              <div style="text-align: center; margin-bottom: 26px;">
                <p style="margin: 0 0 16px; font-size: 14px; font-weight: 700; color: #e2e8f0;">
                  If you suspect {user_name} is being pressured or deceived, tap below to reverse the transaction immediately:
                </p>
                
                <!-- PRIMARY 1-TAP REVERSE BUTTON -->
                <a href="{reverse_url}" target="_blank" style="display: block; background: #e11d48; background-image: linear-gradient(135deg, #e11d48 0%, #be123c 100%); color: #ffffff; text-decoration: none; padding: 18px 24px; border-radius: 16px; font-size: 16px; font-weight: 900; text-align: center; letter-spacing: 0.3px; box-shadow: 0 10px 25px -5px rgba(225, 29, 72, 0.6);">
                  🛡️ REVERSE TRANSACTION & REFUND MONEY NOW
                </a>

                <p style="margin: 12px 0 0; font-size: 12px; color: #94a3b8;">
                  Clicking this button instantly halts the payment and restores 100% of the funds back to {user_name}'s account.
                </p>
              </div>

              <!-- SECONDARY APPROVE BUTTON -->
              <div style="text-align: center; padding-top: 18px; border-top: 1px solid #1e293b;">
                <p style="margin: 0 0 10px; font-size: 12px; color: #64748b;">
                  Only if you personally spoke with {user_name} and confirmed this payment is legitimate:
                </p>
                <a href="{approve_url}" target="_blank" style="display: inline-block; background: #047857; color: #ffffff; text-decoration: none; padding: 10px 22px; border-radius: 12px; font-size: 13px; font-weight: 700;">
                  ✓ Approve Legitimate Transfer
                </a>
              </div>

              <!-- Bilingual Urdu Reassurance -->
              <div style="margin-top: 28px; padding: 16px 20px; background: rgba(16, 185, 129, 0.08); border: 1px dashed #059669; border-radius: 14px; text-align: right; direction: rtl;">
                <p style="margin: 0; font-family: serif; font-size: 15px; color: #6ee7b7; line-height: 1.7;">
                  یہ رقم ابھی بھی بینک کے سیکیورٹی ایسکرو میں محفوظ ہے۔ فراڈیے کے اکاؤنٹ میں نہیں گئی۔ اگر یہ فراڈ ہے تو اوپر دیے گئے ریورس بٹن کو دبا کر پیسے فوری واپس کریں۔
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #090d16; padding: 24px 32px; border-top: 1px solid #1e293b; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;">
                ScamShield Live Autonomous Voice Scam Defense & Banking Circuit-Breaker
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                Protected under State Bank of Pakistan Consumer Protection Guidelines • FIA Cybercrime Helpline: 1991
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    alert_record = {
        "hold_id": hold_id,
        "user_name": user_name,
        "amount": amount,
        "currency": currency,
        "guardian_name": guardian_name,
        "guardian_phone": guardian_phone,
        "guardian_email": guardian_email,
        "payee_name": payee_name,
        "payee_account": payee_account,
        "scam_type": scam_type,
        "reverse_url": reverse_url,
        "approve_url": approve_url,
        "sms_body": sms_body,
        "email_subject": f"🚨 URGENT: High-Risk Transfer Intercepted for {user_name} ({currency} {amount:,.2f})",
        "email_html": email_html,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    alerts_cache[hold_id] = alert_record
    return alert_record

def send_real_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
    override_config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Sends an actual email to `to_email` using the configured SMTP gateway.
    """
    cfg = get_notification_config(mask_secrets=False)
    if override_config:
        for k, v in override_config.items():
            if v and not (isinstance(v, str) and v.startswith("••")):
                cfg[k] = v

    host = cfg.get("smtp_host") or "smtp.gmail.com"
    port = int(cfg.get("smtp_port") or 587)
    user = (cfg.get("smtp_user") or "").strip()
    password = (cfg.get("smtp_password") or "").strip().replace(" ", "")
    from_addr = (cfg.get("smtp_from") or "").strip() or user or "alerts@scamshield.org"
    use_tls = cfg.get("smtp_use_tls", True)

    if not host or not user or not password:
        return {
            "success": False,
            "status": "unconfigured",
            "message": "SMTP credentials (user/password) are not configured. Please enter your Gmail/Outlook email and App Password, then click Save Settings.",
            "recipient": to_email
        }

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"ScamShield Defense <{from_addr}>"
        msg["To"] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        if port == 465:
            with smtplib.SMTP_SSL(host, port, timeout=12) as server:
                server.login(user, password)
                server.sendmail(from_addr, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(host, port, timeout=12) as server:
                if use_tls:
                    server.starttls()
                server.login(user, password)
                server.sendmail(from_addr, [to_email], msg.as_string())

        return {
            "success": True,
            "status": "delivered",
            "message": f"Successfully delivered rich email alert to {to_email}",
            "recipient": to_email,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except smtplib.SMTPAuthenticationError as e:
        return {
            "success": False,
            "status": "auth_error",
            "error": str(e),
            "message": "Authentication failed. For Gmail, make sure you are using a 16-character Google App Password (from https://myaccount.google.com/apppasswords), NOT your normal Gmail login password.",
            "recipient": to_email
        }
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "message": f"Failed to deliver email: {str(e)}",
            "recipient": to_email
        }

def send_real_sms(phone_number: str, message_text: str) -> Dict[str, Any]:
    """
    Sends a real SMS via Twilio if configured, or prepares the mobile link.
    """
    cfg = get_notification_config(mask_secrets=False)
    sid = cfg.get("twilio_sid")
    token = cfg.get("twilio_token")
    from_num = cfg.get("twilio_from")

    if not sid or not token or not from_num:
        return {
            "success": False,
            "status": "unconfigured",
            "message": "Twilio SMS credentials not configured. Native mobile SMS intent ready.",
            "phone": phone_number,
            "sms_uri": f"sms:{phone_number}?body={urllib.parse.quote(message_text)}"
        }

    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
        data = urllib.parse.urlencode({
            "To": phone_number,
            "From": from_num,
            "Body": message_text
        }).encode("utf-8")

        auth_header = "Basic " + __import__("base64").b64encode(f"{sid}:{token}".encode("utf-8")).decode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Authorization": auth_header})
        with urllib.request.urlopen(req, timeout=10) as resp:
            resp_body = json.loads(resp.read().decode("utf-8"))
            return {
                "success": True,
                "status": "delivered",
                "sid": resp_body.get("sid"),
                "phone": phone_number,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    except Exception as e:
        return {
            "success": False,
            "status": "error",
            "error": str(e),
            "phone": phone_number
        }
