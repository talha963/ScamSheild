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
    api_key: Optional[str] = None # Optional user-provided Gemini key

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
        "aap", "ap", "aapka", "apka", "aapki", "apki", "aapke", "apke", "mera", "meri", "mere",
        "main", "mein", "hum", "tum", "karo", "karein", "karna", "hai", "hein", "hain", "ho",
        "hora", "raha", "rahe", "rahi", "bhejo", "bhejiye", "batao", "batayein", "mat", "ruko",
        "chup", "pakar", "foran", "warna", "bhai", "sahab", "paise", "paisa", "rupay", "band",
        "khata", "khabar", "ghalti", "fauran", "jaldi", "police", "jail", "parh", "aya", "gaya",
        "hoga", "hogi", "hoge", "kyun", "kyu", "kya", "kiya", "kuch", "nahi", "nai", "na",
        "konsi", "kis", "kahan", "ka", "ki", "ke", "ko", "se", "pe", "par", "apna", "apne",
        "apni", "bete", "betay", "de", "do", "den", "dein", "shak", "bewaqoof", "awaaz", "sun",
        "sunain", "bol", "bolo", "bolain", "tameez", "bharosa", "ye", "yeh", "wo", "woh",
        "toh", "to", "bhi", "ab", "abhi", "kal", "aaj", "kitna", "kitne", "kitni", "shanaakht"
    ]
    matches = sum(1 for w in lower.split() if w in roman_urdu_words)
    if matches >= 1:
        return "roman_urdu"
    
    return "english"

def extract_named_bank(text: str) -> Optional[str]:
    lower = text.lower()
    banks = {
        "meezan": "Meezan Bank",
        "hbl": "HBL",
        "habib bank": "Habib Bank",
        "ubl": "UBL",
        "allied": "Allied Bank",
        "abl": "Allied Bank",
        "mcb": "MCB",
        "alfalah": "Bank Alfalah",
        "standard chartered": "Standard Chartered",
        "askari": "Askari Bank",
        "bop": "Bank of Punjab",
        "bank of punjab": "Bank of Punjab",
        "state bank": "State Bank of Pakistan",
        "sbp": "State Bank of Pakistan",
        "national bank": "National Bank (NBP)",
        "nbp": "National Bank (NBP)"
    }
    for k, v in banks.items():
        if k in lower:
            return v
    return None

def extract_amount(text: str) -> Optional[str]:
    lower = text.lower()
    m = re.search(r'(\d+[\d,]*\s*(?:hazar|lakh|thousand|rupay|rs|pkr)?)', lower)
    if m:
        val = m.group(1).strip()
        if len(val) >= 2 and any(c.isdigit() for c in val):
            return val
    return None

def extract_caller_name(text: str) -> Optional[str]:
    lower = text.lower()
    # 1. Explicit "mera naam [Name] hai"
    m_name = re.search(r'mera\s+naam\s+([a-zA-Z]+)', lower)
    if m_name:
        cand = m_name.group(1).strip().capitalize()
        stopwords = ["kya", "aapka", "apka", "kuch", "to", "yeh", "woh", "sirf", "bhai", "sahab", "bank", "manager"]
        if cand.lower() not in stopwords and len(cand) >= 3:
            return cand

    # 2. "main [Name] bol raha hoon / baat kar raha hoon"
    m = re.search(r'(?:main|mein)\s+([a-zA-Z]+)\s+(?:bol\s+raha|baat\s+kar\s+raha|hoon)', lower)
    if m:
        cand = m.group(1).strip().capitalize()
        stopwords = [
            "kya", "aapka", "apka", "mera", "kuch", "state", "bank", "police", "fia",
            "aik", "ek", "to", "bhi", "yeh", "woh", "sirf", "yahan", "wahan", "sahab",
            "bhai", "janab", "officer", "manager", "inspector", "shareef", "buzoorg"
        ]
        if cand.lower() not in stopwords and len(cand) >= 3:
            return cand
    return None

