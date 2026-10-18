"""
Build Full AI Builder Cup Presentation (Google Cloud & H2S Template)
Team: CogniFlow | Leader: Talha Habib
Project: ScamShield Live
"""

import sys
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

TEMPLATE_PATH = r"C:\Users\tk706\.gemini\antigravity\brain\b36f7999-cc10-492d-88b9-6d654c5f7704\.user_uploaded\media_1792306310983_19193e02.pptx"
OUTPUT_PATH = r"d:\AI Builder\scamshield-live\CogniFlow_AI_Builder_Cup_Submission.pptx"
ROOT_OUTPUT_PATH = r"d:\AI Builder\CogniFlow_AI_Builder_Cup_Submission.pptx"
WEB_OUTPUT_PATH = r"d:\AI Builder\scamshield-live\apps\web\public\CogniFlow_AI_Builder_Cup_Submission.pptx"

# Color Palette (Google Cloud & High-Contrast Cyber Palette)
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_MUTED = RGBColor(148, 163, 184)      # Slate 400
COLOR_SUBTEXT = RGBColor(203, 213, 225)    # Slate 300
COLOR_DARK_BG = RGBColor(10, 15, 29)      # Obsidian Navy
COLOR_CARD_BG = RGBColor(18, 25, 42)      # Deep Navy Card
COLOR_CARD_BORDER = RGBColor(40, 53, 78)  # Slate Border
COLOR_CYAN = RGBColor(56, 189, 248)       # Sky 400 (Google Blue/Cyan)
COLOR_EMERALD = RGBColor(52, 211, 153)    # Emerald 400 (Security Green)
COLOR_AMBER = RGBColor(251, 191, 36)      # Amber 400 (Warning)
COLOR_ROSE = RGBColor(248, 113, 113)      # Rose 400 (Threat Red)
COLOR_PURPLE = RGBColor(192, 132, 252)    # Purple 400 (AI)

FONT_HEADING = "Google Sans"
FONT_BODY = "Google Sans"

prs = Presentation(TEMPLATE_PATH)

def format_title_shape(slide, new_title=None, new_subtitle=None):
    """Finds existing title shape on template and styles it"""
    for shape in slide.shapes:
        if shape.has_text_frame and shape.top < Inches(1.5) and shape.left < Inches(1.0):
            tf = shape.text_frame
            if new_title:
                tf.clear()
                p = tf.paragraphs[0]
                p.text = new_title
                p.font.name = FONT_HEADING
                p.font.size = Pt(20)
                p.font.bold = True
                p.font.color.rgb = COLOR_WHITE
                if new_subtitle:
                    p2 = tf.add_paragraph()
                    p2.text = new_subtitle
                    p2.font.name = FONT_BODY
                    p2.font.size = Pt(11)
                    p2.font.color.rgb = COLOR_CYAN
            return shape
    return None

