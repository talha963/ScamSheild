import base64
import io
import json
import time
import logging
from typing import Optional, Dict, Any, List
from PIL import Image
from services.shared.config import settings
from services.shared.schemas import ScamLensAnalysisResponse

logger = logging.getLogger("scamshield.lens")

FALLBACK_MODELS = ["gemini-flash-latest", "gemini-3.5-flash"]

LENS_PROMPT = """SYSTEM:
You are ScamShield Lens, an expert computer vision forensic engine that inspects screenshots of SMS, WhatsApp messages, payment receipts, QR codes, and banking screens for fraud indicators.

Check for:
1. Urgency coercion & threats (e.g. account blocking within hours).
2. Lookalike / spoofed sender IDs or banking names (HBL, Meezan, JazzCash, Easypaisa, State Bank).
3. Phishing URLs, suspicious shortlinks (bit.ly, lookalike domains).
4. Doctored / tampered payment receipts: misaligned font, mismatched dates, fake transaction IDs.

Return JSON ONLY:
{
  "verdict": "safe" | "suspicious" | "scam",
  "confidence": 0.0-1.0,
  "detected_text": "Extracted OCR text",
  "extracted_links": ["list", "of", "links"],
  "tampering_detected": true | false,
  "spoofed_brand": "Brand name or null",
  "reasons": ["Forensic explanation list"],
  "qr_destination": "Decoded URL or null"
}
"""

class ScamLensEngine:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize GenAI Vision: {e}")

    def analyze_image_bytes(self, image_bytes: bytes,
                            mime_type: str = "image/jpeg") -> ScamLensAnalysisResponse:
        """
        Processes image through Gemini Vision and forensic filters.
        """
        # Load image via PIL to verify validity
        try:
            image = Image.open(io.BytesIO(image_bytes))
        except Exception as e:
            return ScamLensAnalysisResponse(
                verdict="suspicious",
                confidence=0.5,
                detected_text="Unreadable image format",
                extracted_links=[],
                tampering_detected=False,
                spoofed_brand=None,
                reasons=[f"Invalid or corrupted image format: {e}"]
            )

        if self.client:
            from google.genai import types

            # PIL knows the real format; the browser's content-type can be missing or wrong.
            detected = f"image/{(image.format or '').lower()}" if image.format else mime_type
            if detected not in ("image/jpeg", "image/png", "image/webp", "image/heic", "image/gif"):
                detected = "image/jpeg"

            contents = [types.Content(role="user", parts=[
                types.Part.from_text(text=LENS_PROMPT),
                types.Part.from_bytes(data=image_bytes, mime_type=detected),
            ])]

            # The flash models return 503 under load often enough to matter in a live demo,
            # so try every model twice with a pause before admitting defeat.
            models = list(dict.fromkeys([settings.GEMINI_MODEL_LIVE, *FALLBACK_MODELS]))
            for attempt, model in enumerate(models * 2):
                if attempt == len(models):
                    time.sleep(2)
                try:
                    response = self.client.models.generate_content(
                        model=model, contents=contents,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json", temperature=0),
                    )
                    return ScamLensAnalysisResponse(**json.loads(response.text.strip()))
                except Exception as err:
                    logger.warning(f"Scam Lens failed on {model}: {err}")

            # Reached only when the model was available but every call failed.
            return self._heuristic_fallback(image, busy=True)

        # Heuristic fallback for offline demo
        return self._heuristic_fallback(image)

    def _heuristic_fallback(self, image: Optional[Image.Image],
                            busy: bool = False) -> ScamLensAnalysisResponse:
        """
        Without a vision model we genuinely cannot read the image, so we must not pretend to.
        Claiming "scam" for every upload would be worse than useless: one judge uploading a
        harmless photo would show the whole verdict is theatre.

        `busy` separates "the AI is overloaded, try again" from "no key is configured", because
        the fix is completely different.
        """
        reasons = (
            ["The AI vision service is busy right now. Please try the image again in a moment."]
            if busy
            else [
                "This image was not analysed: the server has no AI vision key configured.",
                "Set GEMINI_API_KEY on the server to get a real verdict.",
            ]
        )
        return ScamLensAnalysisResponse(
            verdict="suspicious",
            confidence=0.0,
            detected_text="",
            extracted_links=[],
            tampering_detected=False,
            spoofed_brand=None,
            reasons=reasons,
            qr_destination=None,
        )