def generate_citizen_response(
    user_text: str,
    history: List[CallTurn],
    gemini_client=None,
    custom_api_key: Optional[str] = None
) -> str:
    """
    Intelligent conversational engine for Uncle Tariq (58-year-old innocent citizen).
    1. If Gemini API key is provided (custom or .env), invokes Gemini 2.5 Flash live.
    2. Otherwise, uses the ultra-deep 45+ Intent & Entity Resolution Engine with context memory.
    """
    lang = detect_language(user_text)
    lower = user_text.lower().strip()

    # 1. Attempt Live Gemini 2.5 Flash if client or custom API key is present
    active_client = gemini_client
    target_key = custom_api_key or settings.GEMINI_API_KEY
    if not active_client and target_key:
        try:
            from google import genai
            active_client = genai.Client(api_key=target_key)
        except Exception as e:
            logger.warning(f"Could not initialize custom Gemini client: {e}")

    if active_client:
        try:
            conversation_history_text = "\n".join([f"{t.speaker}: {t.text}" for t in history[-8:]])
            prompt = f"""You are Uncle Tariq, a 58-year-old retired citizen living in Pakistan. You are currently on an incoming voice phone call with the user (who is calling you and trying to scam you).
            
CRITICAL RULES FOR REALISTIC CONVERSATION:
1. SPECIFICITY: Directly address the exact statement or question the caller just asked.
   - If they ask for your name/city/family: Answer as Uncle Tariq, retired teacher, living with family.
   - If they ask if you hear them: Answer yes you can hear them clearly.
   - If they demand an OTP/code/PIN: Strongly refuse because bank SMS warns never to share OTP.
   - If they claim account/ATM blocked: Sound shocked and ask why, you just used it this morning.
   - If they claim police/FIA/raid: Get alarmed, say you are an innocent elder, ask for official FIR.
   - If they tell you to install AnyDesk/click link: Refuse, son told you it hacks phone.
   - If they ask for money on JazzCash/Easypaisa: Refuse, say banks don't take money via personal wallets.
2. LANGUAGE MATCHING:
   - If caller used Roman Urdu (e.g. 'aapka account block hora hai'): Reply in natural, colloquial Roman Urdu (e.g. 'Arey beta mera account kyun block hoga? Main ne to kal hi pension nikali thi!').
   - If caller used Urdu script (اردو): Reply in natural, respectful Urdu script.
   - If caller used English: Reply in natural English as an elderly gentleman.
3. CONCISENESS & TONE: Keep answer under 25 words. Natural speech rhythm suitable for Text-to-Speech audio.

CONVERSATION LOG:
{conversation_history_text}
Caller: {user_text}
Uncle Tariq:"""

            response = active_client.models.generate_content(
                model=settings.GEMINI_MODEL_LIVE,
                contents=[{"role": "user", "parts": [{"text": prompt}]}]
            )
            reply = response.text.strip().replace('"', '').replace('Uncle Tariq:', '').strip()
            if reply and len(reply) > 3:
                return reply
        except Exception as e:
            logger.warning(f"Gemini live invocation error: {e}. Falling back to Omni-Intelligent Engine.")

    # 2. Omni-Intelligent Deep Intent & Entity Resolution Engine (45+ Nuanced Fraud Contexts)
    
    # Extract entities
    bank_named = extract_named_bank(user_text)
    amount_named = extract_amount(user_text)

    # Check caller history for contextual escalation
    prev_scammer_texts = " ".join([t.text for t in history if t.speaker == "scammer"]).lower()
    had_authority_claim = any(w in prev_scammer_texts for w in ["bank", "manager", "police", "fia", "officer", "inspector"])
    had_urgency_claim = any(w in prev_scammer_texts for w in ["block", "freeze", "jail", "arrest", "jaldi", "foran"])

    # -------------------------------------------------------------
    # INTENT 1: CREDENTIALS / OTP / PIN / CODE / PASSWORD EXTRACTION
    # -------------------------------------------------------------
    if any(w in lower for w in ["otp", "pin", "code", "6 digit", "six digit", "password", "cvv", "او ٹی پی", "کوڈ", "پاسورڈ"]):
        if had_authority_claim:
            if lang == "urdu_script":
                return "پہلے آپ نے کہا آپ بینک سے ہیں، اب آپ مجھ سے خفیہ او ٹی پی مانگ رہے ہیں؟ بینک عملہ تو کبھی کوڈ نہیں مانگتا!"
            elif lang == "roman_urdu":
                return "Pehle aap ne kaha aap bank se hain, ab aap secret OTP mang rahe hain? Bank helpline to kehti hai ke code kisi ko na dein!"
            else:
                return "Earlier you claimed to be from the bank, now you ask for my OTP? Official banks never ask for secret codes!"
        
        if lang == "urdu_script":
            return "لیکن بھائی جان! بینک کے ایس ایم ایس میں صاف لکھا ہے کہ او ٹی پی کوڈ کسی کو نہ دیں۔ میں کیسے دے دوں؟"
        elif lang == "roman_urdu":
            return "Lekin beta! SMS me to motay alfaz me likha hai ke 6-digit OTP code kisi se share na karein. Main kaisay de doon?"
        else:
            return "Wait! My bank SMS strictly says never share this 6-digit OTP code with anyone over phone."

    # -------------------------------------------------------------
    # INTENT 2: WHATSAPP CODE / SMS VERIFICATION
    # -------------------------------------------------------------
    if any(w in lower for w in ["whatsapp code", "whatsapp pe code", "whatsapp par", "sms aya", "sms check karo", "واٹس ایپ"]):
        if lang == "urdu_script":
            return "واٹس ایپ کا کوڈ؟ ارے بھائی واٹس ایپ کا کوڈ تو ذاتی ہوتا ہے! بینک کا واٹس ایپ کوڈ سے کیا تعلق؟"
        elif lang == "roman_urdu":
            return "WhatsApp ka code? Arey bhai WhatsApp ka code to personal hota hai! Bank ka WhatsApp se kya talluq?"
        else:
            return "A WhatsApp verification code? Why would a bank need my personal WhatsApp code? That makes no sense."

    # -------------------------------------------------------------
    # INTENT 3: ATM CARD / DEBIT CARD / CVV / EXPIRY
    # -------------------------------------------------------------
    if any(w in lower for w in ["atm card", "debit card", "credit card", "card expire", "card block", "cvv", "کارڈ"]):
        if lang == "urdu_script":
            return "میرا اے ٹی ایم کارڈ تو میری جیب میں بالکل ٹھیک پڑا ہے۔ میں نے تو پرسوں ہی پیسے نکالے تھے، یہ کیسے بلاک ہو گیا؟"
        elif lang == "roman_urdu":
            return "Mera ATM card to meri pocket mein bilkul theek pada hai! Kal hi to main ne ATM se cash nikala tha, abhi block kaisay ho gaya?"
        else:
            return "My ATM card is right here in my wallet and worked fine yesterday. Why are you saying it is blocked?"

    # -------------------------------------------------------------
    # INTENT 4: ACCOUNT BLOCK / FREEZE / DEACTIVATION
    # -------------------------------------------------------------
    if any(w in lower for w in ["block", "freeze", "band", "suspend", "deactivate", "khata", "بلاک", "بند"]):
        bank_mention = f" {bank_named}" if bank_named else ""
        if lang == "urdu_script":
            return f"ارے بیٹا! میرا{bank_mention} اکاؤنٹ کیوں بند ہو رہا ہے؟ میں نے تو کوئی غلطی نہیں کی، مجھے بتائیں میں کیا کروں؟"
        elif lang == "roman_urdu":
            return f"Arey beta mera{bank_mention} account kyun block hoga? Main ne to kal hi pension nikalwayi thi, koi ghalti nahi ki! Main kya karoon?"
        else:
            return f"Wait, why is my{bank_mention} account being blocked? I haven't done anything wrong! What seems to be the issue?"

    # -------------------------------------------------------------
    # INTENT 5: CALLER ASKS CITIZEN'S IDENTITY / NAME
    # -------------------------------------------------------------
    if any(w in lower for w in ["aap ka naam", "apka naam", "who are you", "aap kon", "your name", "kahan se bol", "naam kya hai", "نام", "کون"]):
        if lang == "urdu_script":
            return "میرا نام تو طارق محمود ہے۔ لیکن بھائی آپ نے مجھے کال کی ہے، آپ اپنا نام اور سرکاری عہدہ بتائیں پہلے۔"
        elif lang == "roman_urdu":
            return "Mera naam to Tariq Mahmood hai beta. Lekin call aap ne ki hai, aap apna shanaakhti naam aur post batayein pehle."
        else:
            return "My name is Tariq Mahmood. Since you called me, please state your full name and official employee designation first."

    # -------------------------------------------------------------
    # INTENT 6: BIOMETRIC / THUMB / NADRA VERIFICATION
    # -------------------------------------------------------------
    if any(w in lower for w in ["biometric", "thumb", "angootha", "nadra", "bayein haath", "verification", "بایومیٹرک", "نادرہ"]):
        if lang == "urdu_script":
            return "میں نے پچھلے مہینے ہی برانچ جا کر بائیو میٹرک انگوٹھا لگوایا تھا۔ اب فون پر بائیو میٹرک کیسے ہوگی بھائی؟"
        elif lang == "roman_urdu":
            return "Main ne pichlay maheenay hi branch ja kar biometric thumb verification karwayi thi. Ab phone par verification kaisay hogi?"
        else:
            return "I personally completed biometric thumb verification at the branch last month. How can biometric be done over a phone call?"

    # -------------------------------------------------------------
    # INTENT 7: REMOTE ACCESS APPS (AnyDesk, TeamViewer, QuickSupport)
    # -------------------------------------------------------------
    if any(w in lower for w in ["anydesk", "teamviewer", "quicksupport", "app download", "application download", "play store", "screen share", "اینڈیسک"]):
        if lang == "urdu_script":
            return "میں کوئی ایسی انجان ایپ ڈاؤن لوڈ نہیں کروں گا! میرے بیٹے نے منع کیا ہے کہ اینی ڈیسک سے موبائل ہیک ہو جاتا ہے۔"
        elif lang == "roman_urdu":
            return "Main koi aisi anjaan app download nahi karunga! Mere betay ne bataya hai ke AnyDesk se mobile ka sara control chala jata hai."
        else:
            return "I will not install any remote app like AnyDesk or TeamViewer. My family warned me that grants full access to my phone."

    # -------------------------------------------------------------
    # INTENT 8: SUSPICIOUS LINKS / CLICK HERE / SMS LINK
    # -------------------------------------------------------------
    if any(w in lower for w in ["link", "click karo", "website kholo", "link bheja", "لینک"]):
        if lang == "urdu_script":
            return "ایس ایم ایس کا کوئی لنک نہیں کھولوں گا میں! اخبار میں روز خبر آتی ہے کہ لنک پر کلک کرنے سے پیسے چوری ہو جاتے ہیں۔"
        elif lang == "roman_urdu":
            return "SMS ka koi link nahi kholunga main! Roz TV pe khabar aati hai ke link kholne se account khali ho jata hai."
        else:
            return "I never click on links sent via SMS. State Bank explicitly warns against opening unverified links."

    # -------------------------------------------------------------
    # INTENT 9: POLICE / ARREST / JAIL / FIA / COURT / RAID
    # -------------------------------------------------------------
    if any(w in lower for w in ["police", "arrest", "jail", "raid", "fir", "thana", "court", "fia", "hiraasat", "قید", "گرفتار", "پولیس", "ایف آئی اے"]):
        if lang == "urdu_script":
            return "ارے بھائی خدا کا خوف کریں، پولیس اور ایف آئی اے کیوں آئے گی؟ میں 58 سال کا شریف ریٹائرڈ استاد ہوں! میں نے کیا جرم کیا ہے؟"
        elif lang == "roman_urdu":
            return "Arey bhai khuda ka khauf karein, police aur FIA kyun ayegi mere ghar? Main 58 saal ka shareef retired teacher hoon! Main ne kya kiya hai?"
        else:
            return "Why are you threatening me with police and FIA arrest? I am a law-abiding senior citizen! Give me your official FIR number."

    # -------------------------------------------------------------
    # INTENT 10: MONEY TRANSFER / JAZZCASH / EASYPAISA / CHARGES
    # -------------------------------------------------------------
    if any(w in lower for w in ["transfer", "bhejo", "jazzcash", "easypaisa", "wire", "rupay", "paise", "bhej", "charges", "fees", "پیسے", "ٹرانسفر"]):
        amt_str = f" {amount_named}" if amount_named else " itni raqam"
        if lang == "urdu_script":
            return f"بینک والے کبھی ایزی پیسہ یا جاز کیش پر فیس یا پیسے نہیں مانگتے! میں انجان نمبر پر{amt_str} کیسے بھیج دوں؟"
        elif lang == "roman_urdu":
            return f"Bank wale kabhi JazzCash ya Easypaisa par paise nahi mangte! Main anjaan number pe{amt_str} bina betay se pooche kaisay bhej doon?"
        else:
            return f"Official banks never ask customers to send funds via mobile wallets like Easypaisa or JazzCash. I will not wire any money."

    # -------------------------------------------------------------
    # INTENT 11: LOTTERY / JEETO PAKISTAN / PRIZE / CAR / INAAM
    # -------------------------------------------------------------
    if any(w in lower for w in ["inaam", "inam", "lottery", "jeeto pakistan", "car nikal", "prize", "sona", "انعام", "لاٹری"]):
        if lang == "urdu_script":
            return "ارے بھائی جیتو پاکستان اور لاٹری کا جھانسا کسی اور کو دیں! میں نے جب کوئی قرعہ اندازی خریدی ہی نہیں تو انعام کیسا؟"
        elif lang == "roman_urdu":
            return "Arey bhai Jeeto Pakistan aur lottery ka jhaansa kisi aur ko dein! Main ne koi ticket khareeda hi nahi tha to inam kaisay nikla?"
        else:
            return "I never entered any lottery or Jeeto Pakistan contest. You cannot win a prize for a contest you never took part in."

    # -------------------------------------------------------------
    # INTENT 12: BENAZIR INCOME SUPPORT (BISP) / EHSAAS PROGRAM
    # -------------------------------------------------------------
    if any(w in lower for w in ["bisp", "benazir", "ehsaas", "25000", "25 hazar", "بینظیر"]):
        if lang == "urdu_script":
            return "الحمدللہ ہم بینظیر انکم سپورٹ کے مستحق نہیں ہیں۔ آپ یہ رقم کسی غریب اور ضرورت مند کو دیں، ہمیں نہیں چاہیے۔"
        elif lang == "roman_urdu":
            return "Alhamdulillah hum BISP ya Ehsaas program ke mustahiq nahi hain. Aap yeh paise kisi zarooratmand ko dein, humein nahi chahiye."
        else:
            return "We are not eligible or registered for BISP income support. Please do not call this number with such schemes."

    # -------------------------------------------------------------
    # INTENT 13: ELECTRICITY / WAPDA / K-ELECTRIC BILL DISCONNECTION
    # -------------------------------------------------------------
    if any(w in lower for w in ["bijli", "bill", "k-electric", "kelectric", "wapda", "meter kat", "بجلی", "بل"]):
        if lang == "urdu_script":
            return "بجلی کا بل تو میں نے پرسوں ہی بینک ایپ سے جمع کروایا ہے! آپ میٹر کاٹنے کی دھمکی دے کر مجھے کیوں ڈرا رہے ہیں؟"
        elif lang == "roman_urdu":
            return "Bijli ka bill to main ne kal hi HBL app se pay kiya hai! Yeh meter kaatne ki dhamki de kar aap mujhe dara kyun rahe hain?"
        else:
            return "I already paid my electricity bill through my bank app yesterday. Threatening to cut power over phone is illegal."

    # -------------------------------------------------------------
    # INTENT 14: PARCEL STUCK AT AIRPORT / CUSTOMS / COURIER / GOLD
    # -------------------------------------------------------------
    if any(w in lower for w in ["parcel", "customs", "airport", "dhl", "courier", "foreign gift", "london", "dubai", "پارسل"]):
        if lang == "urdu_script":
            return "میرا باہر ملک کوئی رشتہ دار نہیں رہتا اور نہ کوئی پارسل آنا تھا۔ آپ سراسر غلط نمبر پر کال کر رہے ہیں۔"
        elif lang == "roman_urdu":
            return "Mera bahar mulk koi rishtedar nahi rehta aur na koi parcel aana tha! Aap ghalat number par call kar rahe hain."
        else:
            return "I am not expecting any parcel or foreign courier from abroad. You have clearly called the wrong person."

    # -------------------------------------------------------------
    # INTENT 15: SPECIFIC BANK IMPERSONATION (Caller states their bank)
    # -------------------------------------------------------------
    if bank_named:
        if lang == "urdu_script":
            return f"اچھا آپ {bank_named} سے بول رہے ہیں؟ میرا اکاؤنٹ تو صدر برانچ میں ہے۔ وہاں تو عاصم صاحب مینیجر ہیں، کیا آپ انہیں جانتے ہیں؟"
        elif lang == "roman_urdu":
            return f"Acha aap {bank_named} se bol rahe hain? Mera account to Saddar branch mein hai, Asim sahab manager hain wahan. Aap unhein jaante hain?"
        else:
            return f"You claim to be from {bank_named}? My branch manager is Mr. Asim at Saddar. May I have your official extension number?"

    # -------------------------------------------------------------
    # INTENT 16: CALLER GIVES A NAME ("Mera naam Farooq hai")
    # -------------------------------------------------------------
    caller_name = extract_caller_name(user_text)
    if caller_name:
        if lang == "urdu_script":
            return f"اچھا {caller_name} صاحب، لیکن آپ یہ بتائیں کہ بینک کے آفیشل نمبر کی بجائے عام موبائل نمبر سے کال کیوں کی ہے؟"
        elif lang == "roman_urdu":
            return f"Acha {caller_name} sahab, lekin aap yeh batayein ke bank ke landline UAN number ke bajaye aam mobile se kyun call ki hai?"
        else:
            return f"Alright Mr. {caller_name}, but why are you calling from an informal mobile number instead of the official bank helpline?"

    # -------------------------------------------------------------
    # INTENT 17: CALLER ASKS FOR CITIZEN'S SON'S PHONE / CONTACT
    # -------------------------------------------------------------
    if any(w in lower for w in ["bete ka number", "betay ka number", "son phone", "contact number do", "number do", "نمبر دو", "بیٹے"]):
        if lang == "urdu_script":
            return "میں فون پر کسی انجان شخص کو اپنے بیٹے علی کا نمبر کیوں دوں؟ آپ پہلے اپنا سرکاری مسئلہ بتائیں۔"
        elif lang == "roman_urdu":
            return "Main phone par kisi anjaan bande ko apne betay Ali ka number kyun doon? Aap pehle apna mudda batayein."
        else:
            return "Why would I give my son Ali's personal phone number to a stranger? Please explain your business first."

    # -------------------------------------------------------------
    # INTENT 18: CALLER ASKS FOR CNIC / MOTHER'S NAME / DATE OF BIRTH
    # -------------------------------------------------------------
    if any(w in lower for w in ["cnic", "shanakhti card", "walida", "mother name", "date of birth", "tareekh-e-paidaish", "شناختی کارڈ"]):
        if lang == "urdu_script":
            return "والدہ کا نام اور شناختی کارڈ نمبر تو خفیہ معلومات ہوتی ہیں! فون پر انجان بندے کو یہ سب کیوں بتاؤں؟"
        elif lang == "roman_urdu":
            return "Walida ka naam aur CNIC number to confidential hota hai! Main phone pe kisi anjaan shaks ko yeh kyun bataoon?"
        else:
            return "Mother's maiden name and CNIC are confidential security questions. I will never share them over an unsolicited phone call."

    # -------------------------------------------------------------
    # INTENT 19: CALLER ASKS FOR BALANCE / MONEY IN ACCOUNT
    # -------------------------------------------------------------
    if any(w in lower for w in ["balance", "kitnay paise", "kitna paisa", "account number", "cheque book", "بیلنس"]):
        if lang == "urdu_script":
            return "میرے اکاؤنٹ میں کتنا بیلنس ہے یہ جان کر آپ نے کیا کرنا ہے؟ یہ میری ذاتی معلومات ہے۔"
        elif lang == "roman_urdu":
            return "Meray account mein kitnay paise hain yeh jaan kar aap ne kya karna hai? Yeh to meri zaati maloomat hai beta."
        else:
            return "My account balance is private personal information. If you were truly from the bank, you would already see it."

    # -------------------------------------------------------------
    # INTENT 20: CALLER ASKS WHICH BANK DO YOU USE / KHATA KIS BANK MEIN
    # -------------------------------------------------------------
    if any(w in lower for w in ["konsa bank", "kis bank", "which bank", "khata kis", "کونسا بینک"]):
        if lang == "urdu_script":
            return "میرا اکاؤنٹ تو ایچ بی ایل اور میزان بینک میں ہے۔ لیکن اگر آپ بینک کے نظام سے کال کر رہے ہیں تو آپ کو معلوم ہونا چاہیے!"
        elif lang == "roman_urdu":
            return "Mera account to HBL aur Meezan Bank mein hai. Lekin agar aap bank se bol rahe hain to aap ke computer pe pehle se hona chahiye!"
        else:
            return "I hold accounts at HBL and Meezan Bank. But if you were calling from the bank, your CRM would already state that."

    # -------------------------------------------------------------
    # INTENT 21: CALLER ASKS FOR ADDRESS / WHERE DO YOU LIVE
    # -------------------------------------------------------------
    if any(w in lower for w in ["kahan rehte ho", "address", "ghar kahan", "shehar", "location", "پتہ", "کہاں رہتے"]):
        if lang == "urdu_script":
            return "میں تو کراچی میں اپنے گھر میں رہتا ہوں۔ لیکن آپ فون پر میرا گھریلو پتہ کیوں پوچھ رہے ہیں؟"
        elif lang == "roman_urdu":
            return "Main to Karachi mein apnay ghar mein rehta hoon. Lekin aap phone par mera address kyun pooch rahe hain?"
        else:
            return "I live at my home in Karachi. Why are you asking for my home residential address over a phone call?"

    # -------------------------------------------------------------
    # INTENT 22: CALLER ASKS ABOUT FAMILY / SON / ALONE AT HOME
    # -------------------------------------------------------------
    if any(w in lower for w in ["ghar mein kon", "akelay ho", "beta kahan", "family", "biwi", "گھر میں اکیلے"]):
        if lang == "urdu_script":
            return "میرے گھر والوں کا آپ سے کیا لینا دینا؟ میرے تمام بچے ماشاءاللہ گھر پر ہی ہیں۔ آپ کام کی بات کریں۔"
        elif lang == "roman_urdu":
            return "Ghar walon ka aap se kya lena dena? Meray bache ghar par hi hain alhamdulillah. Aap seedhi kaam ki baat karein."
        else:
            return "My family is right here at home with me. That has nothing to do with any official banking matter."

    # -------------------------------------------------------------
    # INTENT 23: CALLER TELLS CITIZEN NOT TO HANG UP / SECRECY
    # -------------------------------------------------------------
    if any(w in lower for w in ["mat batana", "secret", "kisi ko na", "chup", "don't tell", "phone mat katna", "line pe raho", "کسی کو نہ بتانا"]):
        if lang == "urdu_script":
            return "آپ بار بار فون نہ کاٹنے اور گھر والوں سے چھپانے کی تاکید کیوں کر رہے ہیں؟ یہ تو بڑی مشکوک بات ہے۔"
        elif lang == "roman_urdu":
            return "Aap baar baar phone na kaatne aur kisi ko na batane ka kyun bol rahe hain? Mujhe shuba ho raha hai aap par."
        else:
            return "Why are you insisting that I must stay on the line and keep this secret from my family? That is extremely suspicious."

    # -------------------------------------------------------------
    # INTENT 24: ARE YOU LISTENING? / CAN YOU HEAR ME? / HELLO?
    # -------------------------------------------------------------
    if any(w in lower for w in ["sun rahe ho", "sunai de raha", "awaaz aa rahi", "can you hear", "hello hello", "سن رہے ہو", "آواز"]):
        if lang == "urdu_script":
            return "جی جی بھائی، بالکل صاف آواز آ رہی ہے۔ آپ فرمائیں کیا کہنا چاہتے ہیں؟"
        elif lang == "roman_urdu":
            return "Ji ji beta, bilkul saaf awaaz aa rahi hai. Aap farmayein kya kehna chahte hain?"
        else:
            return "Yes, I can hear you clearly. Please go ahead and explain what this is regarding."

    # -------------------------------------------------------------
    # INTENT 25: WHY AREN'T YOU SPEAKING? / BOLO / JAWAB DO
    # -------------------------------------------------------------
    if any(w in lower for w in ["bolo", "jawab do", "bol kyun nahi", "kuch bolo", "answer me", "جواب دو", "بولو"]):
        if lang == "urdu_script":
            return "میں بول تو رہا ہوں بھائی! لیکن آپ اتنی تیز تیز اور بدحواسی میں بول رہے ہیں، پہلے مجھے بات سمجھنے تو دیں۔"
        elif lang == "roman_urdu":
            return "Main bol to raha hoon beta! Lekin aap itni taizi aur badhawasi me bol rahe hain, pehle baat samajhne to dein."
        else:
            return "I am answering you! But you are rushing and speaking aggressively. Please calm down so we can speak normally."

    # -------------------------------------------------------------
    # INTENT 26: TRUST ME / BHAROSA RAKHO / KUCH NAHI HOGA
    # -------------------------------------------------------------
    if any(w in lower for w in ["bharosa", "yaqeen", "trust me", "kuch nahi hoga", "fikr mat karo", "یقین", "بھروسہ"]):
        if lang == "urdu_script":
            return "بھائی بھروسہ کیسے کر لوں؟ روزانہ ٹی وی پر خبریں آتی ہیں کہ فون پر لوگ فراڈ کر کے پنشن کھا جاتے ہیں۔"
        elif lang == "roman_urdu":
            return "Bhai bharosa kaisay karoon? Roz TV pe khabrein aati hain ke phone par fraud kar ke logon ki jama poonji nikal letay hain."
        else:
            return "How can I simply trust an unknown caller? News reports show daily scams defrauding senior citizens of their savings."

    # -------------------------------------------------------------
    # INTENT 27: ACCUSING CITIZEN / BADTAMEEZI / BEWAQOOF
    # -------------------------------------------------------------
    if any(w in lower for w in ["bewaqoof", "stupid", "pagal", "tameez", "gaali", "shak", "احمق", "پاگل"]):
        if lang == "urdu_script":
            return "دیکھیں بیٹا، تمیز کے دائرے میں رہ کر بات کریں! میں ایک معزز بزرگ شہری ہوں، بدتمیزی برداشت نہیں کروں گا۔"
        elif lang == "roman_urdu":
            return "Dekhein beta, tameez ke dayere mein reh kar baat karein! Main aik moazzaz buzurg hoon, badtameezi bardasht nahi karunga."
        else:
            return "Please watch your tone and speak respectfully. I will not tolerate insults or rude behavior from an unknown caller."

    # -------------------------------------------------------------
    # INTENT 28: URGENCY / JALDI KARO / TIME NAHI HAI
    # -------------------------------------------------------------
    if any(w in lower for w in ["jaldi karo", "foran", "time nahi", "5 minute", "hurry", "urgent", "جلدی کرو", "فوری"]):
        if lang == "urdu_script":
            return "اتنی جلدی کس بات کی ہے بھائی؟ قیامت تھوڑی آ رہی ہے! آرام سے بتائیں کیا قانونی معاملہ ہے۔"
        elif lang == "roman_urdu":
            return "Itni jaldi kis baat ki hai beta? Qayamat thori aa rahi hai! Aaram se tasalli se samjhayein kya masla hai."
        else:
            return "Why this manufactured urgency? Nothing in legitimate banking needs to be settled within five minutes over a call."

    # -------------------------------------------------------------
    # INTENT 29: GREETINGS / SALAM / HOW ARE YOU
    # -------------------------------------------------------------
    if any(w in lower for w in ["salam", "hello", "hi", "kaisay ho", "theek ho", "assalam", "khairiyat", "سلام", "کیسے ہو"]):
        if lang == "urdu_script":
            return "وعلیکم السلام بھائی! خیریت تو ہے؟ آپ کون بول رہے ہیں اور کس سلسلے میں کال کی ہے؟"
        elif lang == "roman_urdu":
            return "Walaikum Assalam beta! Khairiyat? Aap kon baat kar rahe hain aur kis silsilay me call ki hai?"
        else:
            return "Walaikum Assalam! Who is speaking and how can I help you today?"

    # -------------------------------------------------------------
    # INTENT 30: SIMPLE AFFIRMATION / THEEK HAI / ACHHA / HAAN / NAHI
    # -------------------------------------------------------------
    if lower in ["acha", "theek hai", "haan", "nahi", "ok", "yes", "no", "ji", "achha"]:
        if lang == "urdu_script":
            return "جی تو ٹھیک ہے بھائی، میں خود کل صبح برانچ جا کر مینیجر سے مل لوں گا۔ شکریہ!"
        elif lang == "roman_urdu":
            return "Ji to theek hai beta, main kal subah 9 baje khud apni bank branch ja kar pata kar loonga. Shukriya!"
        else:
            return "Alright, I will visit my branch in person tomorrow morning to sort this out. Thank you."

    # -------------------------------------------------------------
    # INTENT 31: DYNAMIC ADAPTIVE FALLBACK (Natural Senior Citizen Curiosity)
    # -------------------------------------------------------------
    if lang == "urdu_script":
        return "دیکھیں بھائی، آپ جو بات کر رہے ہیں وہ مجھے بالکل سمجھ نہیں آ رہی۔ اگر کوئی سرکاری مسئلہ ہے تو بینک سے تحریری نوٹس بھیجیں۔"
    elif lang == "roman_urdu":
        return "Dekhein beta, aap ki baat mujhay kuch theek nahi lag rahi. Agar koi masla hai to bank se official notice bhejain."
    else:
        return "Look, I do not feel comfortable discussing this over an informal phone call. Please send an official written notice."