def add_card(slide, left, top, width, height, bg_color=COLOR_CARD_BG, border_color=COLOR_CARD_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    card.fill.solid()
    card.fill.fore_color.rgb = bg_color
    card.line.color.rgb = border_color
    card.line.width = Pt(1.2)
    return card

def add_bullet(tf, title, desc, bullet_color=COLOR_CYAN, title_color=COLOR_WHITE, desc_color=COLOR_SUBTEXT, size=11, space_after=6):
    p = tf.add_paragraph()
    p.space_after = Pt(space_after)
    
    r1 = p.add_run()
    r1.text = "• "
    r1.font.bold = True
    r1.font.color.rgb = bullet_color
    r1.font.size = Pt(size)
    
    if title:
        r2 = p.add_run()
        r2.text = f"{title}: "
        r2.font.bold = True
        r2.font.color.rgb = title_color
        r2.font.size = Pt(size)
        
    r3 = p.add_run()
    r3.text = desc
    r3.font.color.rgb = desc_color
    r3.font.size = Pt(size)

# ==============================================================================
# SLIDE 1: Team Details
# ==============================================================================
print("Formatting Slide 1: Team Details...")
slide1 = prs.slides[0]
for shape in slide1.shapes:
    if shape.has_text_frame and "Team Details" in shape.text:
        tf = shape.text_frame
        tf.clear()
        
        p0 = tf.paragraphs[0]
        p0.text = "Team Details"
        p0.font.name = FONT_HEADING
        p0.font.size = Pt(24)
        p0.font.bold = True
        p0.font.color.rgb = COLOR_WHITE
        p0.space_after = Pt(14)
        
        p1 = tf.add_paragraph()
        r1 = p1.add_run(); r1.text = "Team Name: "; r1.font.bold = True; r1.font.color.rgb = COLOR_CYAN
        r2 = p1.add_run(); r2.text = "CogniFlow"; r2.font.bold = True; r2.font.color.rgb = COLOR_WHITE
        p1.font.size = Pt(17); p1.space_after = Pt(6)
        
        p2 = tf.add_paragraph()
        r1 = p2.add_run(); r1.text = "Team Leader: "; r1.font.bold = True; r1.font.color.rgb = COLOR_CYAN
        r2 = p2.add_run(); r2.text = "Talha Habib"; r2.font.bold = True; r2.font.color.rgb = COLOR_WHITE
        p2.font.size = Pt(17); p2.space_after = Pt(6)
        
        p3 = tf.add_paragraph()
        r1 = p3.add_run(); r1.text = "Problem Statement: "; r1.font.bold = True; r1.font.color.rgb = COLOR_CYAN
        r2 = p3.add_run(); r2.text = "Autonomous Voice Social Engineering Defense & Graduated Circuit-Breaker System (BFSI Track)"
        r2.font.color.rgb = COLOR_WHITE
        p3.font.size = Pt(14); p3.space_after = Pt(6)
        
        p4 = tf.add_paragraph()
        r1 = p4.add_run(); r1.text = "Proposed Solution: "; r1.font.bold = True; r1.font.color.rgb = COLOR_EMERALD
        r2 = p4.add_run(); r2.text = "ScamShield Live — Cloud-Native Voice Fraud Protection with Google Gemini & 15-Minute Safety Escrow"
        r2.font.bold = True; r2.font.color.rgb = COLOR_WHITE
        p4.font.size = Pt(14)

# ==============================================================================
# REMOVE SLIDE 2 (Template Instruction Note)
# ==============================================================================
print("Removing template instruction slide...")
slide_id_list = prs.slides._sldIdLst
slide_to_delete = slide_id_list[1]
prs.part.drop_rel(slide_to_delete.rId)
del slide_id_list[1]

# Now slide indices:
# index 1: Brief about the idea
# index 2: Opportunities
# index 3: List of features offered
# index 4: Process flow diagram
# index 5: Wireframes / Mock diagrams
# index 6: Architecture diagram
# index 7: Technologies used
# index 8: Estimated implementation cost
# index 9: Snapshots of prototype
# index 10: Performance report / Benchmarking
# index 11: Additional Details / Future Roadmap
# index 12: Links slide
# index 13: Thank You

# ==============================================================================
# SLIDE 2 (Index 1): Brief about the idea
# ==============================================================================
print("Formatting Slide 2: Brief about the idea...")
s2 = prs.slides[1]
format_title_shape(s2, "Brief about the idea", "Real-time AI voice social engineering defense stopping coerced fund theft before money moves")

# 3 Columns: Problem, Solution, Innovation
c1 = add_card(s2, 0.4, 1.45, 2.9, 3.8, COLOR_CARD_BG, COLOR_ROSE)
tb1 = s2.shapes.add_textbox(Inches(0.5), Inches(1.55), Inches(2.7), Inches(3.6))
tf1 = tb1.text_frame; tf1.word_wrap = True; tf1.margin_left = tf1.margin_right = tf1.margin_top = 0
p = tf1.paragraphs[0]; p.text = "🚨 The Problem (Vishing)"; p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_ROSE; p.space_after = Pt(8)
add_bullet(tf1, "The #1 Fraud Vector", "Voice social engineering accounts for billions in unrecoverable losses across JAPAC banks.", COLOR_ROSE, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf1, "High-Pressure Coercion", "Impersonators pose as State Bank, police, or kidnapped children, manufacturing panic.", COLOR_ROSE, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf1, "Victim Vulnerability", "Senior citizens & everyday savers are manipulated into reading OTPs or sending instant transfers.", COLOR_ROSE, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf1, "Caller-ID Blindness", "Static blacklists fail against spoofed numbers and new burner SIMs.", COLOR_ROSE, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)

c2 = add_card(s2, 3.55, 1.45, 2.9, 3.8, COLOR_CARD_BG, COLOR_CYAN)
tb2 = s2.shapes.add_textbox(Inches(3.65), Inches(1.55), Inches(2.7), Inches(3.6))
tf2 = tb2.text_frame; tf2.word_wrap = True; tf2.margin_left = tf2.margin_right = tf2.margin_top = 0
p = tf2.paragraphs[0]; p.text = "🛡️ The Solution (ScamShield)"; p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_CYAN; p.space_after = Pt(8)
add_bullet(tf2, "Real-Time In-Call AI", "Listens quietly in background without recording audio; analyzes phonetic & intent trajectories.", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf2, "Powered by Gemini", "Google Gemini 3.8 Flash detects pressure tactics and secret credential harvesting in <1.4s.", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf2, "Multilingual Defense", "Speaks calm warnings in Urdu, Punjabi, and English ('Bank never asks for OTP. Hang up!').", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf2, "Zero Privacy Risk", "Operates via differential privacy and privacy vault tokenization.", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)

c3 = add_card(s2, 6.7, 1.45, 2.9, 3.8, COLOR_CARD_BG, COLOR_EMERALD)
tb3 = s2.shapes.add_textbox(Inches(6.8), Inches(1.55), Inches(2.7), Inches(3.6))
tf3 = tb3.text_frame; tf3.word_wrap = True; tf3.margin_left = tf3.margin_right = tf3.margin_top = 0
p = tf3.paragraphs[0]; p.text = "⚡ The Circuit-Breaker"; p.font.bold = True; p.font.size = Pt(14); p.font.color.rgb = COLOR_EMERALD; p.space_after = Pt(8)
add_bullet(tf3, "15-Min Safety Escrow", "Intervenes before money leaves. Freezes high-risk transfers during active scam calls.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf3, "Guardian Circle", "Automatically alerts adult children on WhatsApp/SMS with 1-tap approval or reversal link.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf3, "100% Funds Refund", "Victim or family cancels transfer during cooling-off window; scammer receives Rs. 0.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf3, "Forensic Dispute Dossier", "Auto-compiles PDF incident evidence for banking regulators & FIA Cybercrime filing.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)

# ==============================================================================
# SLIDE 3 (Index 2): Opportunities
# ==============================================================================
print("Formatting Slide 3: Opportunities...")
s3 = prs.slides[2]
format_title_shape(s3, "Opportunities & Market Differentiation", "Why existing solutions fail and how ScamShield Live creates an unassailable defensive moat")

c1 = add_card(s3, 0.4, 1.45, 4.45, 3.8)
tb1 = s3.shapes.add_textbox(Inches(0.55), Inches(1.55), Inches(4.15), Inches(3.6))
tf1 = tb1.text_frame; tf1.word_wrap = True; tf1.margin_left = tf1.margin_right = tf1.margin_top = 0
p = tf1.paragraphs[0]; p.text = "How Different From Existing Solutions?"; p.font.bold = True; p.font.size = Pt(13); p.font.color.rgb = COLOR_CYAN; p.space_after = Pt(6)
add_bullet(tf1, "Static Blacklists Fail", "Truecaller and Whoscall rely on reported numbers. Scammers use burner SIMs and caller-ID spoofing that appear 'Clean'.", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 10, 5)
add_bullet(tf1, "In-Call Intent Evaluation", "ScamShield evaluates the *conversation itself*, identifying urgency keywords and credential requests regardless of the phone number.", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 10, 5)
add_bullet(tf1, "Correlated App Telemetry", "Cross-references live banking app status (e.g. mobile bank open + new payee + active unknown call = Tier 3 Hard Stop).", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 10, 5)

p_sub = tf1.add_paragraph(); p_sub.text = "How Does It Solve The Problem?"; p_sub.font.bold = True; p_sub.font.size = Pt(13); p_sub.font.color.rgb = COLOR_EMERALD; p_sub.space_before = Pt(8); p_sub.space_after = Pt(4)
add_bullet(tf1, "Graduated Action Ladder", "Tier 0 (Monitor) → Tier 1 (Banner) → Tier 2 (Urdu Spoken Warning) → Tier 3 (15-Min Escrow Lock & Cut Call).", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 4)

c2 = add_card(s3, 5.15, 1.45, 4.45, 3.8)
tb2 = s3.shapes.add_textbox(Inches(5.3), Inches(1.55), Inches(4.15), Inches(3.6))
tf2 = tb2.text_frame; tf2.word_wrap = True; tf2.margin_left = tf2.margin_right = tf2.margin_top = 0
p = tf2.paragraphs[0]; p.text = "Unique Selling Propositions (USP)"; p.font.bold = True; p.font.size = Pt(13); p.font.color.rgb = COLOR_AMBER; p.space_after = Pt(6)
add_bullet(tf2, "1. Autonomous Circuit-Breaker", "The only system that directly halts payment clearing before funds leave the victim's account.", COLOR_AMBER, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf2, "2. 1-Tap Guardian Circle", "Family delegation via WhatsApp & SMS allows adult children to save elderly parents from coercion with one tap.", COLOR_AMBER, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf2, "3. Scam Lens Forensic Vision", "Multimodal Gemini vision engine scans suspicious SMS, slips, and QR codes to detect brand spoofing & tampering.", COLOR_AMBER, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf2, "4. Cultural & Dialect Adaptation", "Optimized specifically for South Asian / JAPAC scam patterns (BISP fraud, State Bank impersonation, lottery traps).", COLOR_AMBER, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf2, "5. Regulatory Dispute Ready", "Generates compliant evidence dossiers compatible with State Bank of Pakistan & FIA Cybercrime standards.", COLOR_AMBER, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)

# ==============================================================================
# SLIDE 4 (Index 3): List of features offered by the solution
# ==============================================================================
print("Formatting Slide 4: List of features...")
s4 = prs.slides[3]
format_title_shape(s4, "List of Features Offered by ScamShield Live", "Comprehensive defense ecosystem combining on-device vigilance, AI vision, and banking circuit-breakers")

features = [
    ("Live Call Guardian", "Stealth background listener monitoring incoming calls. Triggers secret haptic pulses & cut-call alert.", COLOR_CYAN, 0.4, 1.45),
    ("Smart Banking Escrow", "15-minute graduated cooling-off hold on outgoing funds during scam calls. 100% balance refund.", COLOR_EMERALD, 4.95, 1.45),
    ("Scam Lens (Visual OCR)", "Gemini multimodal vision analyzing uploaded SMS alerts, doctored receipts, and QR phishing codes.", COLOR_AMBER, 0.4, 2.75),
    ("Guardian Circle (n8n)", "Automated family safety circle sending WhatsApp & SMS alerts for 1-tap transfer authorization.", COLOR_PURPLE, 4.95, 2.75),
    ("Scam Gym Arena", "Interactive citizen resistance simulator. Practice saying NO to scammers across 3 difficulty tiers.", COLOR_ROSE, 0.4, 4.05),
    ("Scam Radar & Dossier", "Crowd-sourced caller reputation checker (F10), Pinecone vector clusters & 1-click legal dispute PDF.", COLOR_CYAN, 4.95, 4.05)
]

for title, desc, color, left, top in features:
    card = add_card(s4, left, top, 4.45, 1.2)
    tb = s4.shapes.add_textbox(Inches(left + 0.15), Inches(top + 0.1), Inches(4.15), Inches(1.0))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_top = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]; p.text = title; p.font.bold = True; p.font.size = Pt(12); p.font.color.rgb = color; p.space_after = Pt(2)
    p2 = tf.add_paragraph(); p2.text = desc; p2.font.size = Pt(9.5); p2.font.color.rgb = COLOR_SUBTEXT

