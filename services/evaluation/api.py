"""
Evaluation API (PDF Section 8) - lets the dashboard run the benchmark, read the measured report,
collect user-comprehension answers, and "speak & evaluate" a live utterance.

  POST /v1/evaluation/analyze          one spoken sentence -> extracted signals + fused score/tier
  POST /v1/evaluation/run              start the benchmark in the background (?quick=true for a sample)
  GET  /v1/evaluation/status           progress of the running/last benchmark
  GET  /v1/evaluation/report           latest measured report (JSON)
  GET  /v1/evaluation/comprehension    questionnaire + current tester summary
  POST /v1/evaluation/comprehension    record one tester's answers
  DELETE /v1/evaluation/comprehension  clear tester answers
"""
import json
import threading
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ml.evaluation.evaluators import (
    COMP_QUESTION, comprehension_add, comprehension_reset, comprehension_summary,
)
from ml.evaluation.pipeline import analyze_utterance
from services.analysis.gemini_engine import GeminiAnalysisEngine
from services.shared.schemas import CallContext

router = APIRouter(prefix="/v1/evaluation", tags=["evaluation"])

REPORT_PATH = Path(__file__).resolve().parents[2] / "reports" / "evaluation_report.json"
_engine = GeminiAnalysisEngine()
_state = {"running": False, "done": 0, "total": 0, "error": None, "mode": None}
_lock = threading.Lock()


class UtteranceRequest(BaseModel):
    text: str = Field(min_length=1, max_length=2000, description="What the caller said (typed or speech-to-text)")
    language_hint: Optional[str] = None
    unknown_caller: bool = True
    banking_app_open: bool = False
    new_payee: bool = False
    amount_vs_history: float = 1.0


class ComprehensionAnswer(BaseModel):
    tester: Optional[str] = None
    language: str = "en"
    q1: int
    q2: int


@router.post("/analyze")
def analyze(req: UtteranceRequest):
    ctx = CallContext(unknown_caller=req.unknown_caller, banking_app_open=req.banking_app_open,
                      new_payee=req.new_payee, amount_vs_history=req.amount_vs_history)
    return analyze_utterance(req.text, _engine, ctx, req.language_hint)


def _worker(quick: bool, regenerate: bool):
    from ml.evaluation.run_evaluation import run_all

    def progress(done, total):
        _state.update(done=done, total=total)

    try:
        run_all(regenerate=regenerate, quick=quick, progress=progress)
        _state.update(error=None)
    except Exception as e:  # surfaced to the UI
        _state.update(error=str(e))
    finally:
        _state.update(running=False)


@router.post("/run")
def run(quick: bool = False, regenerate: bool = False):
    with _lock:
        if _state["running"]:
            raise HTTPException(status_code=409, detail="An evaluation run is already in progress.")
        _state.update(running=True, done=0, total=0, error=None, mode="quick" if quick else "full")
    threading.Thread(target=_worker, args=(quick, regenerate), daemon=True).start()
    return {"started": True, "mode": _state["mode"]}


@router.get("/status")
def status():
    return dict(_state)


@router.get("/report")
def report():
    if not REPORT_PATH.exists():
        raise HTTPException(status_code=404, detail="No report yet. POST /v1/evaluation/run first.")
    return json.loads(REPORT_PATH.read_text(encoding="utf-8"))


@router.get("/comprehension")
def comprehension():
    return {"question": COMP_QUESTION, "summary": comprehension_summary()}


@router.post("/comprehension")
def comprehension_submit(ans: ComprehensionAnswer):
    return {"recorded": comprehension_add(ans.model_dump()), "summary": comprehension_summary()}


@router.delete("/comprehension")
def comprehension_clear():
    comprehension_reset()
    return {"cleared": True}
