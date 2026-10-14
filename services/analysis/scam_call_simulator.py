import re
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from services.shared.config import settings

logger = logging.getLogger("scamshield.call_simulator")

class CallTurn(BaseModel):
    speaker: str # "scammer" (user) or "citizen" (AI)
    text: str

class ScamCallRequest(BaseModel):
    message: str
    history: List[CallTurn] = []

class ScamCallResponse(BaseModel):
    ai_response: str
    language_detected: str # "urdu_script", "roman_urdu", "english"
    risk_score: int # 0 to 100
    tier: int # 0 to 3
    detected_tactics: List[str]
    evidence_phrases: List[str]
    alert_triggered: bool
    cut_call_warning_en: str
    cut_call_warning_ur: str
    bank_hold_simulated: bool
    guardian_alert_simulated: bool

def detect_language(text: str) -> str:
    # Check for Arabic / Urdu Unicode script
    if re.search(r'[\u0600-\u06FF]', text):
        return "urdu_script"
    
    lower = text.lower()
    roman_urdu_words = [
        "aap", "ap", "mera", "meri", "mere", "main", "mein", "hum", "tum", "karo", "karein", "karna",
        "hai", "hein", "hain", "ho", "bhejo", "bhejiye", "batao", "batayein", "mat", "ruko", "chup",
        "pakar", "foran", "warna", "bhai", "sahab", "paise", "paisa", "rupay", "band", "khata", "khabar",
        "ghalti", "fauran", "jaldi", "police", "jail", "parh", "aya", "gaya", "hoga"
    ]
    matches = sum(1 for w in lower.split() if w in roman_urdu_words)
    if matches >= 2:
        return "roman_urdu"
    
    return "english"

def generate_citizen_response(user_text: str, history: List[CallTurn], gemini_client=None) -> str:
    lang = detect_language(user_text)
    lower = user_text.lower()

    # Try Gemini 2.5 Flash if available
    if gemini_client:
        try:
            conversation_history_text = "\n".join([f"{t.speaker}: {t.text}" for t in history[-6:]])
            prompt = f"""You are Uncle Tariq, a 58-year-old innocent Pakistani citizen who answered an unknown phone call.
The caller (the user) is calling you and attempting to scam you.

STRICT INSTRUCTIONS:
1. LANGUAGE MATCHING:
   - If caller used Urdu script (اردو), reply in natural, polite Urdu script.
   - If caller used Roman Urdu (e.g. 'Aap ka account block ho raha hai'), reply in natural everyday Roman Urdu.
   - If caller used English, reply in polite English.
2. CITIZEN BEHAVIOR:
   - You are an innocent citizen with bank savings.
   - If they claim to be from the bank or police, you sound worried and polite: "Arey beta, mera account kyun block hoga?"
   - If they ask for OTP, PIN, or password, you are hesitant: "Lekin SMS me to likha hai kisi ko OTP na dein... aap sach me bank se hain?"
   - If they threaten you with police/arrest, you get frightened: "Nahi beta, police ko mat bulao, main samajhta hoon..."
   - Keep reply under 25 words. Do not break character.

CONVERSATION SO FAR:
{conversation_history_text}
caller: {user_text}
Uncle Tariq:"""

            response = gemini_client.models.generate_content(
                model=settings.GEMINI_MODEL_LIVE,
                contents=[{"role": "user", "parts": [{"text": prompt}]}]
            )
            reply = response.text.strip().replace('"', '').replace('Uncle Tariq:', '').strip()
            if reply:
                return reply
        except Exception as e:
            logger.warning(f"Gemini generation error in citizen simulator: {e}. Using offline intelligent matcher.")

    # Intelligent contextual fallback matching
    otp_words = ["otp", "pin", "password", "code", "6-digit", "digit", "cvv", "number", "کوڈ", "او ٹی پی", "پاسورڈ"]
    urgency_words = ["police", "arrest", "jail", "block", "freeze", "band", "fauran", "jaldi", "10 minute", "5 minute", "بلاک", "پولیس", "گرفتار"]
    money_words = ["transfer", "bhejo", "jazzcash", "easypaisa", "wire", "rupay", "paise", "پیسے", "ٹرانسفر"]

    is_otp = any(w in lower for w in otp_words)
    is_urgency = any(w in lower for w in urgency_words)
    is_money = any(w in lower for w in money_words)

    if lang == "urdu_script":
        if is_otp:
            return "لیکن بھائی جان! بینک کے ایس ایم ایس میں صاف لکھا ہے کہ اپنا او ٹی پی کوڈ کسی کو نہ بتائیں۔ آپ مجھے ہیلپ لائن سے کال کیوں نہیں کرتے؟"
        elif is_urgency:
            return "ارے بھائی خدا کا واسطہ ہے، پولیس کو مت بھیجیں! میں ایک شریف آدمی ہوں۔ مجھے بتائیں اصل مسئلہ کیا ہے؟"
        elif is_money:
            return "میرے پاس تو اتنی رقم نہیں ہے بھائی۔ کیا میں صبح بینک کی برانچ جا کر معلوم کر سکتا ہوں؟"
        else:
            return "وعلیکم السلام بھائی! خیریت تو ہے؟ آپ کون بول رہے ہیں اور میرے اکاؤنٹ کو کیا ہوا ہے؟"

    elif lang == "roman_urdu":
        if is_otp:
            return "Lekin beta! SMS me to saaf likha hai ke 6-digit OTP code kisi se share mat karein. Aap waqai State Bank se bol rahe hain?"
        elif is_urgency:
            return "Arey bhai police kyun ayegi mere ghar? Khuda ka khauf karein, main buzoorg aadmi hoon, meri tabiat kharab ho rahi hai!"
        elif is_money:
            return "Beta main itni bari raqam foran kaisay bhej doon? Mujhay pehle apnay baitay Ali se mashwara karne dein."
        else:
            return "Walaikum Assalam beta! Khairiyat? Aap kon baat kar rahe hain aur mera account kyun block hoga?"

    else: # English
        if is_otp:
            return "Wait a minute! My bank SMS strictly says never share this 6-digit code with anyone over phone. Who are you?"
        elif is_urgency:
            return "Please do not threaten me with arrest! I am an honest citizen. Give me your official bank extension number."
        elif is_money:
            return "I cannot wire funds to a personal wallet. I will visit my local branch tomorrow morning."
        else:
            return "Hello? Who is this speaking, and why are you claiming my bank account is in jeopardy?"