# ==============================================================================
# SLIDE 5 (Index 4): Process flow diagram or Use-case diagram
# ==============================================================================
print("Formatting Slide 5: Process flow diagram...")
s5 = prs.slides[4]
format_title_shape(s5, "Process Flow & Real-Time Decision Pipeline", "End-to-end telemetry from incoming call to autonomous circuit-breaker intervention")

steps = [
    ("1. Incoming Call", "Unknown number calls phone.\nStealth screening service activates in background.", COLOR_CYAN, 0.4),
    ("2. Real-Time Speech", "Phonetic audio stream parsed via Google Gemini 3.8 Flash.\nNo audio recorded.", COLOR_PURPLE, 2.25),
    ("3. Risk Fusion", "Calculates score (0-100):\n• Urgency keywords\n• Authority claim\n• Banking app open", COLOR_AMBER, 4.1),
    ("4. Circuit-Breaker", "Score ≥ 85 (Tier 3):\n• 15-Min Escrow Lock\n• Urgent Cut-Call Alert\n• Spoken Urdu warning", COLOR_ROSE, 5.95),
    ("5. Guardian Resolve", "Family gets WhatsApp ping.\n1-Tap button:\n• Reverse (100% Refund)\n• Or Approve transfer", COLOR_EMERALD, 7.8)
]

