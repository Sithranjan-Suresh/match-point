"""MatchPoint FastAPI backend: serves pre-computed JSON, plus a live Groq-backed Q&A endpoint."""
import json
import os
import time
from collections import deque
from pathlib import Path

from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DATA_DIR = Path(__file__).resolve().parent / "data" / "computed"
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

app = FastAPI(title="MatchPoint API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_tournament_summary: dict = {}
_matches_index: list[dict] = []
_match_details: dict[int, dict] = {}


def _load_data() -> None:
    global _tournament_summary, _matches_index, _match_details

    with open(DATA_DIR / "tournament_summary.json", "r", encoding="utf-8") as f:
        _tournament_summary = json.load(f)

    with open(DATA_DIR / "matches_index.json", "r", encoding="utf-8") as f:
        _matches_index = json.load(f)

    _match_details = {}
    for match_file in DATA_DIR.glob("match_*.json"):
        with open(match_file, "r", encoding="utf-8") as f:
            detail = json.load(f)
        _match_details[detail["match_id"]] = detail


@app.on_event("startup")
def startup() -> None:
    _load_data()


@app.middleware("http")
async def add_cache_control(request: Request, call_next):
    """Pre-computed GET data is safe to cache aggressively; live answers are not."""
    response = await call_next(request)
    if request.url.path.startswith("/api/") and request.method == "GET":
        response.headers["Cache-Control"] = "public, max-age=86400"
    return response


@app.get("/api/tournament")
def get_tournament() -> dict:
    """Return tournament-wide aggregate findings across all 64 matches."""
    return _tournament_summary


@app.get("/api/matches")
def get_matches(stage: Optional[str] = None) -> list[dict]:
    """Return all 64 match summaries, optionally filtered by stage."""
    if stage is None:
        return _matches_index
    return [m for m in _matches_index if m["stage"] == stage]


@app.get("/api/matches/{match_id}")
def get_match(match_id: int) -> dict:
    """Return the full match_detail object for a given match."""
    detail = _match_details.get(match_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"match_id {match_id} not found")
    return detail


# ---------- Ask the analyst (live Groq Q&A grounded in match data) ----------

ASK_SYSTEM_PROMPT = (
    "You are MatchPoint's resident analyst. You answer questions about one specific "
    "2022 World Cup match using ONLY the simulation data provided: a rolling win-probability "
    "timeline (from xG-state Monte Carlo simulation, 10,000 iterations per moment), the "
    "detected MatchPoint (the single largest probability swing), and its counterfactual. "
    "Be specific, analytical, and conversational — 2 to 5 sentences. Cite minutes and "
    "probability figures from the data. All probabilities in the data refer to the HOME "
    "team's chance of winning unless stated otherwise — never invert them. Never mention "
    "internal field names or method tags. If the data cannot answer the question, say "
    "exactly what the data does and doesn't cover instead of guessing."
)

_ask_timestamps_by_client: dict[str, deque] = {}
ASK_RATE_LIMIT_PER_MINUTE = 10


def _ask_rate_limited(client_id: str) -> bool:
    """Per-client (IP) sliding-window rate limit, so one visitor can't starve
    the shared demo endpoint for everyone else viewing concurrently."""
    now = time.time()
    timestamps = _ask_timestamps_by_client.setdefault(client_id, deque(maxlen=ASK_RATE_LIMIT_PER_MINUTE))
    while timestamps and now - timestamps[0] > 60:
        timestamps.popleft()
    if len(timestamps) >= ASK_RATE_LIMIT_PER_MINUTE:
        return True
    timestamps.append(now)
    return False


def _build_match_context(detail: dict) -> str:
    mp = detail["matchpoint"]
    events = [e for e in detail["timeline"] if e.get("annotate")]
    events = sorted(events, key=lambda e: abs(e.get("delta", 0)), reverse=True)[:25]
    events.sort(key=lambda e: (e["minute"], e["second"]))
    event_lines = "\n".join(
        f"  {e['minute']}' {e['event_type']} — {e['player']} ({e['team']}): "
        f"home win {e['prob_home']}%, swing {e['delta']:+.1f}"
        for e in events
    )
    return (
        f"Match: {detail['home_team']} vs {detail['away_team']}, {detail['stage']}, 2022 World Cup\n"
        f"Final score: {detail['score_home']}-{detail['score_away']}"
        f"{' (decided on penalties)' if detail.get('decided_on_penalties') else ''}\n"
        f"MatchPoint: minute {mp['minute']}, {mp['event_type']} by {mp['player']} ({mp['team']}), "
        f"home win probability {mp['prob_home_before']}% -> {mp['prob_home_after']}% "
        f"(swing {mp['delta']:+.1f})\n"
        f"Counterfactual (moment flipped): {detail['home_team']}'s win probability would have been "
        f"{mp['counterfactual_prob_home_at_moment']}% at that moment, and "
        f"{mp['counterfactual_prob_home_final']}% for {detail['home_team']} at the final whistle\n"
        f"Narrative: {detail.get('narrative', '')}\n"
        f"Key events (home win % after each):\n{event_lines}"
    )


class AskRequest(BaseModel):
    question: str


@app.post("/api/matches/{match_id}/ask")
def ask_match(match_id: int, req: AskRequest, request: Request) -> dict:
    """Answer a free-form question about a match, grounded in its simulation data."""
    detail = _match_details.get(match_id)
    if detail is None:
        raise HTTPException(status_code=404, detail=f"match_id {match_id} not found")

    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=422, detail="Ask a question about the match.")
    if len(question) > 300:
        raise HTTPException(status_code=422, detail="Keep questions under 300 characters.")

    client_id = request.client.host if request.client else "unknown"
    if _ask_rate_limited(client_id):
        raise HTTPException(status_code=429, detail="You're asking fast — give it a few seconds.")

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="The analyst is offline (no API key configured).")

    from groq import Groq

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            max_tokens=320,
            messages=[
                {"role": "system", "content": ASK_SYSTEM_PROMPT},
                {"role": "user", "content": f"{_build_match_context(detail)}\n\nQuestion: {question}"},
            ],
        )
    except Exception:
        raise HTTPException(status_code=502, detail="The analyst couldn't be reached — try again.")

    return {"answer": response.choices[0].message.content.strip()}