def evaluate_scammer_tactics(history: List[CallTurn], latest_user_text: str) -> Dict[str, Any]:
    full_text = " ".join([t.text for t in history if t.speaker == "scammer"] + [latest_user_text]).lower()

    detected_tactics = []
    evidence_phrases = []
    score = 15 # Base unknown caller score

    # Check 1: Authority Impersonation
    authority_keywords = [
        "state bank", "sbp", "bank officer", "security", "manager", "head office",
        "fia", "police", "customs", "pta", "officer", "inspector", "اسٹیٹ بینک", "پولیس"
    ]
    for k in authority_keywords:
        if k in full_text:
            detected_tactics.append("Authority Impersonation")
            evidence_phrases.append(f"Claimed official status: '{k}'")
            score += 25
            break

    # Check 2: Manufactured Urgency & Panic
    urgency_keywords = [
        "block", "freeze", "band", "jail", "arrest", "raid", "foran", "jaldi", "urgent",
        "5 minute", "10 minute", "ten minutes", "immediately", "court", "fauran", "بلاک", "فوری"
    ]
    for k in urgency_keywords:
        if k in full_text:
            detected_tactics.append("Manufactured Urgency")
            evidence_phrases.append(f"Imposed deadline/threat: '{k}'")
            score += 25
            break

    # Check 3: Secrecy & Isolation
    secrecy_keywords = [
        "kisi ko mat batana", "do not tell", "secret", "confidential", "stay on line",
        "call mat katna", "chup", "don't hang up", "کسی کو نہ بتانا"
    ]
    for k in secrecy_keywords:
        if k in full_text:
            detected_tactics.append("Secrecy & Isolation")
            evidence_phrases.append(f"Demanded secrecy: '{k}'")
            score += 20
            break

    # Check 4: Credential & OTP Extraction (CRITICAL FRAUD TRIGGER)
    credential_keywords = [
        "otp", "pin", "password", "code", "6-digit", "digit", "cvv", "sms code", "او ٹی پی", "کوڈ"
    ]
    for k in credential_keywords:
        if k in full_text:
            detected_tactics.append("Credential & OTP Extraction")
            evidence_phrases.append(f"Demanded secret code: '{k}'")
            score += 35
            break

    # Check 5: Payment Redirection
    payment_keywords = [
        "transfer", "bhejo", "jazzcash", "easypaisa", "account", "paisa", "rupay", "wire", "ٹرانسفر"
    ]
    for k in payment_keywords:
        if k in full_text:
            detected_tactics.append("Payment Redirection")
            evidence_phrases.append(f"Directed money movement: '{k}'")
            score += 20
            break

    # Clamp score between 15 and 99
    risk_score = min(max(score, 15), 99)

    # Force near 100% when OTP or (Authority + Urgency) occurs
    if ("Credential & OTP Extraction" in detected_tactics) or (
        "Authority Impersonation" in detected_tactics and "Manufactured Urgency" in detected_tactics and len(detected_tactics) >= 3
    ):
        risk_score = 98

    # Determine Tier
    if risk_score >= 85:
        tier = 3
    elif risk_score >= 60:
        tier = 2
    elif risk_score >= 30:
        tier = 1
    else:
        tier = 0

    alert_triggered = risk_score >= 85

    return {
        "risk_score": risk_score,
        "tier": tier,
        "detected_tactics": detected_tactics,
        "evidence_phrases": evidence_phrases,
        "alert_triggered": alert_triggered
    }