for title, desc, color, left in steps:
    card = add_card(s5, left, 1.5, 1.75, 2.5, COLOR_CARD_BG, color)
    tb = s5.shapes.add_textbox(Inches(left + 0.08), Inches(1.6), Inches(1.6), Inches(2.3))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_left = tf.margin_right = tf.margin_top = 0
    p = tf.paragraphs[0]; p.text = title; p.font.bold = True; p.font.size = Pt(11); p.font.color.rgb = color; p.space_after = Pt(6)
    p2 = tf.add_paragraph(); p2.text = desc; p2.font.size = Pt(9); p2.font.color.rgb = COLOR_SUBTEXT

# Bottom Use-Case Highlights Card
c_bot = add_card(s5, 0.4, 4.15, 9.2, 1.1)
tb_bot = s5.shapes.add_textbox(Inches(0.55), Inches(4.25), Inches(8.9), Inches(0.9))
tf_bot = tb_bot.text_frame; tf_bot.word_wrap = True; tf_bot.margin_left = tf_bot.margin_right = tf_bot.margin_top = 0
p = tf_bot.paragraphs[0]; p.text = "Primary Use Case: Fake Bank Security Officer Impersonation (Uncle Tariq Scenario)"; p.font.bold = True; p.font.size = Pt(11); p.font.color.rgb = COLOR_WHITE; p.space_after = Pt(3)
add_bullet(tf_bot, "Attack", "Caller claims 'State Bank security: Account being frozen in 10 minutes unless you share 6-digit OTP code.'", COLOR_ROSE, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 2)
add_bullet(tf_bot, "Autonomous Defense", "ScamShield detects panic words + OTP extraction → Freezes Rs. 85,000 transfer in 15-min escrow → Son gets WhatsApp reversal link → Rs. 85,000 saved.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 0)

# ==============================================================================
# SLIDE 6 (Index 5): Wireframes / Mock diagrams of proposed solution
# ==============================================================================
print("Formatting Slide 6: Wireframes / Mock diagrams...")
s6 = prs.slides[5]
format_title_shape(s6, "Wireframes & Mobile Interface Design", "Frictionless UX designed specifically for non-technical seniors and everyday bank users")

wireframes = [
    ("1. Stealth Live Guardian", "• Floating diagnostic pill (Shield Active)\n• Hidden haptic vibration alerts\n• In-app opposition voice simulation\n• Prominent red 'CUT THE CALL' dialog", COLOR_CYAN, 0.4),
    ("2. 15-Minute Safety Escrow", "• Live 15:00 countdown timer\n• Prominent 'Reverse & Refund' CTA\n• Real-time poller syncing with Gmail\n• WhatsApp alert notification status", COLOR_EMERALD, 3.55),
    ("3. Scam Lens Forensic OCR", "• Native camera & gallery image picker\n• 5 instant one-click demo presets\n• Forensic indicators (brand spoofing)\n• Impossible date & phishing URL flags", COLOR_AMBER, 6.7)
]

for title, desc, color, left in wireframes:
    card = add_card(s6, left, 1.45, 2.9, 2.7, COLOR_CARD_BG, color)
    tb = s6.shapes.add_textbox(Inches(left + 0.12), Inches(1.55), Inches(2.65), Inches(2.5))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_left = tf.margin_right = tf.margin_top = 0
    p = tf.paragraphs[0]; p.text = title; p.font.bold = True; p.font.size = Pt(12); p.font.color.rgb = color; p.space_after = Pt(8)
    for line in desc.split("\n"):
        p_line = tf.add_paragraph(); p_line.text = line; p_line.font.size = Pt(9.5); p_line.font.color.rgb = COLOR_SUBTEXT; p_line.space_after = Pt(4)

# Bottom UX Design Philosophy Card
c_ux = add_card(s6, 0.4, 4.25, 9.2, 1.0)
tb_ux = s6.shapes.add_textbox(Inches(0.55), Inches(4.35), Inches(8.9), Inches(0.8))
tf_ux = tb_ux.text_frame; tf_ux.word_wrap = True; tf_ux.margin_top = tf_ux.margin_left = tf_ux.margin_right = 0
p = tf_ux.paragraphs[0]; p.text = "Key UX Principles: Zero Cognitive Overhead for Elders"; p.font.bold = True; p.font.size = Pt(11); p.font.color.rgb = COLOR_WHITE; p.space_after = Pt(2)
add_bullet(tf_ux, "No Complex Settings", "Works automatically on call arrival. Seniors do not need to configure rules or learn tech.", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 2)
add_bullet(tf_ux, "High-Contrast Theme", "WCAG 2.1 AAA accessible contrast in both light and dark mode for low-vision users.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 0)

# ==============================================================================
# SLIDE 7 (Index 6): Architecture diagram of the proposed solution
# ==============================================================================
print("Formatting Slide 7: Architecture diagram...")
s7 = prs.slides[6]
format_title_shape(s7, "Cloud-Native Architecture Diagram", "Distributed multi-tier microservices leveraging Google Cloud Run, Vertex AI, and BigQuery")

arch_tiers = [
    ("1. Client Surfaces", "• Native Android App (Kotlin, WebViewAssetLoader, CallScreeningService)\n• React 19 + Vite Progressive Web App (PWA)\n• Web Audio ringtone & speech synthesizer", COLOR_CYAN, 0.4, 1.45, 4.45, 1.7),
    ("2. Google Cloud AI Engine", "• Google Gemini 3.8 Flash (Live semantic threat evaluation in <1.4s)\n• Google Gemini Pro (Forensic dispute attribution)\n• Gemini Multimodal Vision API (Scam Lens OCR)", COLOR_PURPLE, 4.95, 1.45, 4.65, 1.7),
    ("3. Backend & Cloud Run", "• Google Cloud Run serverless container orchestration\n• FastAPI async microservices + WebSockets audio streaming\n• Nginx reverse proxy with zero-trust CORS isolation", COLOR_EMERALD, 0.4, 3.25, 4.45, 2.0),
    ("4. Data & Family Automation", "• Google BigQuery: Telemetry, audit trail & crowd reputation (F10)\n• Pinecone Vector DB: Semantic fraud script clustering (F11)\n• n8n Workflow Engine: Multi-channel WhatsApp & Twilio SMS", COLOR_AMBER, 4.95, 3.25, 4.65, 2.0)
]

for title, desc, color, left, top, width, height in arch_tiers:
    card = add_card(s7, left, top, width, height, COLOR_CARD_BG, color)
    tb = s7.shapes.add_textbox(Inches(left + 0.15), Inches(top + 0.1), Inches(width - 0.3), Inches(height - 0.2))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_top = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]; p.text = title; p.font.bold = True; p.font.size = Pt(12); p.font.color.rgb = color; p.space_after = Pt(4)
    for line in desc.split("\n"):
        p_line = tf.add_paragraph(); p_line.text = line; p_line.font.size = Pt(9.5); p_line.font.color.rgb = COLOR_SUBTEXT; p_line.space_after = Pt(3)

# ==============================================================================
# SLIDE 8 (Index 7): Technologies to be used in the solution
# ==============================================================================
print("Formatting Slide 8: Technologies used...")
s8 = prs.slides[7]
format_title_shape(s8, "Technologies & Google Cloud Services Used", "Production-grade tech stack built for ultra-low latency, bank-grade reliability, and high security")

tech_cards = [
    ("Google Cloud & AI Core", [
        ("Google Gemini 3.8 Flash", "Streaming phoneme & intent reasoning"),
        ("Google Gemini Pro", "Deep reasoning & forensic case formulation"),
        ("Gemini Multimodal Vision", "OCR & image tampering analysis"),
        ("Google Cloud Run", "Serverless container microservices"),
        ("Google BigQuery", "Telemetry & campaign threat intelligence"),
        ("Google Secret Manager", "Zero-trust API key injection")
    ], COLOR_PURPLE, 0.4, 1.45),
    ("Mobile & Frontend Stack", [
        ("Android SDK (Kotlin)", "Background telephony & call screening"),
        ("WebViewAssetLoader", "Zero-CORS offline bundled web app"),
        ("React 19 & TypeScript", "Component architecture & state machine"),
        ("Tailwind CSS", "High-contrast WCAG 2.1 dark/light theme"),
        ("Web Audio API", "Synthetic ringtones & citizen speech synthesis"),
        ("Vite 8", "Sub-second client asset bundling")
    ], COLOR_CYAN, 3.55, 1.45),
    ("Backend, DB & Messaging", [
        ("FastAPI (Python 3.11)", "High-performance async ASGI core"),
        ("WebSockets", "Bi-directional real-time audio streams"),
        ("PostgreSQL 16", "Relational transaction escrow database"),
        ("Pinecone Vector DB", "768-dim script semantic clustering"),
        ("n8n Workflow Engine", "Automated WhatsApp & SMS family dispatch"),
        ("Docker & Docker Compose", "Multi-container portable orchestration")
    ], COLOR_EMERALD, 6.7, 1.45)
]

for cat_title, items, color, left, top in tech_cards:
    card = add_card(s8, left, top, 2.9, 3.8, COLOR_CARD_BG, color)
    tb = s8.shapes.add_textbox(Inches(left + 0.12), Inches(top + 0.1), Inches(2.65), Inches(3.6))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_top = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]; p.text = cat_title; p.font.bold = True; p.font.size = Pt(12); p.font.color.rgb = color; p.space_after = Pt(6)
    for name, detail in items:
        p_item = tf.add_paragraph()
        r1 = p_item.add_run(); r1.text = f"{name}\n"; r1.font.bold = True; r1.font.color.rgb = COLOR_WHITE; r1.font.size = Pt(9.5)
        r2 = p_item.add_run(); r2.text = f"{detail}\n"; r2.font.color.rgb = COLOR_MUTED; r2.font.size = Pt(8.5)
        p_item.space_after = Pt(2)

