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
        "hai", "hein", "hain", "ho", "hora", "raha", "rahe", "bhejo", "bhejiye", "batao", "batayein",
        "mat", "ruko", "chup", "pakar", "foran", "warna", "bhai", "sahab", "paise", "paisa", "rupay",
        "band", "khata", "khabar", "ghalti", "fauran", "jaldi", "police", "jail", "parh", "aya", "gaya",
        "hoga", "kyun", "kyu", "kya", "kiya", "kuch", "nahi", "nai", "na"
    ]
    matches = sum(1 for w in lower.split() if w in roman_urdu_words)
    if matches >= 1:
        return "roman_urdu"
    
    return "english"

def generate_citizen_response(user_text: str, history: List[CallTurn], gemini_client=None) -> str:
    lang = detect_language(user_text)
    lower = user_text.lower().strip()

    # 1. Try Gemini 2.5 Flash if available
    if gemini_client:
        try:
            conversation_history_text = "\n".join([f"{t.speaker}: {t.text}" for t in history[-6:]])
            prompt = f"""You are Uncle Tariq, a 58-year-old innocent Pakistani citizen who just answered a phone call.
The caller (the user) is calling you and trying to scam you.

STRICT INSTRUCTIONS:
1. SPECIFICITY: Respond DIRECTLY and SPECIFICALLY to what the caller just said.
   - If they say your account is being blocked, ask in shock why your account is blocked. DO NOT mention police unless the caller mentioned police.
   - If they ask for OTP or code, refuse or ask why bank needs OTP.
   - If they mention police or arrest, panic about police.
   - If they ask your name or details, answer politely as Tariq Mahmood.
2. LANGUAGE MATCHING:
   - If caller used Urdu script (اردو), reply in natural Urdu script.
   - If caller used Roman Urdu (e.g. 'apka account block hora hai'), reply in everyday natural Roman Urdu (e.g. 'Arey beta mera account kyun block hoga? Maine to subah hi use kiya tha!').
   - If caller used English, reply in polite English.
3. Keep response under 20 words. Sound like a real person on a phone call.

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

    # 2. Highly specific and fine-grained offline matcher
    
    # Category A: Credential / OTP / PIN / Code
    if any(w in lower for w in ["otp", "code", "pin", "cvv", "password", "6 digit", "six digit", "کوڈ", "او ٹی پی", "پاسورڈ"]):
        if lang == "urdu_script":
            return "لیکن بھائی جان! بینک کے ایس ایم ایس میں لکھا ہے کہ او ٹی پی کسی کو نہ دیں۔ آپ مجھ سے کوڈ کیوں مانگ رہے ہیں؟"
        elif lang == "roman_urdu":
            return "Lekin beta! SMS me to saaf likha hai ke 6-digit OTP code kisi se share na karein. Main kaisay de doon?"
        else:
            return "Wait! My bank SMS strictly says never share this OTP code with anyone over phone."

    # Category B: Account Block / Freeze / Suspension (Specifically addresses user's query!)
    if any(w in lower for w in ["block", "freeze", "band", "suspend", "deactivate", "khata", "بلاک", "بند"]):
        if lang == "urdu_script":
            return "ارے بیٹا! میرا اکاؤنٹ کیوں بند ہو رہا ہے؟ میں نے تو کوئی غلطی نہیں کی، مجھے بتائیں میں کیا کروں؟"
        elif lang == "roman_urdu":
            return "Arey beta mera account kyun block hoga? Main ne to subah hi use kiya tha, koi ghalti nahi ki! Main kya karoon?"
        else:
            return "Wait, why is my account being blocked? I haven't done anything wrong! What seems to be the issue?"

    # Category C: Police / Arrest / Jail / Legal Threat / Raid
    if any(w in lower for w in ["police", "arrest", "jail", "raid", "fir", "thana", "court", "قید", "گرفتار", "پولیس"]):
        if lang == "urdu_script":
            return "ارے بھائی خدا کا خوف کریں، پولیس کیوں آئے گی میرے گھر؟ میں ایک شریف آدمی ہوں۔ میں نے کیا کیا ہے؟"
        elif lang == "roman_urdu":
            return "Arey bhai police kyun ayegi mere ghar? Khuda ka khauf karein, main shareef buzoorg aadmi hoon!"
        else:
            return "Why are you threatening me with police? I am a law-abiding citizen! Give me your official extension."

    # Category D: Urgent Money Transfer / JazzCash / Easypaisa
    if any(w in lower for w in ["transfer", "bhejo", "jazzcash", "easypaisa", "wire", "rupay", "paise", "bhej", "پیسے", "ٹرانسفر"]):
        if lang == "urdu_script":
            return "میں اتنی رقم انجان نمبر پر فوراً کیسے بھیج دوں؟ مجھے پہلے اپنے بیٹے سے پوچھنے دیں۔"
        elif lang == "roman_urdu":
            return "Beta main anjaan number pe foran paise kaisay bhej doon? Mujhay pehle apnay baitay Ali se mashwara karne dein."
        else:
            return "I cannot wire money to an unknown account right now. I need to consult my family first."

    # Category E: Identity / Who are you? / Name inquiry
    if any(w in lower for w in ["naam", "name", "who", "kahan", "kaun", "kon", "کون", "نام"]):
        if lang == "urdu_script":
            return "میرا نام طارق محمود ہے۔ لیکن بھائی آپ کون بول رہے ہیں اور کس برانچ سے ہیں؟"
        elif lang == "roman_urdu":
            return "Mera naam Tariq Mahmood hai beta. Lekin aap kon baat kar rahe hain aur kis bank se hain?"
        else:
            return "My name is Tariq Mahmood. May I ask who is calling and which department you represent?"

    # Category F: State Bank / Official Authority Claim
    if any(w in lower for w in ["state bank", "sbp", "manager", "head office", "officer", "اسٹیٹ بینک"]):
        if lang == "urdu_script":
            return "جی وعلیکم السلام، اسٹیٹ بینک سے؟ جی فرمائیں، میرے اکاؤنٹ کا کیا مسئلہ ہے؟"
        elif lang == "roman_urdu":
            return "Ji Walaikum Assalam, State Bank se? Ji batayein beta, mere account ka kya masla bana hai?"
        else:
            return "State Bank? Yes, please tell me what is the issue regarding my account?"

    # Category G: Secrecy demand
    if any(w in lower for w in ["mat batana", "secret", "kisi ko", "chup", "don't tell", "کسی کو نہ بتانا"]):
        if lang == "urdu_script":
            return "میں اپنے گھر والوں سے بات کیوں نہ کروں؟ یہ تو بڑی عجیب اور مشکوک بات ہے۔"
        elif lang == "roman_urdu":
            return "Main apnay ghar walon se kyun chupaon? Yeh to mashkook baat lag rahi hai mujhay."
        else:
            return "Why shouldn't I inform my family? That sounds very suspicious to me."

    # Default General Greeting / Question
    if lang == "urdu_script":
        return "وعلیکم السلام بھائی! خیریت تو ہے؟ آپ کس سلسلے میں بات کر رہے ہیں؟"
    elif lang == "roman_urdu":
        return "Walaikum Assalam beta! Khairiyat? Aap kis silsilay me baat kar rahe hain?"
    else:
        return "Hello? Who is speaking and how can I help you today?"

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