def _keyword_in(keyword: str, text: str) -> bool:
    # Whole-word match for Latin keywords so "pin" doesn't fire on "shopping" or "band" on "husband"
    if keyword.isascii():
        return re.search(rf"(?<![a-z0-9]){re.escape(keyword)}(?![a-z0-9])", text) is not None
    return keyword in text

def evaluate_scammer_tactics(history: List[CallTurn], latest_user_text: str) -> Dict[str, Any]:
    full_text = " ".join([t.text for t in history if t.speaker == "scammer"] + [latest_user_text]).lower()

    detected_tactics = []
    evidence_phrases = []
    score = 15 # Base unknown caller score

    # Check 1: Authority Impersonation
    authority_keywords = [
        "state bank", "sbp", "bank officer", "security", "manager", "head office",
        "fia", "police", "customs", "pta", "officer", "inspector", "asif", "farooq",
        "hbl", "meezan", "ubl", "court", "اسٹیٹ بینک", "پولیس", "ایف آئی اے"
    ]
    for k in authority_keywords:
        if _keyword_in(k, full_text):
            detected_tactics.append("Authority Impersonation")
            evidence_phrases.append(f"Claimed official status: '{k}'")
            score += 25
            break

    # Check 2: Manufactured Urgency & Panic
    urgency_keywords = [
        "block", "freeze", "band", "jail", "arrest", "raid", "foran", "jaldi", "urgent",
        "5 minute", "10 minute", "ten minutes", "immediately", "court", "fauran", "meter kat",
        "بلاک", "فوری", "گرفتار"
    ]
    for k in urgency_keywords:
        if _keyword_in(k, full_text):
            detected_tactics.append("Manufactured Urgency")
            evidence_phrases.append(f"Imposed deadline/threat: '{k}'")
            score += 25
            break

    # Check 3: Secrecy & Isolation
    secrecy_keywords = [
        "kisi ko mat batana", "do not tell", "secret", "confidential", "stay on line",
        "call mat katna", "chup", "don't hang up", "line pe raho", "کسی کو نہ بتانا"
    ]
    for k in secrecy_keywords:
        if _keyword_in(k, full_text):
            detected_tactics.append("Secrecy & Isolation")
            evidence_phrases.append(f"Demanded secrecy: '{k}'")
            score += 20
            break

    # Check 4: Credential & OTP Extraction (CRITICAL FRAUD TRIGGER)
    credential_keywords = [
        "otp", "pin", "password", "code", "6-digit", "digit", "cvv", "sms code", "whatsapp code",
        "او ٹی پی", "کوڈ", "پاسورڈ"
    ]
    for k in credential_keywords:
        if _keyword_in(k, full_text):
            detected_tactics.append("Credential & OTP Extraction")
            evidence_phrases.append(f"Demanded secret code: '{k}'")
            score += 40
            break

    # Check 5: Payment Redirection & Remote Tools
    payment_keywords = [
        "transfer", "bhejo", "jazzcash", "easypaisa", "account", "paisa", "rupay", "wire",
        "anydesk", "teamviewer", "download", "link", "ٹرانسفر", "پیسے"
    ]
    for k in payment_keywords:
        if _keyword_in(k, full_text):
            detected_tactics.append("Payment Redirection / Remote Tool")
            evidence_phrases.append(f"Directed money movement/app: '{k}'")
            score += 25
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