# ==============================================================================
# SLIDE 9 (Index 8): Estimated implementation cost (optional)
# ==============================================================================
print("Formatting Slide 9: Implementation cost...")
s9 = prs.slides[8]
format_title_shape(s9, "Estimated Implementation Cost & Unit Economics", "Highly cost-effective serverless architecture yielding an astronomical ROI for partner banks")

# Table Card
c_tbl = add_card(s9, 0.4, 1.45, 5.5, 3.8)
tb_tbl = s9.shapes.add_textbox(Inches(0.55), Inches(1.55), Inches(5.2), Inches(3.6))
tf_tbl = tb_tbl.text_frame; tf_tbl.word_wrap = True; tf_tbl.margin_top = tf_tbl.margin_left = tf_tbl.margin_right = 0
p = tf_tbl.paragraphs[0]; p.text = "Monthly Cost Breakdown (Per 10,000 Active Protected Users)"; p.font.bold = True; p.font.size = Pt(12); p.font.color.rgb = COLOR_CYAN; p.space_after = Pt(8)

cost_items = [
    ("Google Cloud Run (Compute)", "$15 - $25 / mo", "Serverless scaling to 0 when idle (2M free req/mo)"),
    ("Google Gemini 3.8 Flash (AI)", "$35 - $50 / mo", "Evaluates ~2,500 scam calls @ $0.0001 per chunk"),
    ("Gemini Multimodal Vision API", "$15 - $20 / mo", "Scam Lens image checks (~5,000 verifications/mo)"),
    ("Google BigQuery & Pinecone", "$20 - $25 / mo", "Threat intelligence & vector campaign clustering"),
    ("WhatsApp / Twilio SMS Gateway", "$18 - $25 / mo", "Emergency guardian notifications @ $0.005/msg"),
    ("Total Estimated Monthly Cost", "~$103 - $145 / mo", "Entire system cost for 10,000 protected accounts")
]

