from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import json
import logging
from datetime import datetime, timezone
from services.shared.schemas import CallContext, AcousticSignals, RiskEvent
from services.analysis.gemini_engine import GeminiAnalysisEngine
from services.fusion.risk_fusion import RiskFusionEngine

logger = logging.getLogger("scamshield.gateway")
router = APIRouter()

analysis_engine = GeminiAnalysisEngine()
fusion_engine = RiskFusionEngine()

# Active call session tracking
active_sessions: Dict[str, dict] = {}

@router.websocket("/v1/calls/{call_id}/audio")
async def audio_stream_endpoint(websocket: WebSocket, call_id: str):
    await websocket.accept()
    logger.info(f"WebSocket client connected for call session: {call_id}")

    session = {
        "call_id": call_id,
        "started_at": datetime.now(timezone.utc),
        "consent_verified": True,
        "rolling_transcript": [],
        "context": CallContext(unknown_caller=True, banking_app_open=False, new_payee=False, amount_vs_history=1.0),
        "acoustic": AcousticSignals(synthetic_voice=0.05, call_center_noise=0.4, pressure_tempo=0.5)
    }
    active_sessions[call_id] = session

    try:
        while True:
            # Receive audio chunk or transcript payload
            message_text = await websocket.receive_text()
            data = json.loads(message_text)

            msg_type = data.get("type", "audio_chunk")

            if msg_type == "consent":
                session["consent_verified"] = data.get("consent", True)
                await websocket.send_json({"status": "consent_recorded", "call_id": call_id})

            elif msg_type == "telemetry":
                # Context telemetry from banking app
                ctx_data = data.get("context", {})
                session["context"] = CallContext(**ctx_data)

            elif msg_type == "transcript_chunk":
                chunk_text = data.get("text", "")
                timestamp_s = data.get("timestamp_s", 0)

                session["rolling_transcript"].append(chunk_text)
                # Keep rolling 20s window
                window_text = " ".join(session["rolling_transcript"][-4:])

                # 1. Run Gemini Linguistic Analysis
                analysis_result = analysis_engine.analyze_window(window_text)

                # 2. Run Multi-signal Risk Fusion
                risk_event: RiskEvent = fusion_engine.fuse_signals(
                    call_id=call_id,
                    t_offset_s=timestamp_s,
                    linguistic_analysis=analysis_result,
                    context=session["context"],
                    acoustic=session["acoustic"]
                )

                # 3. Stream Risk Event back to client
                await websocket.send_json({
                    "type": "risk_event",
                    "event": risk_event.model_dump()
                })

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from call session: {call_id}")
        active_sessions.pop(call_id, None)
    except Exception as e:
        logger.error(f"Error in audio streaming gateway: {e}")
        await websocket.close()