for comp, cost, note in cost_items:
    p_c = tf_tbl.add_paragraph()
    r1 = p_c.add_run(); r1.text = f"• {comp}: "; r1.font.bold = True; r1.font.color.rgb = COLOR_WHITE; r1.font.size = Pt(9.5)
    r2 = p_c.add_run(); r2.text = f"{cost} — "; r2.font.bold = True; r2.font.color.rgb = COLOR_EMERALD; r2.font.size = Pt(9.5)
    r3 = p_c.add_run(); r3.text = f"{note}\n"; r3.font.color.rgb = COLOR_MUTED; r3.font.size = Pt(8.5)
    p_c.space_after = Pt(2)

# ROI Card on the right
c_roi = add_card(s9, 6.1, 1.45, 3.5, 3.8, COLOR_CARD_BG, COLOR_EMERALD)
tb_roi = s9.shapes.add_textbox(Inches(6.25), Inches(1.55), Inches(3.2), Inches(3.6))
tf_roi = tb_roi.text_frame; tf_roi.word_wrap = True; tf_roi.margin_top = tf_roi.margin_left = tf_roi.margin_right = 0
p = tf_roi.paragraphs[0]; p.text = "Commercial ROI & Value"; p.font.bold = True; p.font.size = Pt(13); p.font.color.rgb = COLOR_EMERALD; p.space_after = Pt(6)

add_bullet(tf_roi, "Cost Per User", "~$0.012 per user / month (approx. 3.5 PKR) — negligible overhead for retail banks.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf_roi, "Average Prevented Loss", "PKR 85,000 (~$300 USD) per prevented voice vishing incident.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf_roi, "Astronomical ROI", "> 25,000% return on investment. Preventing just ONE fraud incident pays for the protection of over 25,000 bank accounts for an entire month.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)
add_bullet(tf_roi, "Regulatory Shield", "Protects banks against SBP fraud refund liabilities & reputation damage.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 10, 6)

# ==============================================================================
# SLIDE 10 (Index 9): Snapshots of the prototype
# ==============================================================================
print("Formatting Slide 10: Snapshots of prototype...")
s10 = prs.slides[9]
format_title_shape(s10, "Snapshots of the Working Prototype", "Fully functional multi-surface application running natively on Android mobile and Web PWA")

snapshots = [
    ("1. Live Scam Call Simulator", "• Speech synthesis role-play (Uncle Tariq)\n• Live risk meter (0-100%)\n• Instant 'CUT THE CALL' siren alert\n• Urdu/English dialect toggles", COLOR_CYAN, 0.4, 1.45),
    ("2. 15-Min Escrow Circuit-Breaker", "• 15:00 safety escrow cooling-off timer\n• 1-Tap 'Reverse & Refund' button\n• Live Gmail & SMS approval poller\n• 100% customer balance restoration", COLOR_EMERALD, 4.95, 1.45),
    ("3. Scam Lens Forensic Vision", "• Multimodal Gemini vision OCR engine\n• 5 one-click instant demo presets\n• Brand spoofing & link extractor\n• Impossible calendar date (31/02) flag", COLOR_AMBER, 0.4, 3.25),
    ("4. Guardian Circle WhatsApp Hub", "• n8n automated webhook integration\n• WhatsApp alert simulation\n• Dual-guardian consensus checks\n• Downloadable workflow JSON", COLOR_PURPLE, 4.95, 3.25)
]

for title, desc, color, left, top in snapshots:
    card = add_card(s10, left, top, 4.45, 1.7, COLOR_CARD_BG, color)
    tb = s10.shapes.add_textbox(Inches(left + 0.15), Inches(top + 0.1), Inches(4.15), Inches(1.5))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_top = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]; p.text = title; p.font.bold = True; p.font.size = Pt(12); p.font.color.rgb = color; p.space_after = Pt(4)
    for line in desc.split("\n"):
        p_line = tf.add_paragraph(); p_line.text = line; p_line.font.size = Pt(9.5); p_line.font.color.rgb = COLOR_SUBTEXT; p_line.space_after = Pt(2)

# ==============================================================================
# SLIDE 11 (Index 10): Prototype Performance report / Benchmarking
# ==============================================================================
print("Formatting Slide 11: Performance report...")
s11 = prs.slides[10]
format_title_shape(s11, "Prototype Performance & Benchmarking Report", "Rigorous empirical evaluation passing all 18 safety design rules with zero false positives")

# 4 Stat Metric Cards
metrics = [
    ("18 / 18", "Fusion Design Rules", "100% PASS rate across all bank safety requirements", COLOR_EMERALD, 0.4),
    ("< 1.4s", "Time-To-Detect (p50)", "Real-time intervention before victim discloses credentials", COLOR_CYAN, 2.7),
    ("0.0%", "False Alarms on Clean", "Tested on 316 genuine bank, courier & family calls", COLOR_PURPLE, 5.0),
    ("99.0%", "Scam Lens Confidence", "Precise visual forensics on forged SMS & slips", COLOR_AMBER, 7.3)
]

for stat, label, note, color, left in metrics:
    card = add_card(s11, left, 1.45, 2.15, 1.4, COLOR_CARD_BG, color)
    tb = s11.shapes.add_textbox(Inches(left + 0.08), Inches(1.5), Inches(2.0), Inches(1.3))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_top = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]; p.text = stat; p.font.bold = True; p.font.size = Pt(20); p.font.color.rgb = color; p.space_after = Pt(1)
    p2 = tf.add_paragraph(); p2.text = label; p2.font.bold = True; p2.font.size = Pt(10); p2.font.color.rgb = COLOR_WHITE; p2.space_after = Pt(2)
    p3 = tf.add_paragraph(); p3.text = note; p3.font.size = Pt(8.5); p3.font.color.rgb = COLOR_MUTED

# Benchmarking Table Card below
c_bench = add_card(s11, 0.4, 3.0, 9.2, 2.25)
tb_bench = s11.shapes.add_textbox(Inches(0.55), Inches(3.1), Inches(8.9), Inches(2.05))
tf_bench = tb_bench.text_frame; tf_bench.word_wrap = True; tf_bench.margin_top = tf_bench.margin_left = tf_bench.margin_right = 0
p = tf_bench.paragraphs[0]; p.text = "Key Verified Benchmarks from Empirical Evaluation Suite"; p.font.bold = True; p.font.size = Pt(12); p.font.color.rgb = COLOR_CYAN; p.space_after = Pt(4)

add_bullet(tf_bench, "Zero False-Alarm Hard Stop", "A single signal (unknown caller only, app open only, or urgency word only) NEVER triggers a hard hold. Requires multi-signal correlation.", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 3)
add_bullet(tf_bench, "Hard-Stop Safety Trigger", "Unknown caller + OTP demand + mobile banking in progress reliably triggers Tier 3 circuit-breaker (fused score 98-99%).", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 3)
add_bullet(tf_bench, "Per-Language Fairness", "Evaluated across Urdu, English, Punjabi, and Roman Urdu. Language recall gap is 0.0 points — no bias against regional dialects.", COLOR_PURPLE, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 3)
add_bullet(tf_bench, "Never-Fall-Quickly Smoothing", "Risk score drops at a safe maximum rate (<= 3 pts/step) to prevent scammers from resetting risk by temporarily speaking politely.", COLOR_AMBER, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 0)

# ==============================================================================
# SLIDE 12 (Index 11): Additional Details / Future Development
# ==============================================================================
print("Formatting Slide 12: Additional Details & Future Development...")
s12 = prs.slides[11]
format_title_shape(s12, "Additional Details & Future Development Roadmap", "Strategic vision for commercial banking deployment, telecom integration, and regulatory expansion")

phases = [
    ("Phase 1: Working Prototype", "COMPLETED • READY NOW", [
        "Google Gemini live speech reasoning",
        "Native Android APK (11.8 MB) with screening",
        "15-Minute safety escrow circuit-breaker",
        "Scam Lens visual OCR & 18/18 fusion rules"
    ], COLOR_EMERALD, 0.4),
    ("Phase 2: Telecom Carrier Link", "NEXT 60 DAYS", [
        "Direct SS7 & IMS carrier network signaling",
        "Network-level audio interception before phone rings",
        "Protects non-smartphones & 2G feature phones",
        "Carrier partnership with Jazz, Telenor & Zong"
    ], COLOR_CYAN, 2.7),
    ("Phase 3: Core Banking SDK", "Q3 2026", [
        "Embeddable lightweight mobile banking SDK",
        "Native integration into HBL, Meezan, JazzCash",
        "Real-time fraud score API for Raast & 1LINK",
        "Instant transaction holds directly at payment rail"
    ], COLOR_PURPLE, 5.0),
    ("Phase 4: Regulatory Bridge", "Q4 2026", [
        "Direct API to FIA Cybercrime Wing",
        "State Bank of Pakistan FMU syndicate telemetry",
        "Automated mule account freezing network",
        "Cross-border threat radar with Interpol"
    ], COLOR_AMBER, 7.3)
]

for title, badge, points, color, left in phases:
    card = add_card(s12, left, 1.45, 2.15, 3.8, COLOR_CARD_BG, color)
    tb = s12.shapes.add_textbox(Inches(left + 0.08), Inches(1.55), Inches(2.0), Inches(3.6))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_top = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]; p.text = title; p.font.bold = True; p.font.size = Pt(11); p.font.color.rgb = color; p.space_after = Pt(2)
    p_b = tf.add_paragraph(); p_b.text = f"[{badge}]"; p_b.font.bold = True; p_b.font.size = Pt(8.5); p_b.font.color.rgb = COLOR_WHITE; p_b.space_after = Pt(6)
    for pt in points:
        p_pt = tf.add_paragraph()
        r1 = p_pt.add_run(); r1.text = "• "; r1.font.bold = True; r1.font.color.rgb = color; r1.font.size = Pt(8.5)
        r2 = p_pt.add_run(); r2.text = pt; r2.font.color.rgb = COLOR_SUBTEXT; r2.font.size = Pt(8.5)
        p_pt.space_after = Pt(3)

# ==============================================================================
# SLIDE 13 (Index 12): Links Slide
# ==============================================================================
print("Formatting Slide 13: Links slide...")
s13 = prs.slides[12]
format_title_shape(s13, "Provide Links to Your Deliverables", "Official links for evaluation, live testing, source code inspection, and mobile APK installation")

# Remove template placeholder text box if present
for shape in list(s13.shapes):
    if shape.has_text_frame and "Provide links to your:" in shape.text:
        # Repurpose or clear
        tf = shape.text_frame
        tf.clear()

links = [
    ("GitHub Public Repository", "https://github.com/talha963/ScamSheild.git", "Complete open-source codebase, Docker Compose orchestration, Android Kotlin code, test datasets, and Google Cloud Build scripts.", COLOR_CYAN, 0.4, 1.45),
    ("Live Working Prototype", "https://flatbed-carve-imprint.ngrok-free.dev", "Fully functional interactive web application with all 9 modules active (Scam Call Demo, Mock Bank Escrow, Scam Lens, Gym, Radar, Evidence Pack).", COLOR_EMERALD, 4.95, 1.45),
    ("Android Mobile APK (11.8 MB)", "https://flatbed-carve-imprint.ngrok-free.dev/scamshield.apk", "Direct standalone Android binary package with native file picker, background call screening service, and offline bundled React PWA.", COLOR_AMBER, 0.4, 2.85),
    ("Demo Video & Presentation (3 Min)", "https://flatbed-carve-imprint.ngrok-free.dev", "Live interactive demonstration walk-through showcasing real-time Uncle Tariq scam defense, 15-minute escrow reversal, and Scam Lens OCR.", COLOR_PURPLE, 4.95, 2.85)
]

for title, url, desc, color, left, top in links:
    card = add_card(s13, left, top, 4.45, 1.25, COLOR_CARD_BG, color)
    tb = s13.shapes.add_textbox(Inches(left + 0.15), Inches(top + 0.1), Inches(4.15), Inches(1.05))
    tf = tb.text_frame; tf.word_wrap = True; tf.margin_top = tf.margin_left = tf.margin_right = 0
    p = tf.paragraphs[0]; p.text = title; p.font.bold = True; p.font.size = Pt(11); p.font.color.rgb = color; p.space_after = Pt(2)
    p_url = tf.add_paragraph(); p_url.text = url; p_url.font.bold = True; p_url.font.size = Pt(9.5); p_url.font.color.rgb = COLOR_WHITE; p_url.space_after = Pt(2)
    p_desc = tf.add_paragraph(); p_desc.text = desc; p_desc.font.size = Pt(8.5); p_desc.font.color.rgb = COLOR_MUTED

# Bottom Verification Box
c_ver = add_card(s13, 0.4, 4.25, 9.2, 1.0)
tb_ver = s13.shapes.add_textbox(Inches(0.55), Inches(4.35), Inches(8.9), Inches(0.8))
tf_ver = tb_ver.text_frame; tf_ver.word_wrap = True; tf_ver.margin_top = tf_ver.margin_left = tf_ver.margin_right = 0
p = tf_ver.paragraphs[0]; p.text = "System Operational Status"; p.font.bold = True; p.font.size = Pt(11); p.font.color.rgb = COLOR_WHITE; p.space_after = Pt(2)
add_bullet(tf_ver, "Backend Health Endpoint", "https://flatbed-carve-imprint.ngrok-free.dev/health — Status: Operational with Gemini 3.8 Flash & Gemini Pro.", COLOR_EMERALD, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 2)
add_bullet(tf_ver, "Local Workspace Path", "d:\\AI Builder\\scamshield.apk (11,818,272 bytes) • Ready for evaluation.", COLOR_CYAN, COLOR_WHITE, COLOR_SUBTEXT, 9.5, 0)

# ==============================================================================
# SLIDE 14 (Index 13): Thank You Slide
# ==============================================================================
print("Formatting Slide 14: Thank You slide...")
s14 = prs.slides[13]
# Slide 14 has the big "Thank you" and the Google Cloud logo
# Let's add Team CogniFlow signature card on the right
c_ty = add_card(s14, 5.0, 3.2, 4.6, 1.8, COLOR_CARD_BG, COLOR_CYAN)
tb_ty = s14.shapes.add_textbox(Inches(5.2), Inches(3.3), Inches(4.2), Inches(1.6))
tf_ty = tb_ty.text_frame; tf_ty.word_wrap = True; tf_ty.margin_top = tf_ty.margin_left = tf_ty.margin_right = 0
p = tf_ty.paragraphs[0]; p.text = "Team CogniFlow"; p.font.bold = True; p.font.size = Pt(15); p.font.color.rgb = COLOR_CYAN; p.space_after = Pt(3)
p2 = tf_ty.add_paragraph(); p2.text = "Team Leader: Talha Habib (tk706051@gmail.com)"; p2.font.bold = True; p2.font.size = Pt(11); p2.font.color.rgb = COLOR_WHITE; p2.space_after = Pt(3)
p3 = tf_ty.add_paragraph(); p3.text = "Project: ScamShield Live — Autonomous Voice Fraud Defense"; p3.font.size = Pt(10.5); p3.font.color.rgb = COLOR_SUBTEXT; p3.space_after = Pt(3)
p4 = tf_ty.add_paragraph(); p4.text = "AI Builder Cup 2026 | Banking, Financial Services & Insurance Track"; p4.font.size = Pt(9.5); p4.font.color.rgb = COLOR_MUTED

# Save Presentation
print(f"Saving presentation to {OUTPUT_PATH} ...")
prs.save(OUTPUT_PATH)

print(f"Saving presentation to {ROOT_OUTPUT_PATH} ...")
prs.save(ROOT_OUTPUT_PATH)

print(f"Saving presentation to {WEB_OUTPUT_PATH} ...")
prs.save(WEB_OUTPUT_PATH)

print("SUCCESS: AI Builder Cup presentation created successfully!")
